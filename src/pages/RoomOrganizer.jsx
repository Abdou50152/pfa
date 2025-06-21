import React, { useState, useRef, useEffect } from "react";
import { useRoom } from "../context/RoomContext";

// Fonction utilitaire pour obtenir l'icône appropriée selon le type d'objet
const getObjectIcon = (objectName) => {
  const lowerName = objectName.toLowerCase();
  
  // Mapper les noms d'objets avec leurs icônes
  if (lowerName.includes('livre') || lowerName.includes('book')) return '📚';
  if (lowerName.includes('peluche') || lowerName.includes('teddy') || lowerName.includes('bear')) return '🧸';
  if (lowerName.includes('voiture') || lowerName.includes('car')) return '🚗';
  if (lowerName.includes('ballon') || lowerName.includes('ball')) return '⚽';
  if (lowerName.includes('puzzle') || lowerName.includes('jigsaw')) return '🧩';
  if (lowerName.includes('poupée') || lowerName.includes('doll')) return '👧';
  if (lowerName.includes('lego') || lowerName.includes('bloc')) return '🧱';
  if (lowerName.includes('crayon') || lowerName.includes('pencil')) return '✏️';
  if (lowerName.includes('jouet') || lowerName.includes('toy')) return '🎮';
  
  // Icône par défaut
  return '🧸';
};

// Fonction pour synthèse vocale
const speakText = (text) => {
  // Vérifier si la synthèse vocale est disponible
  if ('speechSynthesis' in window) {
    // Arrêter toute synthèse en cours
    window.speechSynthesis.cancel();
    
    // Créer une nouvelle instance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configurer la voix en français
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;  // Légèrement plus lent pour les enfants
    
    // Trouver une voix française si disponible
    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find(voice => voice.lang.includes('fr'));
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }
    
    // Parler
    window.speechSynthesis.speak(utterance);
    return true;
  }
  return false;
};

