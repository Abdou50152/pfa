"""
Script pour entraîner un modèle YOLOv5 personnalisé sur un jeu de données de jouets.

Pour utiliser ce script:
1. Préparez votre jeu de données avec des images et annotations au format YOLO
2. Ajustez le fichier data.yaml selon vos classes
3. Exécutez ce script

Dépendances:
pip install -r https://raw.githubusercontent.com/ultralytics/yolov5/master/requirements.txt
"""

import os
import yaml
import argparse
from pathlib import Path

def train_custom_model(data_yaml_path, epochs=100, img_size=640, batch_size=16):
    # Vérifier si CUDA (GPU) est disponible
    import torch
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Utilisation de: {device}")
    
    # Cloner le repo YOLOv5 si nécessaire
    if not os.path.exists('yolov5'):
        os.system('git clone https://github.com/ultralytics/yolov5')
        os.system('pip install -r yolov5/requirements.txt')
    
    # Vérifier le fichier data.yaml
    with open(data_yaml_path, 'r') as f:
        data = yaml.safe_load(f)
        print(f"Classes à entraîner: {data['names']}")
        print(f"Nombre de classes: {data['nc']}")
    
    # Lancer l'entraînement
    cmd = f"cd yolov5 && python train.py --img {img_size} --batch {batch_size} --epochs {epochs} --data {data_yaml_path} --weights yolov5s.pt --device {device}"
    print(f"Exécution de la commande: {cmd}")
    os.system(cmd)
    
    # Le modèle entraîné sera disponible dans yolov5/runs/train/exp/weights/best.pt
    result_path = Path('yolov5/runs/train/exp/weights/best.pt')
    
    # Copier le modèle dans le dossier models
    os.makedirs('models', exist_ok=True)
    target_path = 'models/custom_yolov5_toys.pt'
    
    if result_path.exists():
        os.system(f"cp {result_path} {target_path}")
        print(f"Modèle entraîné copié vers {target_path}")
    else:
        print("L'entraînement n'a pas produit de modèle. Vérifiez les erreurs.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Entraîner un modèle YOLOv5 personnalisé')
    parser.add_argument('--data', type=str, default='data.yaml', help='chemin vers le fichier data.yaml')
    parser.add_argument('--epochs', type=int, default=100, help='nombre d\'époques d\'entraînement')
    parser.add_argument('--img_size', type=int, default=640, help='taille des images')
    parser.add_argument('--batch_size', type=int, default=16, help='taille du batch')
    
    args = parser.parse_args()
    train_custom_model(args.data, args.epochs, args.img_size, args.batch_size)