# migration.py
from sqlalchemy import create_engine, text
from models import Base

# Définir les paramètres de connexion comme dans create_db.py
DB_USER = "root"
DB_PASSWORD = ""
DB_HOST = "localhost" 
DB_NAME = "toy_helper_db"

# Créer la chaîne de connexion
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

def apply_migration():
    # Connexion à la base de données
    engine = create_engine(DATABASE_URL)
    conn = engine.connect()

    try:
        # Vérifier si la colonne existe déjà
        check_column = text(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
            "WHERE TABLE_NAME = 'chambres' AND COLUMN_NAME = 'completed_tasks'"
        )
        result = conn.execute(check_column)
        column_exists = result.scalar() > 0

        # Si la colonne n'existe pas, l'ajouter
        if not column_exists:
            print("Ajout de la colonne 'completed_tasks'...")
            add_column = text(
                "ALTER TABLE chambres ADD COLUMN completed_tasks INTEGER DEFAULT 0"
            )
            conn.execute(add_column)
            print("Migration réussie: colonne 'completed_tasks' ajoutée!")
        else:
            print("La colonne 'completed_tasks' existe déjà.")

    except Exception as e:
        print(f"Erreur lors de la migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    apply_migration()