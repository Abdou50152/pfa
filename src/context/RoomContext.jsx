import React, { createContext, useState, useContext, useEffect } from 'react';

// Création du contexte
const RoomContext = createContext();

// Provider qui encapsule l'application
export const RoomProvider = ({ children }) => {
  const [roomImages, setRoomImages] = useState([]);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);
  const [cleanupProgress, setCleanupProgress] = useState({});

  // Chargement des données depuis localStorage au démarrage
  useEffect(() => {
    try {
      const savedImages = localStorage.getItem('roomImages');
      const savedObjects = localStorage.getItem('detectedObjects');
      const savedImage = localStorage.getItem('currentImage');
      const savedProgress = localStorage.getItem('cleanupProgress');
      
      if (savedImages) setRoomImages(JSON.parse(savedImages));
      if (savedObjects) setDetectedObjects(JSON.parse(savedObjects));
      if (savedImage) setCurrentImage(JSON.parse(savedImage));
      if (savedProgress) setCleanupProgress(JSON.parse(savedProgress));
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    }
  }, []);

  // Sauvegarde une nouvelle image de chambre avec les objets détectés
  const saveRoomImage = (imageData, objects) => {
    try {
      const newImage = {
        id: Date.now(),
        image: imageData,
        timestamp: new Date().toISOString(),
        objects: objects
      };
      
      const updatedImages = [...roomImages, newImage];
      setRoomImages(updatedImages);
      setDetectedObjects(objects);
      setCurrentImage(imageData);
      
      // Réinitialiser le suivi de progression
      const newProgress = {};
      objects.forEach(obj => {
        newProgress[obj.name] = false;
      });
      setCleanupProgress(newProgress);
      
      // Sauvegarder dans localStorage
      localStorage.setItem('roomImages', JSON.stringify(updatedImages));
      localStorage.setItem('detectedObjects', JSON.stringify(objects));
      localStorage.setItem('currentImage', JSON.stringify(imageData));
      localStorage.setItem('cleanupProgress', JSON.stringify(newProgress));
      
      return true;
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'image:", error);
      return false;
    }
  };

  // Génère des conseils de rangement basés sur les objets détectés
  const generateCleanupTips = () => {
    if (!detectedObjects || detectedObjects.length === 0) return [];
    
    return detectedObjects.map(obj => {
      // Détermine l'emplacement approprié pour chaque type d'objet
      let location = getLocationTip(obj.name);
      
      return {
        objectName: obj.name,
        instruction: `Range ${getArticle(obj.name)} ${obj.name} ${location}`,
        isComplete: cleanupProgress[obj.name] || false,
        icon: getObjectIcon(obj.name)
      };
    });
  };
  
  // Détermine l'article à utiliser (le/la/les)
  const getArticle = (objectType) => {
    const articles = {
      'lego': 'les',
      'legos': 'les',
      'ballon': 'le',
      'ballons': 'les',
      'balle': 'la',
      'balles': 'les',
      'voiture': 'la',
      'voitures': 'les',
      'livre': 'le',
      'livres': 'les',
      'peluche': 'la',
      'peluches': 'les'
    };
    
    return articles[objectType.toLowerCase()] || 'le/la';
  };
  
  // Renvoie l'icône appropriée pour chaque type d'objet
  const getObjectIcon = (objectType) => {
    const icons = {
      'lego': '🧩',
      'legos': '🧩',
      'ballon': '⚽',
      'ballons': '⚽',
      'balle': '🏀',
      'balles': '🏀',
      'voiture': '🚗',
      'voitures': '🚗',
      'livre': '📚',
      'livres': '📚',
      'peluche': '🧸',
      'peluches': '🧸',
      'jouet': '🎮',
      'jouets': '🎮'
    };
    
    return icons[objectType.toLowerCase()] || '🧸';
  };
  
  // Indique où ranger chaque type d'objet
  const getLocationTip = (objectType) => {
    const locations = {
      'lego': 'dans la boîte bleue',
      'legos': 'dans la boîte bleue',
      'ballon': 'dans le panier de sport',
      'ballons': 'dans le panier de sport',
      'balle': 'dans le panier de sport',
      'balles': 'dans le panier de sport',
      'voiture': 'sur l\'étagère des voitures',
      'voitures': 'sur l\'étagère des voitures',
      'livre': 'dans la bibliothèque',
      'livres': 'dans la bibliothèque',
      'peluche': 'sur le lit',
      'peluches': 'sur le lit',
      'crayon': 'dans la boîte à crayons',
      'crayons': 'dans la boîte à crayons'
    };
    
    return locations[objectType.toLowerCase()] || 'à sa place';
  };
  
  // Marque un objet comme rangé
  const markItemAsComplete = (objectName) => {
    const updatedProgress = {
      ...cleanupProgress,
      [objectName]: true
    };
    
    setCleanupProgress(updatedProgress);
    localStorage.setItem('cleanupProgress', JSON.stringify(updatedProgress));
    
    // Vérifier si tous les objets sont rangés
    const allComplete = Object.values(updatedProgress).every(status => status);
    
    return allComplete;
  };
  
  // Réinitialise la progression du rangement
  const resetCleanupProgress = () => {
    const newProgress = {};
    detectedObjects.forEach(obj => {
      newProgress[obj.name] = false;
    });
    
    setCleanupProgress(newProgress);
    localStorage.setItem('cleanupProgress', JSON.stringify(newProgress));
  };

  return (
    <RoomContext.Provider 
      value={{ 
        roomImages, 
        detectedObjects, 
        currentImage,
        saveRoomImage,
        generateCleanupTips,
        markItemAsComplete,
        resetCleanupProgress,
        cleanupProgress
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useRoom = () => useContext(RoomContext);

export default RoomContext;
