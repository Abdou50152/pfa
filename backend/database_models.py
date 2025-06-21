from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, Float, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Utilisateur(Base):
    __tablename__ = "utilisateurs"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=True)
    email = Column(String(100), unique=True, index=True, nullable=True)
    mot_de_passe = Column(String(255), nullable=True)
    age = Column(Integer)
    avatar = Column(String(255))
    date_inscription = Column(DateTime, default=datetime.utcnow)
    derniere_connexion = Column(DateTime, default=datetime.utcnow)

    # Relations
    dessins = relationship("Dessin", back_populates="utilisateur")
    progressions = relationship("Progression", back_populates="utilisateur")
    chambre = relationship("Chambre", back_populates="utilisateur", uselist=False)


class Dessin(Base):
    __tablename__ = "dessins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("utilisateurs.id"), nullable=False)
    image_path = Column(String(255), nullable=False)
    date_creation = Column(DateTime, default=datetime.utcnow)
    description = Column(Text, nullable=True)
    objet_detecte = Column(String(100), nullable=True)  # Type d'objet détecté dans le dessin

    # Relations
    utilisateur = relationship("Utilisateur", back_populates="dessins")


class Chambre(Base):
    __tablename__ = "chambres"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("utilisateurs.id"), nullable=False, unique=True)
    image_path = Column(String(255), nullable=False)
    objets_reference = Column(Text, nullable=True)  # Storing detected objects as JSON string
    date_creation = Column(DateTime, default=datetime.utcnow)
    completed_tasks = Column(Integer, default=0)  # Nombre de tâches complétées

    # Relation
    utilisateur = relationship("Utilisateur", back_populates="chambre")


class LegoStage(Base):
    __tablename__ = "lego_stages"

    id = Column(Integer, primary_key=True, index=True)
    niveau = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    image_path = Column(String(255), nullable=True)
    difficulte = Column(Integer, default=1)  # 1=facile, 2=moyen, 3=difficile

    # Relations
    progressions = relationship("Progression", back_populates="stage")


class Progression(Base):
    __tablename__ = "progressions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("utilisateurs.id"), nullable=False)
    stage_id = Column(Integer, ForeignKey("lego_stages.id"), nullable=False)
    completed = Column(Boolean, default=False)
    score = Column(Integer, default=0)
    date_completed = Column(DateTime, nullable=True)
    
    # Relations
    utilisateur = relationship("Utilisateur", back_populates="progressions")
    stage = relationship("LegoStage", back_populates="progressions")


class MemoryLevel(Base):
    __tablename__ = "memory_levels"

    id = Column(Integer, primary_key=True, index=True)
    niveau = Column(Integer, nullable=False)
    difficulte = Column(Integer, default=1)  # 1=facile, 2=moyen, 3=difficile
    date_creation = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    cards = relationship("MemoryCard", back_populates="level")


class MemoryCard(Base):
    __tablename__ = "memory_cards"

    id = Column(Integer, primary_key=True, index=True)
    level_id = Column(Integer, ForeignKey("memory_levels.id"), nullable=False)
    image_path = Column(String(255), nullable=False)
    paire_id = Column(Integer, nullable=False)  # Les cartes avec le même paire_id forment une paire
    description = Column(Text, nullable=True)
    
    # Relations
    level = relationship("MemoryLevel", back_populates="cards")


class Objects(Base):
    """
    Table des objets reconnaissables par le système
    Permet d'avoir des noms canoniques et des descriptions standardisées
    """
    __tablename__ = "objects"
    
    id = Column(Integer, primary_key=True, index=True)
    name_en = Column(String(100), nullable=False, comment="Nom anglais (pour matching YOLOv5)")
    name_fr = Column(String(100), nullable=False, comment="Nom français (pour l'enfant)")
    category_fr = Column(String(50), comment="Catégorie en français")
    synonyms = Column(Text, comment="Synonymes séparés par des virgules")
    default_colors = Column(Text, comment="Couleurs typiques séparées par des virgules")
    typical_sizes = Column(String(50), comment="Tailles typiques: petit,moyen,grand")
    child_description = Column(Text, comment="Description adaptée aux enfants")
    educational_fact = Column(Text, comment="Fait éducatif sur l'objet")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Object(name_fr='{self.name_fr}', category='{self.category_fr}')>"


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("utilisateurs.id"), nullable=True)
    action = Column(String(100), nullable=False)
    page = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(Text, nullable=True)  # Stocke les détails JSON sous forme de texte
