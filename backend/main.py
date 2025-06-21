from fastapi import FastAPI, File, UploadFile, Form, Request, Body, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import shutil
import torch
from PIL import Image
import io
import cv2
import numpy as np
import base64
import json
import random
from sklearn.cluster import KMeans
import speech_recognition as sr
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, Boolean, Float, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from sqlalchemy.sql import text

# Import des modèles SQLAlchemy
# Renommer l'import pour éviter le conflit avec le module 'models' de YOLOv5
import database_models as db_models

# Récupérer le dossier actuel et l'ajouter au PATH pour éviter les conflits d'importation
import sys
sys.path.insert(0, os.getcwd())

# Définir les modèles de requêtes pour l'API
class SpeechRecognitionRequest(BaseModel):
    audio_data: str
    language: str = "fr-FR"

class HandGestureRequest(BaseModel):
    image_data: str

class ActivityLogRequest(BaseModel):
    user_id: int
    activity_type: str
    details: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = "enfant"

# Configuration de la base de données
DATABASE_URL = "mysql+pymysql://root:@localhost/toy_helper_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

DEFAULT_USER_ID = 1 # Utilisateur par défaut pour le mode mono-utilisateur
USE_CUSTOM_MODEL = False # Si True, utilisera le modèle personnalisé au lieu du modèle par défaut
CUSTOM_MODEL_PATH = "models/custom_yolov5_toys.pt" # Chemin vers le modèle personnalisé
# Mode test pour éviter les erreurs d'importation YOLOv5
TEST_MODE = False  # Mettre à False pour utiliser le vrai modèle YOLOv5

# Dépendance pour obtenir une session de base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI()

# --- Model Loading ---
# Load YOLOv5 model - this might take a moment on first run as it downloads weights
    # Fonction améliorée pour charger le modèle (par défaut ou personnalisé)
def load_model():
    global object_model
    try:
        if USE_CUSTOM_MODEL and os.path.exists(CUSTOM_MODEL_PATH):
            print(f"Chargement du modèle personnalisé depuis {CUSTOM_MODEL_PATH}")
            object_model = torch.hub.load('ultralytics/yolov5', 'custom', path=CUSTOM_MODEL_PATH)
            print(f"Modèle personnalisé chargé avec succès. Classes disponibles: {object_model.names}")
        else:
            print("Chargement du modèle YOLOv5s par défaut")
            object_model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
            print(f"Modèle par défaut chargé. Classes disponibles: {object_model.names}")
        
        # Configurer le modèle pour une meilleure détection
        object_model.conf = 0.4  # Seuil de confiance (40%)
        object_model.iou = 0.45  # Seuil IoU pour NMS
        print("Modèle configuré pour la détection d'objets")
        
    except Exception as e:
        print(f"Erreur lors du chargement du modèle: {e}")
        print("Tentative de chargement du modèle par défaut comme solution de repli")
        try:
            object_model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
            object_model.conf = 0.4
            object_model.iou = 0.45
            print("Modèle de repli chargé avec succès")
        except Exception as e2:
            print(f"Impossible de charger le modèle de repli: {e2}")
            object_model = None

# Chargement initial du modèle
try:
    # Charger le modèle de détection d'objets approprié
    load_model()
    
    # Custom model for letter recognition (placeholder - would be trained separately)
    # For now, we'll use the same model and filter by hand-like objects
    letter_model = object_model
    
    print("YOLOv5 models loaded successfully.")
except Exception as e:
    print(f"Error loading YOLOv5 models: {e}")
    object_model = None
    letter_model = None
# Initialize speech recognizer
try:
    recognizer = sr.Recognizer()
    print("Speech recognition initialized successfully.")
except Exception as e:
    print(f"Error initializing speech recognition: {e}")
    recognizer = None

# Configure CORS (Cross-Origin Resource Sharing)
# This allows your React frontend (running on a different port)
# to communicate with this backend.
origins = [
    "http://localhost:3000",  # Assuming your React app runs on port 3000
    "http://localhost:3001",  # Add other origins if needed
    "http://127.0.0.1:3000",  # Alternative localhost notation
    "http://127.0.0.1:3001",  # Alternative localhost notation
]

# Create a directory for uploads if it doesn't exist
UPLOADS_DIR = "uploads"
if not os.path.exists(UPLOADS_DIR):
    os.makedirs(UPLOADS_DIR)

# Répertoire pour stocker les dessins
DRAWINGS_DIR = os.path.join(UPLOADS_DIR, "drawings")
if not os.path.exists(DRAWINGS_DIR):
    os.makedirs(DRAWINGS_DIR)

# Répertoire pour stocker les images de référence des chambres
ROOMS_DIR = os.path.join(UPLOADS_DIR, "rooms")
if not os.path.exists(ROOMS_DIR):
    os.makedirs(ROOMS_DIR)
# Répertoire pour stocker les modèles personnalisés
MODELS_DIR = "models"
if not os.path.exists(MODELS_DIR):
    os.makedirs(MODELS_DIR)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

@app.get("/available_classes")
async def get_available_classes():
    """Retourne la liste des classes que le modèle actuel peut détecter."""
    if not object_model:
        raise HTTPException(status_code=500, detail="Le modèle n'est pas chargé.")
    
    return {
        "classes": object_model.names,
        "custom_model": USE_CUSTOM_MODEL,
        "model_path": CUSTOM_MODEL_PATH if USE_CUSTOM_MODEL else "yolov5s (default)",
        "total_classes": len(object_model.names)
    }

