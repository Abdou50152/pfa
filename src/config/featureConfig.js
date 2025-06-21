// Configuration des fonctionnalités pour l'application My Toy Helper
// Ce fichier active/désactive certaines fonctionnalités et stocke les paramètres

const featureConfig = {
  // Configuration pour LetterLearning.jsx
  letterLearning: {
    // Active la reconnaissance des gestes pour tracer les lettres
    gestureRecognition: {
      enabled: true,
      sensitivity: 0.7, // Sensibilité de la détection (0.0-1.0)
      minTracePoints: 15, // Nombre minimum de points pour commencer l'analyse
      detectionThreshold: 0.6, // Seuil de confiance pour la détection des lettres
      drawTracePath: true, // Affiche le tracé du doigt
    },
    
    // Configuration de l'assistant vocal
    voiceAssistant: {
      enabled: true,
      preferredLanguage: 'fr-FR',
      speechRate: 0.9, // Vitesse de la parole (0.1-1.0)
      autoSpeakNewLetter: true, // Dit automatiquement la nouvelle lettre
    },
    
    // Configuration de la caméra
    camera: {
      enabled: true,
      width: 320,
      height: 240,
      autoStart: true, // Démarrer automatiquement la caméra
    }
  }
};

export default featureConfig;
