import mysql.connector
from sqlalchemy import create_engine
from models import Base

# Paramètres de connexion MySQL
DB_USER = "root"
DB_PASSWORD = ""  # Mot de passe vide (par défaut sur certaines installations)
DB_HOST = "localhost"
DB_NAME = "toy_helper_db"

# Créer la base de données si elle n'existe pas
def create_database():
    # Connexion sans spécifier la base de données
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD
    )
    cursor = conn.cursor()
    
    # Création de la base de données
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
    print(f"Base de données '{DB_NAME}' créée ou déjà existante.")
    
    conn.commit()
    cursor.close()
    conn.close()

# Créer les tables à partir des modèles SQLAlchemy
def create_tables():
    # URL de connexion SQLAlchemy
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
    
    # Créer l'engine et les tables
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("Tables créées avec succès.")

if __name__ == "__main__":
    create_database()
    
    create_tables()
    print("Initialisation de la base de données terminée.")