@app.post("/switch_model")
async def switch_detection_model(use_custom: bool = Body(...)):
    """Permet de basculer entre le modèle par défaut et le modèle personnalisé."""
    global USE_CUSTOM_MODEL, object_model, letter_model
    
    if use_custom == USE_CUSTOM_MODEL:
        return {"message": f"Le modèle {'personnalisé' if use_custom else 'par défaut'} est déjà actif."}
    
    USE_CUSTOM_MODEL = use_custom
    
    # Recharger le modèle
    try:
        if USE_CUSTOM_MODEL:
            if not os.path.exists(CUSTOM_MODEL_PATH):
                raise HTTPException(
                    status_code=400, 
                    detail=f"Modèle personnalisé non trouvé à l'emplacement {CUSTOM_MODEL_PATH}"
                )
            object_model = torch.hub.load('ultralytics/yolov5', 'custom', path=CUSTOM_MODEL_PATH)
        else:
            object_model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
        
        # Mettre à jour le modèle de lettres également
        letter_model = object_model
        
        return {
            "message": f"Modèle basculé vers {'personnalisé' if USE_CUSTOM_MODEL else 'par défaut'}",
            "classes": object_model.names,
            "total_classes": len(object_model.names)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du changement de modèle: {str(e)}")

@app.post("/upload_custom_model")
async def upload_custom_model(file: UploadFile = File(...)):
    """Permet de télécharger un modèle personnalisé"""
    global CUSTOM_MODEL_PATH
    
    if not file.filename.endswith('.pt'):
        raise HTTPException(status_code=400, detail="Seuls les fichiers .pt (PyTorch) sont acceptés")
    
    file_path = os.path.join(MODELS_DIR, "custom_yolov5_toys.pt")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    CUSTOM_MODEL_PATH = file_path
    
    return {
        "message": "Modèle personnalisé téléchargé avec succès",
        "path": file_path,
        "note": "Utilisez l'endpoint /switch_model avec {\"use_custom\": true} pour activer ce modèle"
    }

def get_dominant_color(image_crop, k=3):
    """
    Finds the dominant color in an image crop using K-Means clustering.
    :param image_crop: A PIL Image object of the cropped item.
    :param k: The number of clusters to form.
    :return: A tuple (R, G, B) of the dominant color.
    """
    try:
        # Convert PIL image to a NumPy array that OpenCV can use
        # Ensure it's in RGB format
        open_cv_image = np.array(image_crop.convert('RGB')) 
        # Convert RGB to BGR for OpenCV processing if needed, but for color analysis RGB is fine
        # open_cv_image = open_cv_image[:, :, ::-1].copy()

        # Reshape the image to be a list of pixels
        pixels = open_cv_image.reshape((-1, 3))
        pixels = np.float32(pixels)

        # Apply K-Means
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2)
        _, labels, centers = cv2.kmeans(pixels, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)

        # `centers` are the dominant colors. Find the most frequent one.
        _, counts = np.unique(labels, return_counts=True)
        dominant_color = centers[np.argmax(counts)]

        return tuple(int(c) for c in dominant_color)
    except Exception as e:
        print(f"Color detection error: {e}")
        return (0, 0, 0) # Return black in case of an error

def get_object_size(box, image_width, image_height):
    """Estime la taille d'un objet en fonction de sa boîte englobante et des dimensions de l'image."""
    obj_width = box[2] - box[0]
    obj_height = box[3] - box[1]
    obj_area = obj_width * obj_height
    image_area = image_width * image_height

    ratio = obj_area / image_area

    if ratio > 0.2: # Plus de 20% de la surface de l'image
        return "grand"
    elif ratio > 0.05: # Plus de 5% de la surface de l'image
        return "moyen"
    else:
        return "petit"

def get_color_name(rgb_color):
    """Convertit une valeur RGB en un nom de couleur en français, avec nuances."""
    r, g, b = rgb_color
    
    # Définition des couleurs de base et leurs nuances (format RGB)
    colors = {
        # Couleurs de base
        "rouge": (255, 0, 0),
        "vert": (0, 255, 0),
        "bleu": (0, 0, 255),
        "jaune": (255, 255, 0),
        "cyan": (0, 255, 255),
        "magenta": (255, 0, 255),
        "blanc": (255, 255, 255),
        "noir": (0, 0, 0),
        "gris": (128, 128, 128),
        
        # Nuances
        "rouge foncé": (139, 0, 0),
        "rouge clair": (255, 102, 102),
        "vert foncé": (0, 100, 0),
        "vert clair": (144, 238, 144),
        "bleu foncé": (0, 0, 139),
        "bleu clair": (135, 206, 235),
        "jaune clair": (255, 255, 224),
        "orange": (255, 165, 0),
        "orange foncé": (255, 140, 0),
        "rose": (255, 192, 203),
        "rose foncé": (255, 20, 147),
        "violet": (138, 43, 226),
        "violet clair": (216, 191, 216),
        "marron": (139, 69, 19),
        "marron clair": (160, 82, 45),
        "beige": (245, 245, 220),
        "turquoise": (64, 224, 208),
        "or": (255, 215, 0),
        "argent": (192, 192, 192)
    }
    
    # Trouver la couleur la plus proche
    min_distance = float('inf')
    closest_color = "inconnu"
    
    for name, color in colors.items():
        # Distance euclidienne pondérée dans l'espace RGB 
        # La perception humaine est plus sensible au vert, moins au bleu
        distance = (0.3 * (r - color[0])**2) + (0.59 * (g - color[1])**2) + (0.11 * (b - color[2])**2)
        
        if distance < min_distance:
            min_distance = distance
            closest_color = name
    
    return closest_color

def get_object_size(box, image_width, image_height):
    """Estime la taille d'un objet en fonction de sa boîte englobante et des dimensions de l'image."""
    obj_width = box[2] - box[0]
    obj_height = box[3] - box[1]
    obj_area = obj_width * obj_height
    image_area = image_width * image_height

    ratio = obj_area / image_area

    if ratio > 0.2: # Plus de 20% de la surface de l'image
        return "grand"
    elif ratio > 0.05: # Plus de 5% de la surface de l'image
        return "moyen"
    else:
        return "petit"

def get_position_description(box, img_width, img_height):
    """Génère une description en français de la position d'un objet dans l'image."""
    # Diviser l'image en zones
    center_x = (box[0] + box[2]) / 2
    center_y = (box[1] + box[3]) / 2
    
    # Position horizontale
    if center_x < img_width * 0.33:
        h_pos = "à gauche"
    elif center_x < img_width * 0.66:
        h_pos = "au centre"
    else:
        h_pos = "à droite"
    
    # Position verticale
    if center_y < img_height * 0.33:
        v_pos = "en haut"
    elif center_y < img_height * 0.66:
        v_pos = "au milieu"
    else:
        v_pos = "en bas"
    
    return f"{v_pos} {h_pos}"

@app.get("/")
async def read_root():
    return {"message": "Bonjour! Welcome to the Toy Helper Backend!"}