const RoomOrganizer = () => {
  const { roomImageUrl, detectedObjects, cleanupItems, markItemCleaned, resetCleanup } = useRoom();
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedObjectsState, setDetectedObjects] = useState([]);
  const [lastAnnouncement, setLastAnnouncement] = useState("");
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [isDetectingState, setIsDetectingState] = useState(false);
  const [detectionInterval, setDetectionInterval] = useState(3000);
  const [gameInstructions, setGameInstructions] = useState("");
  const [showUploadedImage, setShowUploadedImage] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [cleanupTips, setCleanupTips] = useState([]);
  const [cleanupProgress, setCleanupProgress] = useState({});
  const [progressMessage, setProgressMessage] = useState("");
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const [referenceImage, setReferenceImage] = useState(null);
  
  // Nouveaux états pour l'assistant conversationnel
  const [isListening, setIsListening] = useState(false);
  const [isDescribing, setIsDescribing] = useState(false);
  const [assistantMode, setAssistantMode] = useState('cleanup'); // 'cleanup', 'describe', 'chat'
  const [conversation, setConversation] = useState([]);
  const [currentObjectDescription, setCurrentObjectDescription] = useState("");
  
  const detectionIntervalRef = useRef(null);
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);

  // Charger l'image de référence
  useEffect(() => {
    const fetchReferenceImage = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/chambre/get_reference/");
        if (response.ok) {
          const data = await response.json();
          if (data && data.image_path) {
            // Récupérer l'image depuis le chemin retourné par l'API
            setReferenceImage(`http://127.0.0.1:8000/uploads/${data.image_path.split('/').pop()}`);
          }
        } else {
          console.error("Erreur lors du chargement de l'image de référence");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'image de référence", error);
      }
    };

    fetchReferenceImage();
  }, []);

  // Initialiser la reconnaissance vocale
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'fr-FR';
      
      recognitionRef.current.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognized:', transcript);
        await handleChildQuestion(transcript);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        speakText("Oups ! Je n'ai pas bien entendu ta question. Peux-tu répéter ?");
      };
    }
  }, []);

  // Fonction pour gérer les questions des enfants
  const handleChildQuestion = async (question) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/chat_with_assistant/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: question,
          context: "enfant"
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Ajouter à la conversation
        setConversation(prev => [
          ...prev,
          { type: 'child', message: question, timestamp: new Date() },
          { type: 'assistant', message: data.response, timestamp: new Date() }
        ]);
        
        // Parler la réponse
        speakText(data.response);
      } else {
        speakText("Désolé, je n'ai pas compris ta question. Peux-tu la répéter ?");
      }
    } catch (error) {
      console.error('Error in chat:', error);
      speakText("Oups ! J'ai eu un petit problème. Peux-tu répéter ta question ?");
    }
  };

  // Fonction pour décrire un objet que l'enfant montre
  const describeObjectInHand = async () => {
    if (!videoRef.current || !isCameraOn || isDescribing) return;
    
    setIsDescribing(true);
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convertir en blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      });

      // Créer FormData pour l'upload
      const formData = new FormData();
      formData.append('file', blob, 'object_to_describe.jpg');

      console.log('Sending image to describe_object endpoint...');
      
      const response = await fetch("http://127.0.0.1:8000/describe_object/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response from describe_object:', data);
      
      setCurrentObjectDescription(data.description);
      speakText(data.description);
      
      // Ajouter à la conversation si un objet a été trouvé
      if (data.object_found) {
        setConversation(prev => [
          ...prev,
          { 
            type: 'assistant', 
            message: data.description, 
            timestamp: new Date(),
            object_info: {
              name: data.object_name,
              color: data.color,
              size: data.size
            }
          }
        ]);
      }
      
    } catch (error) {
      console.error('Error describing object:', error);
      const errorMsg = "Oups ! Je n'arrive pas à voir ton objet clairement. Peux-tu le montrer un peu plus près de la caméra ?";
      setCurrentObjectDescription(errorMsg);
      speakText(errorMsg);
    } finally {
      setIsDescribing(false);
    }
  };

  // Fonction pour démarrer l'écoute
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
      speakText("Je t'écoute ! Pose-moi ta question !");
    }
  };

  // Lire les instructions à haute voix quand de nouveaux objets sont détectés
  useEffect(() => {
    if (assistantMode === 'cleanup' && cleanupTips && cleanupTips.length > 0) {
      // Introduction
      let fullText = "J'ai trouvé des objets à ranger! ";
      
      // Ajouter le message de progression si disponible
      if (progressMessage) {
        fullText += progressMessage + " ";
      }
      
      // Lister les objets trouvés
      if (cleanupTips.length === 1) {
        fullText += `Je vois ${cleanupTips[0].title}. ${cleanupTips[0].instruction}`;
      } else if (cleanupTips.length <= 3) {
        const objects = cleanupTips.map(tip => tip.title).join(", ");
        fullText += `Je vois: ${objects}. Commençons par ranger ces objets un par un!`;
      } else {
        fullText += `Je vois ${cleanupTips.length} objets à ranger. Commençons par les premiers!`;
      }
      
      // Parler le texte complet
      setTimeout(() => {
        const success = speakText(fullText);
        if (!success) {
          console.warn("Synthèse vocale non disponible");
        }
      }, 500); // Petit délai pour s'assurer que l'UI est mise à jour
    }
  }, [cleanupTips, progressMessage, assistantMode]);

  // Assistant vocal pour encourager les enfants
  useEffect(() => {
    if (assistantMode === 'cleanup' && completedTasksCount > 0 && totalTasksCount > 0) {
      const encouragements = [
        "Excellent travail! Continue comme ça!",
        "Bravo! Tu ranges très bien ta chambre!", 
        "Super! Tu es un vrai champion du rangement!",
        "Magnifique! Ta chambre devient de plus en plus belle!",
        "Formidable! Tu fais un travail fantastique!"
      ];
      
      let message = encouragements[Math.floor(Math.random() * encouragements.length)];
      
      if (completedTasksCount === totalTasksCount) {
        message = "Félicitations! Tu as rangé toute ta chambre! Tu es incroyable!";
      } else if (completedTasksCount / totalTasksCount >= 0.5) {
        message += " Tu as déjà rangé plus de la moitié!";
      }
      
      setTimeout(() => {
        speakText(message);
      }, 1000);
    }
  }, [completedTasksCount, totalTasksCount, assistantMode]);

  const startCamera = async () => {
    setError("");
    setDetectionResult(null);
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = "Votre navigateur ne supporte pas l'accès à la caméra.";
      setError(errorMsg);
      speakText("Oups! Ton navigateur ne peut pas utiliser la caméra. Demande de l'aide à un adulte.");
      return;
    }

    try {
      const constraints = {
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      };

      const streamData = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(streamData);
      setIsCameraOn(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = streamData;
        // Attendre que la vidéo soit prête
        videoRef.current.onloadedmetadata = () => {
          speakText("Parfait! La caméra est maintenant activée. Montre-moi ta chambre pour que je puisse t'aider à la ranger!");
        };
      }

      // Set initial game instructions
      setGameInstructions("Scanne ta chambre pour détecter les jouets. Nous allons te guider pour les ranger!");
      
      // Démarrer la détection automatique après 2 secondes
      setTimeout(() => {
        if (streamData && streamData.active) {
          startAutoDetection();
        }
      }, 2000);
      
    } catch (err) {
      console.error("Camera access error:", err);
      let errorMessage = `Erreur d'accès à la caméra: ${err.message}`;
      let spokenMessage = "Oups! Je n'arrive pas à utiliser la caméra. ";
      
      if (err.name === "NotAllowedError") {
        errorMessage = "Permission refusée. Veuillez autoriser l'accès à la caméra.";
        spokenMessage += "Demande à un adulte d'autoriser l'utilisation de la caméra.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "Aucune caméra n'a été trouvée.";
        spokenMessage += "Il semble qu'aucune caméra ne soit connectée.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "La caméra est déjà utilisée par une autre application.";
        spokenMessage += "La caméra est déjà utilisée. Ferme les autres applications qui pourraient l'utiliser.";
      }
      
      setError(errorMessage);
      setIsCameraOn(false);
      speakText(spokenMessage);
    }
  };

  // Fonction pour démarrer la détection automatique
  const startAutoDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    detectionIntervalRef.current = setInterval(() => {
      if (isCameraOn && !isDetectingState) {
        captureAndDetect();
      }
    }, detectionInterval);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsCameraOn(false);
    setStream(null);
    setDetectionResult(null);
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  const captureAndDetect = async () => {
    if (!videoRef.current || !isCameraOn || isDetectingState) return;
    
    setIsDetectingState(true);
    setDetectionResult(null);

    try {
      const video = videoRef.current;
      
      // Vérifier que la vidéo est prête
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn('⚠️ Vidéo pas encore prête, dimensions:', video.videoWidth, 'x', video.videoHeight);
        setTimeout(() => {
          setIsDetectingState(false);
          captureAndDetect(); // Réessayer
        }, 500);
        return;
      }
      
      console.log('📹 Capture vidéo:', video.videoWidth, 'x', video.videoHeight);
      
      const canvas = document.createElement('canvas');
      // Utiliser une résolution optimale pour YOLOv5
      const targetWidth = 640;
      const targetHeight = 480;
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const context = canvas.getContext('2d');
      
      // Dessiner l'image redimensionnée
      context.drawImage(video, 0, 0, targetWidth, targetHeight);
      
      console.log('🖼️ Canvas créé:', canvas.width, 'x', canvas.height);

      // Convertir en blob avec meilleure qualité
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9); // Qualité augmentée à 0.9
      });
      
      console.log('📦 Blob créé, taille:', blob.size, 'bytes');

      // Créer FormData pour l'upload
      const formData = new FormData();
      formData.append('file', blob, 'detection_image.jpg');

      console.log('🔍 Envoi de l\'image pour détection simple...');
      
      // Utiliser le nouvel endpoint simple
      const response = await fetch("http://127.0.0.1:8000/simple_detect_objects/", {
        method: "POST",
        body: formData,
      });

      console.log('📡 Réponse HTTP:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur HTTP:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('📋 Réponse détaillée:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        // Mettre à jour les objets détectés
        setDetectedObjects(data.detected_objects || []);
        
        console.log('🎯 Objets détectés:', data.detected_objects?.length || 0);
        data.detected_objects?.forEach((obj, i) => {
          console.log(`  ${i+1}. ${obj.name} (${obj.color}, ${obj.size}) - conf: ${obj.confidence?.toFixed(2)}`);
        });
        
        // Annoncer les objets trouvés
        if (data.detected_objects && data.detected_objects.length > 0) {
          announceDetectedObjects(data.detected_objects);
        } else {
          // Annoncer qu'aucun objet n'a été trouvé (occasionnellement)
          if (Math.random() < 0.3) { // 30% de chance
            speakText("Je ne vois aucun objet intéressant pour le moment. Montre-moi autre chose !");
          }
        }
        
        setDetectionResult({
          success: true,
          message: data.message
        });
      } else {
        setDetectionResult({
          success: false,
          message: data.message || "Problème de détection"
        });
        speakText("Oups! J'ai eu un petit problème pour analyser l'image. Essayons encore!");
      }
      
    } catch (error) {
      console.error("❌ Erreur de détection:", error);
      const errorMsg = `Erreur: ${error.message}`;
      setDetectionResult({
        success: false,
        message: errorMsg
      });
      speakText("Oups! J'ai eu un problème pour voir l'image. Réessayons dans quelques secondes!");
    } finally {
      setIsDetectingState(false);
    }
  };

  const handleIntervalChange = (e) => {
    const newInterval = parseInt(e.target.value);
    setDetectionInterval(newInterval);
    
    if (isCameraOn && detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = setInterval(captureAndDetect, newInterval);
    }
  };

  const markItemAsComplete = async (id) => {
    try {
      // Appeler l'API pour incrémenter le compteur de tâches
      const response = await fetch("http://127.0.0.1:8000/complete_task/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement de la tâche terminée");
      }

      const data = await response.json();
      
      // Mettre à jour l'état local
      setCleanupProgress(prev => ({
        ...prev,
        [id]: true
      }));
      
      // Mettre à jour le compteur et le message
      setCompletedTasksCount(data.completed_tasks);
      setProgressMessage(data.progress_message);
      
      // Annoncer le message d'encouragement
      const speechMessage = new SpeechSynthesisUtterance(data.progress_message);
      speechMessage.lang = 'fr-FR';
      window.speechSynthesis.speak(speechMessage);
      
      // Vérifier si toutes les tâches sont complétées
      const allCompleted = Object.values({
        ...cleanupProgress,
        [id]: true
      }).every(Boolean) && cleanupTips.length > 0;
      
      if (allCompleted) {
        setGameInstructions("Félicitations! Tu as rangé tous les objets! ");
      }
      
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const resetCleanupProgress = async () => {
    try {
      // Appeler l'API pour réinitialiser le compteur
      const response = await fetch("http://127.0.0.1:8000/reset_tasks/", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la réinitialisation des tâches");
      }

      // Réinitialiser l'état local
      const newProgress = {};
      cleanupTips.forEach(tip => {
        newProgress[tip.id] = false;
      });
      
      setCleanupProgress(newProgress);
      setCompletedTasksCount(0);
      setProgressMessage("");
      
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  useEffect(() => {
    if (isCameraOn) {
      detectionIntervalRef.current = setInterval(captureAndDetect, detectionInterval);
      return () => {
        if (detectionIntervalRef.current) {
          clearInterval(detectionIntervalRef.current);
        }
      };
    } else if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, [isCameraOn, detectionInterval]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [stream]);

  const startDetection = () => {
    if (!isCameraOn) {
      speakText("Allume d'abord la caméra pour que je puisse voir !");
      return;
    }

    setIsDetecting(true);
    speakText("Je commence à regarder les objets devant moi !");
    
    // Détecter immédiatement puis toutes les 3 secondes
    captureAndDetect();
    detectionIntervalRef.current = setInterval(captureAndDetect, detectionInterval);
  };

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsDetecting(false);
    setDetectedObjects([]);
    speakText("J'arrête de regarder les objets.");
  };

  const announceDetectedObjects = (objects) => {
    if (objects.length === 0) return;

    // Créer l'annonce
    let announcement = "";
    
    if (objects.length === 1) {
      const obj = objects[0];
      announcement = `Je vois ${getArticle(obj.class)} ${obj.class}`;
      
      // Ajouter la couleur si disponible
      if (obj.color) {
        announcement += ` de couleur ${obj.color}`;
      }
      
      // Ajouter la taille si disponible
      if (obj.size) {
        announcement += ` de taille ${obj.size}`;
      }
      
      announcement += " !";
    } else {
      announcement = `Je vois ${objects.length} objets : `;
      const objectNames = objects.map(obj => `${getArticle(obj.class)} ${obj.class}`);
      announcement += objectNames.join(", ") + " !";
    }

    // Éviter les répétitions trop fréquentes
    if (announcement !== lastAnnouncement) {
      setLastAnnouncement(announcement);
      speakText(announcement);
      
      // Réinitialiser après le cooldown
      setTimeout(() => {
        setLastAnnouncement("");
      }, 5000);
    }
  };

  const getArticle = (objectName) => {
    const feminineWords = ['pomme', 'balle', 'voiture', 'chaise', 'table', 'bouteille'];
    return feminineWords.some(word => objectName.toLowerCase().includes(word)) ? 'une' : 'un';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎥 Détecteur d'Objets Magique !
          </h1>
          <p className="text-white text-lg">
            Je regarde devant moi et je te dis tout ce que je vois !
          </p>
        </div>

        {/* Zone vidéo */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-96 bg-gray-900 rounded-xl object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {/* Overlay des objets détectés */}
            {detectedObjectsState.length > 0 && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg">
                <div className="text-sm font-semibold mb-1">Objets détectés :</div>
                {detectedObjectsState.map((obj, index) => (
                  <div key={index} className="text-xs">
                    🔍 {obj.class} {obj.color && `(${obj.color})`} {obj.size && `- ${obj.size}`}
                  </div>
                ))}
              </div>
            )}

            {/* Indicateur de détection */}
            {isDetecting && (
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                👀 Je regarde...
              </div>
            )}
          </div>
        </div>

        {/* Contrôles */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Contrôles de la caméra */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 mb-3">📹 Caméra</h3>
              
              {!isCameraOn ? (
                <button
                  onClick={startCamera}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors text-lg"
                >
                  🎥 Allumer la Caméra
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors text-lg"
                >
                  ⏹️ Éteindre la Caméra
                </button>
              )}
            </div>

            {/* Contrôles de détection */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 mb-3">👁️ Détection</h3>
              
              {!isDetecting ? (
                <button
                  onClick={startDetection}
                  disabled={!isCameraOn}
                  className={`w-full font-bold py-3 px-6 rounded-xl transition-colors text-lg ${
                    isCameraOn 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  👀 Commencer à Regarder
                </button>
              ) : (
                <button
                  onClick={stopDetection}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-colors text-lg"
                >
                  ⏸️ Arrêter de Regarder
                </button>
              )}
            </div>
          </div>

          {/* Messages d'erreur */}
          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
              <div className="flex items-center">
                <span className="text-xl mr-2">⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Dernière annonce */}
          {lastAnnouncement && (
            <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl">
              <div className="flex items-center">
                <span className="text-xl mr-2">🗣️</span>
                <span className="font-semibold">Dernière annonce : {lastAnnouncement}</span>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 p-4 rounded-xl">
            <h4 className="font-bold text-blue-800 mb-2">📝 Comment ça marche :</h4>
            <ol className="text-blue-700 text-sm space-y-1">
              <li>1. 🎥 Clique sur "Allumer la Caméra"</li>
              <li>2. 👀 Clique sur "Commencer à Regarder"</li>
              <li>3. 🗣️ Montre des objets devant la caméra</li>
              <li>4. 👂 Écoute mes annonces !</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomOrganizer;