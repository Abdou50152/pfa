import requests
import json

# Test de l'endpoint chat_with_assistant
def test_chat_assistant():
    print("=== Test de l'endpoint chat_with_assistant ===")
    url = "http://127.0.0.1:8000/chat_with_assistant/"
    
    data = {
        "message": "bonjour",
        "context": "enfant"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Response: {result}")
            return True
        else:
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"Exception: {e}")
        return False

# Test de l'endpoint describe_object avec une image simple
def test_describe_object():
    print("\n=== Test de l'endpoint describe_object ===")
    url = "http://127.0.0.1:8000/describe_object/"
    
    # Créer une image de test simple
    from PIL import Image
    import io
    
    # Créer une image vide 100x100 pixels
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    files = {'file': ('test.jpg', img_bytes, 'image/jpeg')}
    
    try:
        response = requests.post(url, files=files)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Response: {result}")
            return True
        else:
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"Exception: {e}")
        return False

# Test de connexion au serveur
def test_server_connection():
    print("=== Test de connexion au serveur ===")
    url = "http://127.0.0.1:8000/"
    
    try:
        response = requests.get(url)
        print(f"Server Status Code: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"Server connection failed: {e}")
        return False

import requests
import os
from PIL import Image, ImageDraw
import io

def test_backend_detection():
    """Test direct du backend pour vérifier la détection"""
    
    # URL du backend
    url = "http://127.0.0.1:8000/simple_detect_objects/"
    
    print("🔬 Test du backend - Détection d'objets")
    print("=" * 50)
    
    try:
        # Vérifier si le serveur répond
        health_check = requests.get("http://127.0.0.1:8000/")
        print(f"✅ Serveur backend actif: {health_check.status_code}")
    except Exception as e:
        print(f"❌ Serveur backend INACCESSIBLE: {e}")
        return False
    
    # Créer une image de test simple avec des objets visibles
    print("\n🖼️ Création d'une image de test...")
    
    # Image de test avec des formes géométriques colorées
    img = Image.new('RGB', (640, 480), color='white')
    draw = ImageDraw.Draw(img)
    
    # Dessiner quelques formes simples qui ressemblent à des objets
    draw.rectangle([(100, 100), (200, 200)], fill='red', outline='black', width=3)  # Carré rouge
    draw.ellipse([(300, 150), (400, 250)], fill='blue', outline='black', width=3)   # Cercle bleu
    draw.rectangle([(150, 300), (350, 350)], fill='green', outline='black', width=3) # Rectangle vert
    
    # Sauvegarder l'image de test
    test_image_path = "test_detection_image.jpg"
    img.save(test_image_path)
    print(f"✅ Image de test créée: {test_image_path}")
    
    # Tester avec l'image créée
    try:
        with open(test_image_path, 'rb') as f:
            files = {'file': ('test_image.jpg', f, 'image/jpeg')}
            
            print("\n🚀 Envoi de l'image au backend...")
            response = requests.post(url, files=files, timeout=30)
            
            print(f"📡 Code de réponse: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Réponse reçue: {data}")
                
                if data.get('success'):
                    detected_objects = data.get('detected_objects', [])
                    print(f"\n🎯 Objets détectés: {len(detected_objects)}")
                    
                    for i, obj in enumerate(detected_objects):
                        print(f"  {i+1}. {obj.get('name', 'inconnu')} - {obj.get('color', 'aucune couleur')} - {obj.get('size', 'taille inconnue')} (conf: {obj.get('confidence', 0):.2f})")
                    
                    if len(detected_objects) == 0:
                        print("⚠️ PROBLÈME: Aucun objet détecté dans l'image de test")
                        return False
                    else:
                        print("✅ Détection fonctionne!")
                        return True
                else:
                    print(f"❌ Erreur backend: {data.get('message', 'Erreur inconnue')}")
                    return False
            else:
                print(f"❌ Erreur HTTP: {response.status_code}")
                print(f"Réponse: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        return False
    
    finally:
        # Nettoyer l'image de test
        if os.path.exists(test_image_path):
            os.remove(test_image_path)

def test_with_real_photo():
    """Test avec une vraie photo si disponible"""
    
    # Chercher une image de test dans le répertoire courant
    test_images = [
        "test.jpg", "test.png", "sample.jpg", "photo.jpg",
        "image.jpg", "demo.jpg", "object.jpg"
    ]
    
    found_image = None
    for img_name in test_images:
        if os.path.exists(img_name):
            found_image = img_name
            break
    
    if not found_image:
        print("\n📸 Aucune image de test trouvée dans le répertoire")
        return False
    
    print(f"\n📸 Test avec image réelle: {found_image}")
    
    url = "http://127.0.0.1:8000/simple_detect_objects/"
    
    try:
        with open(found_image, 'rb') as f:
            files = {'file': (found_image, f, 'image/jpeg')}
            response = requests.post(url, files=files, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                print(f"Réponse avec vraie photo: {data}")
                
                if data.get('success'):
                    detected_objects = data.get('detected_objects', [])
                    print(f"🎯 Objets détectés dans la vraie photo: {len(detected_objects)}")
                    
                    for obj in detected_objects:
                        print(f"  - {obj.get('name')} ({obj.get('color')}, {obj.get('size')}) - conf: {obj.get('confidence'):.2f}")
                    
                    return len(detected_objects) > 0
                else:
                    print(f"❌ Erreur avec vraie photo: {data.get('message')}")
                    return False
            else:
                print(f"❌ Erreur HTTP avec vraie photo: {response.status_code}")
                return False
                
    except Exception as e:
        print(f"❌ Erreur test vraie photo: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Tests des endpoints backend\n")
    
    # Test de connexion
    if not test_server_connection():
        print("❌ Le serveur backend n'est pas accessible. Vérifiez qu'il est démarré.")
        exit(1)
    
    # Test chat assistant
    chat_success = test_chat_assistant()
    
    # Test description d'objet
    describe_success = test_describe_object()
    
    print(f"\n📊 Résultats des tests:")
    print(f"Chat Assistant: {'✅ OK' if chat_success else '❌ ERREUR'}")
    print(f"Describe Object: {'✅ OK' if describe_success else '❌ ERREUR'}")
    
    if chat_success and describe_success:
        print("\n🎉 Tous les tests passent ! Le backend fonctionne correctement.")
    else:
        print("\n⚠️ Certains tests échouent. Vérifiez les logs du backend.")

    print("\n" + "=" * 60)
    print("🧪 DÉMARRAGE DES TESTS BACKEND")
    print("=" * 60)
    
    # Test 1: Backend avec image synthétique
    success1 = test_backend_detection()
    
    # Test 2: Backend avec vraie photo si disponible
    success2 = test_with_real_photo()
    
    print("\n" + "=" * 60)
    print("📊 RÉSULTATS DES TESTS:")
    print(f"✅ Test image synthétique: {'RÉUSSI' if success1 else 'ÉCHOUÉ'}")
    print(f"✅ Test vraie photo: {'RÉUSSI' if success2 else 'ÉCHOUÉ'}")
    
    if not success1 and not success2:
        print("\n❌ PROBLÈME MAJEUR: Aucun test n'a réussi!")
        print("Vérifiez:")
        print("1. Le serveur backend est-il démarré?")
        print("2. Le modèle YOLOv5 se charge-t-il correctement?")
        print("3. Y a-t-il des erreurs dans les logs du serveur?")
    elif success1 or success2:
        print("\n✅ Au moins un test réussi - Le backend fonctionne!")
        print("Le problème pourrait être dans le frontend ou la caméra.")