@app.post("/detect_objects/")
async def detect_objects_endpoint(file: UploadFile = File(...), db: Session = Depends(get_db)):
    print(f"\n--- Received new detection request for default user_id: {DEFAULT_USER_ID} ---")
    if not object_model:
        raise HTTPException(status_code=500, detail="Model is not loaded. Please check server logs.")

    # 1. Récupérer la chambre de référence pour l'utilisateur par défaut
    chambre_ref = db.query(db_models.Chambre).filter(db_models.Chambre.user_id == DEFAULT_USER_ID).first()
    if not chambre_ref or not chambre_ref.objets_reference:
        return {
            "message": "Demande à maman de prendre une photo de ta chambre bien rangée d'abord!",
            "tasks": []
        }
    
    reference_objects_data = json.loads(chambre_ref.objets_reference)
    # Obtenir l'image de référence pour l'affichage côté client
    reference_image_path = chambre_ref.image_path
    reference_image_filename = os.path.basename(reference_image_path)
    
    # Convertir les boîtes de référence en un format plus facile à utiliser
    reference_objects_map = {}
    for i, ref_obj in enumerate(reference_objects_data):
        if ref_obj['name'] not in reference_objects_map:
            reference_objects_map[ref_obj['name']] = []
        reference_objects_map[ref_obj['name']].append({
            'box': ref_obj['box'],
            'position': get_position_description(ref_obj['box'], 1.0, 1.0)  # Normalisation approximative
        })

    # 2. Lire l'image uploadée (la chambre en désordre)
    image_bytes = await file.read()

    try:
        # 3. Effectuer l'inférence sur la nouvelle image
        img = Image.open(io.BytesIO(image_bytes))
        img_width, img_height = img.size
        results = object_model(img)
        detections = results.pandas().xyxy[0]
        print(f"YOLOv5 found {len(detections)} potential objects in the messy room.")

        # 4. Traiter les détections pour créer des tâches de rangement
        tasks = []
        unmatched_reference_indices = {name: list(range(len(boxes))) for name, boxes in reference_objects_map.items()}

        for index, row in detections.iterrows():
            object_name = row['name']
            box = [int(b) for b in [row['xmin'], row['ymin'], row['xmax'], row['ymax']]]
            
            # Extraire la couleur dominante
            cropped_img = img.crop(box)
            dominant_color_rgb = get_dominant_color(cropped_img)
            color_name = get_color_name(dominant_color_rgb)
            
            # Estimer la taille
            size_name = get_object_size(box, img_width, img_height)
            
            # Position actuelle dans la pièce
            current_position = get_position_description(box, img_width, img_height)

            # Message thématique pour cet objet
            thematic_tip = get_thematic_message(object_name)
            
            # Message d'encouragement aléatoire
            encouragement = random.choice([
                "Tu fais un excellent travail !",
                "Continue comme ça !",
                "Super effort !",
                "Tu es vraiment doué(e) !",
                "Bravo pour ton aide !"
            ])

            target_box = None
            target_position = ""
            
            # Essayer de faire correspondre cet objet à un objet de référence du même type
            if object_name in reference_objects_map and unmatched_reference_indices[object_name]:
                ref_idx_to_use = unmatched_reference_indices[object_name].pop(0)  # Prendre le premier non-matché
                target_ref = reference_objects_map[object_name][ref_idx_to_use]
                target_box = target_ref['box']
                target_position = target_ref['position']

            if target_box:
                # Formulation plus naturelle pour l'assistant vocal
                article = "le" if object_name[0] not in "aeiouh" else "l'"
                
                # Instructions adaptées pour un enfant
                guidance = f"J'ai trouvé {article} {object_name} {color_name}. C'est un objet de taille {size_name} qui est {current_position} de ta chambre. "
                
                if size_name == "petit":
                    guidance += f"Prends-le soigneusement dans ta main et range-le {target_position} de ta chambre. {encouragement} {thematic_tip}"
                elif size_name == "moyen":
                    guidance += f"Prends-le à deux mains et place-le {target_position} de ta chambre. {encouragement} {thematic_tip}"
                else:  # grand
                    guidance += f"Demande peut-être de l'aide à un adulte pour le déplacer {target_position} de ta chambre. {encouragement} {thematic_tip}"
                
                tasks.append({
                    "detected_object_name": object_name,
                    "detected_object_box": box,
                    "detected_object_color": dominant_color_rgb,
                    "detected_object_color_name": color_name,
                    "detected_object_size": size_name,
                    "current_position": current_position,
                    "target_position": target_position,
                    "target_location_box": target_box,
                    "guidance_message": guidance
                })
            else:
                # Objet détecté mais pas de correspondance dans la référence
                article = "le" if object_name[0] not in "aeiouh" else "l'"
                guidance = f"J'ai trouvé {article} {object_name} {color_name} de taille {size_name} {current_position} de ta chambre, mais je ne sais pas exactement où le ranger. Demande à maman. {thematic_tip}"
                
                tasks.append({
                    "detected_object_name": object_name,
                    "detected_object_box": box,
                    "detected_object_color": dominant_color_rgb,
                    "detected_object_color_name": color_name,
                    "detected_object_size": size_name,
                    "current_position": current_position,
                    "target_position": None,
                    "target_location_box": None,
                    "guidance_message": guidance
                })

        if not tasks:
            return {
                "message": "Je ne vois aucun jouet spécifique à ranger ou ta chambre est déjà parfaite!",
                "tasks": [],
                "reference_image": reference_image_filename
            }

        # Choisir l'objet le plus confiant pour mettre en premier
        if tasks:
            tasks.sort(key=lambda x: detections[detections['name'] == x['detected_object_name']]['confidence'].iloc[0], reverse=True)

        final_message = f"J'ai trouvé {len(tasks)} objets à ranger!" if tasks else "On dirait que tout est en ordre!"
        
        # Récupérer le nombre de tâches complétées précédemment
        completed_tasks = chambre_ref.completed_tasks or 0
        
        # Générer un message de progression
        progress_message = get_progress_feedback(completed_tasks, len(tasks))

        print(f"---> Sending back {len(tasks)} tasks with detailed guidance.")
        return {
            "message": final_message,
            "tasks": tasks,
            "total_tasks": len(tasks),
            "completed_tasks": completed_tasks,
            "progress_message": progress_message,
            "reference_image": reference_image_filename
        }
        
    except Exception as e:
        print(f"Error during detection: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred during detection: {str(e)}")

@app.post("/simple_detect_objects/")
async def simple_detect_objects(file: UploadFile = File(...)):
    """
    Détection simple d'objets pour l'assistant enfant
    Retourne juste la liste des objets détectés avec nom, couleur et taille
    Pas besoin d'image de référence ni de base de données
    """
    try:
        if not object_model:
            raise HTTPException(status_code=500, detail="Model is not loaded. Please check server logs.")
        
        # Lire l'image
        image_bytes = await file.read()
        img = Image.open(io.BytesIO(image_bytes))
        img_width, img_height = img.size
        
        print(f"📸 Processing image of size {img_width}x{img_height}")
        
        # Détecter les objets avec YOLOv5
        results = object_model(img)
        detections = results.pandas().xyxy[0]
        
        print(f"🔍 YOLOv5 found {len(detections)} objects")
        
        detected_objects = []
        
        for index, row in detections.iterrows():
            # Extraire les informations de base
            object_name = row['name']
            confidence = float(row['confidence'])
            box = [int(row['xmin']), int(row['ymin']), int(row['xmax']), int(row['ymax'])]
            
            # Filtrer les détections de faible confiance
            if confidence < 0.3:
                continue
                
            print(f"  - {object_name} (conf: {confidence:.2f})")
            
            # Extraire la couleur dominante de l'objet détecté
            try:
                cropped_img = img.crop(box)
                dominant_color_rgb = get_dominant_color(cropped_img)
                color_name = get_color_name(dominant_color_rgb)
            except:
                color_name = "coloré"
                dominant_color_rgb = [128, 128, 128]
            
            # Estimer la taille relative de l'objet
            size_name = get_object_size(box, img_width, img_height)
            
            # Traduire le nom de l'objet en français si possible
            french_name = translate_object_name(object_name)
            
            detected_objects.append({
                "class": french_name,
                "name": french_name,
                "confidence": confidence,
                "box": box,
                "color": color_name,
                "size": size_name,
                "color_rgb": dominant_color_rgb
            })
        
        print(f"✅ Returning {len(detected_objects)} filtered objects")
        
        return {
            "success": True,
            "message": f"J'ai trouvé {len(detected_objects)} objet(s) !",
            "detected_objects": detected_objects,
            "total_detected": len(detected_objects)
        }
        
    except Exception as e:
        print(f"❌ Error in simple object detection: {e}")
        return {
            "success": False,
            "message": f"Erreur lors de la détection: {str(e)}",
            "detected_objects": [],
            "error": str(e)
        }

def translate_object_name(english_name):
    """Traduit les noms d'objets anglais en français"""
    translations = {
        'person': 'personne',
        'bicycle': 'vélo', 
        'car': 'voiture',
        'motorcycle': 'moto',
        'airplane': 'avion',
        'bus': 'bus',
        'train': 'train',
        'truck': 'camion',
        'boat': 'bateau',
        'traffic light': 'feu de circulation',
        'fire hydrant': 'bouche d\'incendie',
        'stop sign': 'panneau stop',
        'parking meter': 'parcmètre',
        'bench': 'banc',
        'bird': 'oiseau',
        'cat': 'chat',
        'dog': 'chien',
        'horse': 'cheval',
        'sheep': 'mouton',
        'cow': 'vache',
        'elephant': 'éléphant',
        'bear': 'ours',
        'zebra': 'zèbre',
        'giraffe': 'girafe',
        'backpack': 'sac à dos',
        'umbrella': 'parapluie',
        'handbag': 'sac à main',
        'tie': 'cravate',
        'suitcase': 'valise',
        'frisbee': 'frisbee',
        'skis': 'skis',
        'snowboard': 'snowboard',
        'sports ball': 'ballon',
        'kite': 'cerf-volant',
        'baseball bat': 'batte de baseball',
        'baseball glove': 'gant de baseball',
        'skateboard': 'skateboard',
        'surfboard': 'planche de surf',
        'tennis racket': 'raquette de tennis',
        'bottle': 'bouteille',
        'wine glass': 'verre à vin',
        'cup': 'tasse',
        'fork': 'fourchette',
        'knife': 'couteau',
        'spoon': 'cuillère',
        'bowl': 'bol',
        'banana': 'banane',
        'apple': 'pomme',
        'sandwich': 'sandwich',
        'orange': 'orange',
        'broccoli': 'brocoli',
        'carrot': 'carotte',
        'hot dog': 'hot dog',
        'pizza': 'pizza',
        'donut': 'beignet',
        'cake': 'gâteau',
        'chair': 'chaise',
        'couch': 'canapé',
        'potted plant': 'plante en pot',
        'bed': 'lit',
        'dining table': 'table à manger',
        'toilet': 'toilettes',
        'tv': 'télévision',
        'laptop': 'ordinateur portable',
        'mouse': 'souris',
        'remote': 'télécommande',
        'keyboard': 'clavier',
        'cell phone': 'téléphone portable',
        'microwave': 'micro-ondes',
        'oven': 'four',
        'toaster': 'grille-pain',
        'sink': 'évier',
        'refrigerator': 'réfrigérateur',
        'book': 'livre',
        'clock': 'horloge',
        'vase': 'vase',
        'scissors': 'ciseaux',
        'teddy bear': 'peluche',
        'hair drier': 'sèche-cheveux',
        'toothbrush': 'brosse à dents'
    }
    return translations.get(english_name.lower(), english_name)

@app.post("/recognize_speech/")
async def recognize_speech(request: SpeechRecognitionRequest):
    if not recognizer:
        return JSONResponse(status_code=500, content={"error": "Speech recognition not initialized"})
    
    try:
        # Decode the base64 audio data
        audio_data = base64.b64decode(request.audio_data.split(',')[1] if ',' in request.audio_data else request.audio_data)
        
        # Save temporarily
        audio_path = os.path.join(UPLOADS_DIR, "temp_audio.wav")
        with open(audio_path, "wb") as f:
            f.write(audio_data)
        
        # Use recognizer to convert speech to text
        with sr.AudioFile(audio_path) as source:
            audio = recognizer.record(source)
            
            # Recognize speech using Google's speech recognition
            text = recognizer.recognize_google(audio, language=request.language)
            
            print(f"Recognized speech: {text}")
            
            # Process the recognized text based on context
            response_text = process_speech_for_letter_learning(text)
            
            return {"recognized_text": text, "response": response_text}
    except Exception as e:
        print(f"Speech recognition error: {e}")
        return {"error": str(e)}

def process_speech_for_letter_learning(text):
    """Process recognized speech for letter learning context"""
    text = text.lower()
    
    # Check if the text contains a word that starts with the requested letter
    # This is simplified - in a real app, you would have more sophisticated logic
    
    # Simple responses based on common phrases
    if "bonjour" in text or "salut" in text:
        return "Bonjour ! Je suis content de te voir apprendre les lettres aujourd'hui !"
    
    if "comment" in text and ("ça va" in text or "tu vas" in text):
        return "Je vais très bien, merci ! Continuons à apprendre les lettres !"
    
    if "merci" in text:
        return "De rien ! C'est un plaisir de t'aider à apprendre !"
    
    # Check if they're mentioning a letter
    for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        if letter.lower() in text:
            return f"Oui, c'est la lettre {letter}. Peux-tu me donner un mot qui commence par {letter} ?"
    
    # Default response
    return "Essaie de me dire un mot qui commence par la lettre que tu apprends !"

@app.post("/recognize_hand_gesture/")
async def recognize_hand_gesture(request: HandGestureRequest):
    if not letter_model:
        return JSONResponse(status_code=500, content={"error": "Letter recognition model not initialized"})
    
    try:
        # Decode the base64 image
        image_data = base64.b64decode(request.image.split(',')[1] if ',' in request.image else request.image)
        image = Image.open(io.BytesIO(image_data))
        
        # Use YOLOv5 to detect hands and gestures
        results = letter_model(image)
        
        # Convert results to a readable format
        detections = results.pandas().xyxy[0]
        
        print(f"Gesture recognition found {len(detections)} potential objects")
        
        # Look for hand or person in detections
        hands = detections[detections['name'].isin(['person', 'hand'])]
        
        # If no hands detected, return early
        if len(hands) == 0:
            return {"detected": False, "message": "Aucune main détectée"}
        
        # In a real application, you would use a specialized model or algorithm here
        # to determine which letter the hand gesture represents
        # For this demo, we'll simulate recognition based on the current letter
        
        # Get the current letter the user is learning
        current_letter = request.current_letter
        
        # Simulate gesture recognition (this is where a real CV algorithm would be used)
        # For demo, we'll randomly decide if the gesture matches with 30% probability
        import random
        gesture_recognized = random.random() < 0.3
        
        if gesture_recognized:
            return {
                "detected": True, 
                "recognized_letter": current_letter,
                "confidence": round(random.uniform(0.75, 0.95), 2),
                "message": f"Bravo ! J'ai reconnu la lettre {current_letter} dans ton geste!"
            }
        else:
            return {
                "detected": True,
                "recognized_letter": None,
                "message": "Continue d'essayer! Je ne reconnais pas encore la lettre."
            }
            
    except Exception as e:
        print(f"Hand gesture recognition error: {e}")
        return {"error": str(e)}

@app.post("/log-activity/")
async def log_activity(activity: ActivityLogRequest):
    try:
        # Log the activity
        print(f"Logging activity: {activity}")
        
        # Save the activity to a file or database
        # For this example, we'll just print it
        print(f"Activity logged: {activity}")
        
        return {"message": "Activité enregistrée avec succès"}
    except Exception as e:
        print(f"Error logging activity: {e}")
        return {"error": str(e)}

@app.post("/dessins/upload/")
async def upload_dessin(
    file: UploadFile = File(...),
    user_id: Optional[int] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Endpoint pour uploader et enregistrer un dessin d'enfant"""
    try:
        print(f"===> Upload dessin - user_id: {user_id}, description: {description}")
        
        # Vérifier si l'utilisateur existe si un ID est fourni
        if user_id:
            print(f"===> Vérification utilisateur {user_id}")
            utilisateur = db.query(db_models.Utilisateur).filter(db_models.Utilisateur.id == user_id).first()
            if not utilisateur:
                print(f"===> Utilisateur {user_id} non trouvé!")
                # Créer l'utilisateur si nécessaire pour tester
                print(f"===> Création d'un utilisateur de test avec ID {user_id}")
                nouveau_utilisateur = db_models.Utilisateur(id=user_id, nom="Test", prenom="User", email=f"test{user_id}@example.com", mot_de_passe="password")
                db.add(nouveau_utilisateur)
                db.commit()
                print(f"===> Utilisateur créé avec ID {user_id}")
        
        # Générer un nom de fichier unique pour éviter les écrasements
        file_extension = os.path.splitext(file.filename)[1]
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        new_filename = f"dessin_{timestamp}{file_extension}" if user_id is None else f"dessin_user{user_id}_{timestamp}{file_extension}"
        
        # Chemin complet du fichier
        file_path = os.path.join(DRAWINGS_DIR, new_filename)
        print(f"===> Chemin de sauvegarde: {file_path}")
        
        # Lire et enregistrer le fichier
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        print(f"===> Fichier sauvegardé sur disque: {os.path.exists(file_path)}")
        
        # Utiliser le modèle de détection d'objets si disponible
        detected_object = None
        try:
            if object_model:
                # Ouvrir l'image avec PIL
                img = Image.open(io.BytesIO(content))
                # Utiliser le modèle YOLOv5 pour détecter des objets
                results = object_model(img)
                detections = results.pandas().xyxy[0]
                
                # Si des objets sont détectés, prendre celui avec la plus haute confiance
                if len(detections) > 0:
                    # Trier par confiance (décroissant)
                    sorted_detections = detections.sort_values('confidence', ascending=False)
                    detected_object = sorted_detections.iloc[0]['name']
                    print(f"Objet détecté dans le dessin : {detected_object}")
        except Exception as e:
            print(f"Erreur lors de la détection d'objets : {e}")
        
        # Enregistrer les informations du dessin dans la base de données
        print(f"===> Tentative d'enregistrement en base de données")
        try:
            db_dessin = db_models.Dessin(
                user_id=user_id,
                image_path=file_path,
                description=description,
                objet_detecte=detected_object
            )
            print(f"===> Objet dessin créé: {db_dessin}")
            db.add(db_dessin)
            print(f"===> Dessin ajouté à la session")
            db.commit()
            print(f"===> Commit réussi!")
            db.refresh(db_dessin)
            print(f"===> Dessin enregistré avec ID: {db_dessin.id}")
            
            return {
                "status": "success",
                "message": "Dessin enregistré avec succès",
                "dessin_id": db_dessin.id,
                "objet_detecte": detected_object,
                "image_path": file_path
            }
        except Exception as e:
            print(f"===> ERREUR lors de l'enregistrement en base: {str(e)}")
            db.rollback()
            raise e
    
    except Exception as e:
        print(f"Erreur lors de l'upload du dessin: {e}")
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

@app.get("/dessins/{dessin_id}")
async def get_dessin(dessin_id: int, db: Session = Depends(get_db)):
    """Récupérer un dessin spécifique par son ID"""
    try:
        dessin = db.query(db_models.Dessin).filter(db_models.Dessin.id == dessin_id).first()
        if not dessin:
            return JSONResponse(
                status_code=404,
                content={"status": "error", "message": "Dessin non trouvé"}
            )
            
        # Lire l'image et la convertir en base64
        try:
            with open(dessin.image_path, "rb") as img_file:
                img_data = base64.b64encode(img_file.read()).decode('utf-8')
                
            return {
                "id": dessin.id,
                "user_id": dessin.user_id,
                "date_creation": dessin.date_creation,
                "description": dessin.description,
                "objet_detecte": dessin.objet_detecte,
                "image": f"data:image/png;base64,{img_data}"
            }
        except FileNotFoundError:
            return JSONResponse(
                status_code=404,
                content={"status": "error", "message": "Fichier image introuvable"}
            )
    except Exception as e:
        print(f"Erreur lors de la récupération du dessin: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

@app.get("/dessins/utilisateur/{user_id}")
async def get_dessins_utilisateur(user_id: int, db: Session = Depends(get_db)):
    """Récupérer tous les dessins d'un utilisateur (galerie personnelle)"""
    try:
        # Vérifier si l'utilisateur existe
        utilisateur = db.query(db_models.Utilisateur).filter(db_models.Utilisateur.id == user_id).first()
        if not utilisateur:
            return JSONResponse(
                status_code=404,
                content={"status": "error", "message": "Utilisateur non trouvé"}
            )
            
        # Récupérer tous les dessins de l'utilisateur
        dessins = db.query(db_models.Dessin).filter(db_models.Dessin.user_id == user_id).order_by(db_models.Dessin.date_creation.desc()).all()
        
        result = []
        for dessin in dessins:
            # Essayer de lire l'image
            try:
                with open(dessin.image_path, "rb") as img_file:
                    img_data = base64.b64encode(img_file.read()).decode('utf-8')
                    
                result.append({
                    "id": dessin.id,
                    "date_creation": dessin.date_creation,
                    "description": dessin.description,
                    "objet_detecte": dessin.objet_detecte,
                    "image": f"data:image/png;base64,{img_data}"
                })
            except FileNotFoundError:
                # Si le fichier n'est pas trouvé, inclure quand même les métadonnées
                result.append({
                    "id": dessin.id,
                    "date_creation": dessin.date_creation,
                    "description": dessin.description,
                    "objet_detecte": dessin.objet_detecte,
                    "image": None,
                    "error": "Image introuvable"
                })
                
        return result
    except Exception as e:
        print(f"Erreur lors de la récupération des dessins: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

@app.post("/chambre/upload_reference/")
async def upload_reference_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Endpoint pour uploader l'image de référence d'une chambre bien rangée pour l'utilisateur par défaut."""
    try:
        print(f"📸 [UPLOAD] Début de l'upload - fichier: {file.filename}")
        
        # Vérifier si l'utilisateur par défaut existe, sinon le créer
        print(f"👤 [DB] Recherche utilisateur {DEFAULT_USER_ID}")
        utilisateur = db.query(db_models.Utilisateur).filter(db_models.Utilisateur.id == DEFAULT_USER_ID).first()
        if not utilisateur:
            print(f"👤 [DB] Utilisateur par défaut {DEFAULT_USER_ID} non trouvé. Création...")
            utilisateur = db_models.Utilisateur(
                id=DEFAULT_USER_ID, 
                nom="Default User", 
                prenom="App", 
                email=f"default{DEFAULT_USER_ID}@example.com", 
                mot_de_passe="default"
            )
            db.add(utilisateur)
            # Commiter la création de l'utilisateur ici pour que la FK de Chambre soit valide
            try:
                db.commit()
                db.refresh(utilisateur)
                print(f"✅ [DB] Utilisateur par défaut {DEFAULT_USER_ID} créé.")
            except Exception as e:
                print(f"❌ [DB] Erreur création utilisateur: {e}")
                db.rollback()
                raise e
        else:
            print(f"✅ [DB] Utilisateur {DEFAULT_USER_ID} trouvé.")

        # Lire le contenu de l'image
        print("📖 [IMAGE] Lecture du contenu de l'image...")
        image_bytes = await file.read()
        print(f"📖 [IMAGE] Image lue: {len(image_bytes)} bytes")
        
        img = Image.open(io.BytesIO(image_bytes))
        img_width, img_height = img.size
        print(f"📖 [IMAGE] Dimensions: {img_width}x{img_height}")
        
        # Convertir les détections en un format plus facile à utiliser
        objets_reference = []
        
        # Vérifier si le modèle est disponible (mode TEST ou modèle chargé)
        if object_model is None or TEST_MODE:
            print("🧪 [TEST] Mode TEST activé - génération d'objets de démonstration")
            # Données de démonstration pour le mode TEST
            objets_reference = [
                {
                    "name": "teddy bear",
                    "confidence": 0.85,
                    "box": [100, 100, 200, 200],
                    "color": "(139, 69, 19)",  # Marron
                    "size": "moyen"
                },
                {
                    "name": "book",
                    "confidence": 0.92,
                    "box": [300, 150, 400, 220],
                    "color": "(255, 255, 255)",  # Blanc
                    "size": "petit"
                },
                {
                    "name": "toy car",
                    "confidence": 0.78,
                    "box": [150, 250, 250, 300],
                    "color": "(255, 0, 0)",  # Rouge
                    "size": "petit"
                }
            ]
        else:
            print("🤖 [AI] Utilisation du modèle YOLOv5 pour détecter des objets")
            # Utiliser le modèle YOLOv5 pour détecter des objets
            results = object_model(img)
            detections = results.pandas().xyxy[0]
            
            for index, row in detections.iterrows():
                objet_name = row['name']
                objet_confidence = row['confidence']
                objet_box = [int(b) for b in [row['xmin'], row['ymin'], row['xmax'], row['ymax']]]
                
                # Extraire la couleur dominante
                cropped_img = img.crop(objet_box)
                dominant_color = get_dominant_color(cropped_img)
                # Convertir la couleur en nom (simplifié, pourrait être amélioré)
                # Pour une démo, nous pouvons juste retourner le tuple RGB.
                # Dans une vraie app, vous auriez une fonction pour mapper RGB à des noms de couleur.
                color_name = str(dominant_color) # Exemple: "(255, 0, 0)" pour rouge
                
                # Estimer la taille
                size_name = get_object_size(objet_box, img_width, img_height)
                
                objets_reference.append({
                    "name": objet_name,
                    "confidence": objet_confidence,
                    "box": objet_box,
                    "color": color_name,
                    "size": size_name
                })
        
        print(f"🔍 [DETECTION] {len(objets_reference)} objets détectés")
        
        # Générer un nom de fichier unique
        print("💾 [FILE] Génération du nom de fichier...")
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        file_extension = os.path.splitext(file.filename)[1]
        new_filename = f"chambre_{DEFAULT_USER_ID}_{timestamp}{file_extension}"
        file_path = os.path.join(ROOMS_DIR, new_filename)
        print(f"💾 [FILE] Chemin: {file_path}")

        # Enregistrer l'image sur le disque
        print("💾 [FILE] Sauvegarde de l'image...")
        with open(file_path, "wb") as f:
            f.write(image_bytes)
        print("✅ [FILE] Image sauvegardée")
        
        objets_json = json.dumps(objets_reference)
        print("📊 [JSON] Objets sérialisés")

        # Vérifier s'il existe déjà une chambre pour cet utilisateur par défaut
        print("🏠 [DB] Recherche chambre existante...")
        chambre = db.query(db_models.Chambre).filter(db_models.Chambre.user_id == DEFAULT_USER_ID).first()
        if chambre:
            print("🏠 [DB] Chambre trouvée - mise à jour...")
            # Mettre à jour l'enregistrement existant
            chambre.image_path = file_path
            chambre.objets_reference = objets_json
        else:
            print("🏠 [DB] Création nouvelle chambre...")
            # Créer un nouvel enregistrement
            chambre = db_models.Chambre(
                user_id=DEFAULT_USER_ID,
                image_path=file_path,
                objets_reference=objets_json,
                completed_tasks=[]
            )
            db.add(chambre)
        
        print("💾 [DB] Commit des changements...")
        db.commit()
        db.refresh(chambre)
        print("✅ [DB] Chambre sauvegardée avec succès")

        return {
            "status": "success",
            "message": "Image de référence uploadée avec succès",
            "objects_detected": len(objets_reference),
            "file_path": file_path
        }

    except Exception as e:
        print(f"❌ [ERROR] Erreur dans upload_reference_image: {str(e)}")
        print(f"❌ [ERROR] Type d'erreur: {type(e).__name__}")
        import traceback
        print(f"❌ [ERROR] Traceback: {traceback.format_exc()}")
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Erreur serveur: {str(e)}"}
        )

@app.post("/complete_task/")
async def complete_task(db: Session = Depends(get_db)):
    """
    Incrémente le compteur de tâches complétées pour l'utilisateur par défaut.
    À appeler chaque fois qu'un enfant termine une tâche de rangement.
    """
    try:
        chambre_ref = db.query(db_models.Chambre).filter(db_models.Chambre.user_id == DEFAULT_USER_ID).first()
        if not chambre_ref:
            raise HTTPException(status_code=404, detail="Aucune chambre de référence trouvée pour cet utilisateur.")
        
        # Incrémenter le compteur de tâches complétées
        if chambre_ref.completed_tasks is None:
            chambre_ref.completed_tasks = 1
        else:
            chambre_ref.completed_tasks += 1
        
        db.commit()
        
        # Générer un message d'encouragement
        progress_message = get_progress_feedback(chambre_ref.completed_tasks, chambre_ref.completed_tasks + 1)
        
        return {
            "completed_tasks": chambre_ref.completed_tasks,
            "progress_message": progress_message
        }
    except Exception as e:
        db.rollback()
        print(f"Erreur lors de l'incrémentation des tâches complétées: {e}")
        raise HTTPException(status_code=500, detail=f"Une erreur s'est produite: {str(e)}")

@app.post("/reset_tasks/")
async def reset_tasks(db: Session = Depends(get_db)):
    """
    Réinitialise le compteur de tâches complétées pour l'utilisateur par défaut.
    À utiliser lorsqu'on commence une nouvelle session de rangement.
    """
    try:
        chambre_ref = db.query(db_models.Chambre).filter(db_models.Chambre.user_id == DEFAULT_USER_ID).first()
        if not chambre_ref:
            raise HTTPException(status_code=404, detail="Aucune chambre de référence trouvée pour cet utilisateur.")
        
        # Réinitialiser le compteur
        chambre_ref.completed_tasks = 0
        db.commit()
        
        return {
            "message": "Compteur de tâches réinitialisé avec succès.",
            "completed_tasks": 0
        }
    except Exception as e:
        db.rollback()
        print(f"Erreur lors de la réinitialisation des tâches: {e}")
        raise HTTPException(status_code=500, detail=f"Une erreur s'est produite: {str(e)}")

@app.get("/chambre/get_reference/")
async def get_reference_image(db: Session = Depends(get_db)):
    """
    Récupère l'image de référence de la chambre rangée pour l'utilisateur par défaut.
    Utilisé par l'interface enfant pour afficher l'état idéal de la chambre.
    """
    try:
        chambre = db.query(db_models.Chambre).filter(db_models.Chambre.user_id == DEFAULT_USER_ID).first()
        
        if not chambre:
            return JSONResponse(
                status_code=404,
                content={"status": "error", "message": "Aucune image de référence trouvée pour cet utilisateur"}
            )
        
        # Vérifier que le fichier existe
        if not chambre.image_path or not os.path.exists(chambre.image_path):
            return JSONResponse(
                status_code=404,
                content={"status": "error", "message": "L'image de référence est introuvable"}
            )
        
        # Récupérer les dimensions et les objets de référence
        objets_reference = json.loads(chambre.objets_reference) if chambre.objets_reference else []
        
        return {
            "status": "success",
            "image_path": chambre.image_path,
            "objects": objets_reference,
            "completed_tasks": chambre.completed_tasks if hasattr(chambre, 'completed_tasks') else 0
        }
    except Exception as e:
        print(f"Erreur lors de la récupération de l'image de référence: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

@app.post("/chat_with_assistant/")
async def chat_with_assistant(request: ChatRequest):
    """
    Assistant IA pour répondre aux questions des enfants de manière éducative et amusante
    """
    try:
        child_message = request.message.lower().strip()
        context = request.context or "enfant"
        
        # Réponses prédéfinies pour les questions courantes des enfants
        responses = {
            # Questions sur les couleurs
            "quelle couleur": "Les couleurs sont partout ! Je peux voir le rouge comme une pomme, le bleu comme le ciel, le vert comme l'herbe, et plein d'autres belles couleurs !",
            "pourquoi rouge": "Le rouge est une couleur chaude et joyeuse ! On la trouve dans les fraises, les cœurs et les voitures de pompiers !",
            "pourquoi bleu": "Le bleu est la couleur du ciel et de l'océan ! C'est une couleur calme et apaisante.",
            "pourquoi vert": "Le vert est la couleur de la nature ! Les feuilles, l'herbe et les grenouilles sont vertes !",
            
            # Questions sur les tailles
            "grand": "Quand quelque chose est grand, ça veut dire que c'est plus gros que la normale ! Comme un éléphant ou un grand arbre !",
            "petit": "Quand quelque chose est petit, ça veut dire que c'est très mignon et facile à tenir dans tes mains, comme une souris ou un papillon !",
            "moyen": "Moyen, ça veut dire ni trop grand ni trop petit, juste la bonne taille ! Comme un chat ou un livre !",
            
            # Questions sur les objets
            "qu'est-ce que c'est": "Montre-moi l'objet avec la caméra et je te dirai ce que c'est ! Je suis très bon pour reconnaître les jouets et les objets !",
            "comment ça marche": "Chaque objet a sa propre façon de fonctionner ! Les voitures roulent, les balles rebondissent, et les livres se lisent !",
            
            # Questions de politesse
            "bonjour": "Bonjour mon petit ami ! Je suis ravi de te parler aujourd'hui ! Comment vas-tu ?",
            "salut": "Salut ! Je suis ton assistant magique ! Je suis là pour t'aider à reconnaître tes jouets et répondre à tes questions !",
            "merci": "De rien mon petit héros ! J'adore t'aider ! Si tu as d'autres questions, n'hésite pas à me demander !",
            
            # Questions existentielles d'enfants
            "pourquoi": "C'est une excellente question ! Les enfants curieux comme toi posent les meilleures questions ! Peux-tu être plus précis sur ce que tu veux savoir ?",
            "comment": "Bonne question ! Je peux t'expliquer plein de choses ! Dis-moi exactement ce que tu veux savoir !",
            
            # Aide et encouragement
            "aide": "Bien sûr que je vais t'aider ! Je suis là pour ça ! Montre-moi ce que tu veux savoir avec la caméra !",
            "j'y arrive pas": "Ne t'inquiète pas ! Tu es très intelligent et tu peux y arriver ! Essayons ensemble étape par étape !",
            "c'est difficile": "Je comprends que ça peut être difficile parfois ! Mais tu es très courageux ! Prenons notre temps et faisons-le ensemble !",
            
            # Questions sur le rangement
            "ranger": "Ranger, c'est mettre chaque chose à sa place ! Ça rend ta chambre plus belle et tu retrouves tes jouets plus facilement !",
            "pourquoi ranger": "On range pour que tout soit organisé et propre ! Comme ça, tu peux jouer plus facilement et tes parents sont contents !",
        }
        
        # Rechercher une réponse appropriée
        response = "Je ne suis pas sûr de comprendre ta question, mais je suis là pour t'aider ! Peux-tu me poser ta question d'une autre façon ?"
        
        for keyword, answer in responses.items():
            if keyword in child_message:
                response = answer
                break
        
        # Réponses spéciales selon le contexte
        if "qui es-tu" in child_message or "tu es qui" in child_message:
            response = "Je suis ton assistant magique ! Je peux voir tes jouets avec la caméra et t'aider à les reconnaître ! Je suis là pour jouer et apprendre avec toi !"
        
        elif "âge" in child_message:
            response = "Je n'ai pas d'âge comme toi ! Je suis un assistant magique qui vit dans l'ordinateur pour t'aider ! Et toi, quel âge as-tu ?"
        
        elif "jeu" in child_message or "jouer" in child_message:
            response = "J'adore jouer ! Nous pouvons jouer au jeu de reconnaissance d'objets ! Montre-moi tes jouets et je te dirai tout sur eux !"
        
        # Ajouter un peu de personnalité
        encouragements = [
            " Tu es très intelligent !",
            " Continue à poser des questions !",
            " J'adore ta curiosité !",
            " Tu apprends très vite !",
            " C'est formidable !"
        ]
        
        if len(child_message) > 10:  # Si c'est une vraie question
            response += random.choice(encouragements)
        
        return {
            "response": response,
            "success": True
        }
        
    except Exception as e:
        print(f"Erreur dans le chat assistant: {e}")
        return {
            "response": "Oups ! J'ai eu un petit problème ! Peux-tu répéter ta question ?",
            "success": False,
            "error": str(e)
        }

@app.post("/describe_object/")
async def describe_object_in_hand(file: UploadFile = File(...)):
    """
    Décrit l'objet que l'enfant tient dans sa main (nom, couleur, taille)
    """
    try:
        if not object_model:
            raise HTTPException(status_code=500, detail="Model is not loaded.")
        
        # Lire l'image
        image_bytes = await file.read()
        img = Image.open(io.BytesIO(image_bytes))
        img_width, img_height = img.size
        
        # Détecter les objets
        results = object_model(img)
        detections = results.pandas().xyxy[0]
        
        if len(detections) == 0:
            return {
                "description": "Je ne vois pas d'objet clair dans tes mains ! Peux-tu le montrer un peu plus près de la caméra ?",
                "object_found": False
            }
        
        # Prendre l'objet le plus confiant (le premier)
        main_detection = detections.iloc[0]
        object_name = main_detection['name']
        confidence = main_detection['confidence']
        box = [int(b) for b in [main_detection['xmin'], main_detection['ymin'], main_detection['xmax'], main_detection['ymax']]]
        
        # Extraire la couleur dominante
        cropped_img = img.crop(box)
        dominant_color_rgb = get_dominant_color(cropped_img)
        color_name = get_color_name(dominant_color_rgb)
        
        # Estimer la taille
        size_name = get_object_size(box, img_width, img_height)
        
        # Créer une description naturelle pour l'enfant
        articles = {
            'livre': 'un', 'ballon': 'un', 'crayon': 'un', 'jouet': 'un',
            'peluche': 'une', 'poupée': 'une', 'voiture': 'une'
        }
        
        article = articles.get(object_name, 'un')
        
        # Messages adaptatifs selon la taille
        size_descriptions = {
            'petit': 'tout petit et mignon',
            'moyen': 'de taille parfaite pour jouer',
            'grand': 'assez grand et impressionnant'
        }
        
        size_desc = size_descriptions.get(size_name, 'de belle taille')
        
        description = f"Je vois que tu tiens {article} {object_name} {color_name} ! Il est {size_desc}. "
        
        # Ajouter des informations éducatives
        educational_facts = {
            'livre': 'Les livres nous aident à apprendre et à rêver !',
            'ballon': 'Les ballons rebondissent et roulent ! Tu peux jouer avec !',
            'crayon': 'Avec les crayons, tu peux dessiner de belles choses !',
            'voiture': 'Les voitures nous emmènent partout ! Vroum vroum !',
            'peluche': 'Les peluches sont douces et parfaites pour les câlins !',
            'poupée': 'Les poupées peuvent être tes amies pour jouer !',
        }
        
        fact = educational_facts.get(object_name, 'C\'est un objet très intéressant !')
        description += fact
        
        return {
            "description": description,
            "object_found": True,
            "object_name": object_name,
            "color": color_name,
            "size": size_name,
            "confidence": float(confidence)
        }
        
    except Exception as e:
        print(f"Erreur lors de la description d'objet: {e}")
        return {
            "description": "Oups ! J'ai eu un problème pour voir ton objet ! Peux-tu essayer encore ?",
            "object_found": False,
            "error": str(e)
        }

# Gestionnaire d'événement de démarrage pour charger le modèle YOLOv5
@app.on_event("startup")
async def startup_event():
    """
    Événement de démarrage pour initialiser le modèle YOLOv5
    """
    print("🤖 Initialisation du modèle YOLOv5...")
    if not TEST_MODE:
        load_model()
        if object_model:
            print("✅ Modèle YOLOv5 chargé avec succès au démarrage !")
        else:
            print("❌ Échec du chargement du modèle YOLOv5 au démarrage")
    else:
        print("⚠️ Mode test activé - Modèle YOLOv5 non chargé")

# Démarrage du serveur FastAPI avec Uvicorn
if __name__ == "__main__":
    import uvicorn
    print("🚀 Démarrage du serveur Toy Helper Backend...")
    print("📡 Serveur accessible sur: http://localhost:8000")
    print("📋 Documentation API: http://localhost:8000/docs")
    print("🔄 Mode rechargement automatique activé")
    uvicorn.run(
        "main:app", 
        host="127.0.0.1", 
        port=8000, 
        reload=True,
        log_level="info"
    )
