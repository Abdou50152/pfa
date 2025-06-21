import React, { useState, useRef, useEffect } from "react";
import { FiUpload, FiCamera, FiX, FiLoader } from "react-icons/fi";
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";
import { motion } from "framer-motion";

const PhotoDetection = () => {
  const [image, setImage] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState('prompt');
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Vérifier les permissions de la caméra
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        if (navigator.permissions) {
          const permissionStatus = await navigator.permissions.query({ 
            name: 'camera' 
          });
          setCameraPermission(permissionStatus.state);
          
          permissionStatus.onchange = () => {
            setCameraPermission(permissionStatus.state);
          };
        }
      } catch (err) {
        console.log("L'API Permissions n'est pas supportée");
      }
    };
    
    checkCameraPermission();
  }, []);

  // Charger le modèle TensorFlow
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const loadedModel = await cocossd.load();
        setModel(loadedModel);
      } catch (err) {
        console.error("Échec du chargement du modèle:", err);
        setError("Échec du chargement du modèle IA. Veuillez rafraîchir la page.");
      }
    };
    loadModel();

    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !model) return;

    setIsLoading(true);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = async () => {
          setImage(img.src);
          const detectedObjects = await model.detect(img);
          setPredictions(detectedObjects);
          drawBoundingBoxes(img, detectedObjects);
          setIsLoading(false);
        };
        
        img.onerror = () => {
          setError("Échec du chargement de l'image");
          setIsLoading(false);
        };
      } catch (err) {
        console.error("Erreur de détection:", err);
        setError("Erreur pendant la détection d'objets");
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError("Échec de la lecture du fichier");
      setIsLoading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      stopCameraStream();
      
      if (cameraPermission === 'denied') {
        setError("L'accès à la caméra a été refusé. Veuillez modifier les permissions dans les paramètres de votre navigateur.");
        return;
      }

      setError(null);
      setIsLoading(true);

      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      return new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
            .then(() => {
              setCameraActive(true);
              setIsLoading(false);
              resolve();
            })
            .catch(err => {
              console.error("Erreur de lecture vidéo:", err);
              setError("Impossible de démarrer la caméra. Veuillez réessayer.");
              setIsLoading(false);
              stopCameraStream();
            });
        };
      });
    } catch (err) {
      console.error("Erreur caméra:", err);
      
      let errorMessage = "Impossible d'accéder à la caméra.";
      if (err.name === 'NotAllowedError') {
        errorMessage = "Permission caméra refusée. Veuillez autoriser l'accès dans les paramètres de votre navigateur.";
      } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
        errorMessage = "Aucune caméra adaptée trouvée ou configuration non supportée.";
      } else if (err.name === 'NotReadableError') {
        errorMessage = "La caméra est déjà utilisée par une autre application.";
      }
      
      setError(errorMessage);
      setIsLoading(false);
      setCameraActive(false);
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || !model || !videoRef.current.videoWidth) {
      setError("Caméra non prête. Veuillez réessayer.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageSrc = canvas.toDataURL('image/jpeg');
      
      const img = new Image();
      img.src = imageSrc;
      
      img.onload = async () => {
        setImage(imageSrc);
        const detectedObjects = await model.detect(img);
        setPredictions(detectedObjects);
        drawBoundingBoxes(img, detectedObjects);
        setIsLoading(false);
      };
      
      img.onerror = () => {
        setError("Échec du traitement de l'image capturée");
        setIsLoading(false);
      };
    } catch (err) {
      console.error("Erreur de capture:", err);
      setError("Erreur pendant la capture d'image");
      setIsLoading(false);
    }
  };

  const drawBoundingBoxes = (img, predictions) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0, img.width, img.height);
      
      ctx.font = '16px Arial';
      ctx.textBaseline = 'top';
      
      predictions.forEach(prediction => {
        const [x, y, width, height] = prediction.bbox;
        
        ctx.strokeStyle = '#FF6B9D';
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, width, height);
        
        ctx.fillStyle = '#3B82F6';
        const text = `${prediction.class} (${Math.round(prediction.score * 100)}%)`;
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(x, y, textWidth + 10, 25);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, x + 5, y + 5);
      });
    } catch (err) {
      console.error("Erreur de dessin:", err);
      setError("Erreur pendant l'affichage des résultats");
    }
  };

  const resetDetection = () => {
    setImage(null);
    setPredictions([]);
    setError(null);
    stopCameraStream();
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const BackgroundCircles = () => {
    return (
      <div className="fixed inset-0 overflow-hidden -z-10">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-pink-200 opacity-20"
            initial={{
              x: Math.random() * 100 + 'vw',
              y: Math.random() * 100 + 'vh',
              width: Math.random() * 300 + 100 + 'px',
              height: Math.random() * 300 + 100 + 'px',
            }}
            animate={{
              x: Math.random() * 100 + 'vw',
              y: Math.random() * 100 + 'vh',
              transition: {
                duration: Math.random() * 30 + 20,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut'
              }
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      <BackgroundCircles />
      
      <div className="max-w-6xl mx-auto relative">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-pink-500 text-white p-4 rounded-lg mb-6 flex justify-between items-center"
          >
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-white hover:text-gray-200">
              <FiX size={20} />
            </button>
          </motion.div>
        )}

        {cameraPermission === 'denied' && !error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500 text-white p-4 rounded-lg mb-6"
          >
            <p className="mb-2">L'accès à la caméra est bloqué. Pour l'activer :</p>
            <ul className="list-disc pl-5 text-sm">
              <li>Cliquez sur l'icône caméra dans la barre d'adresse</li>
              <li>Sélectionnez "Toujours autoriser"</li>
              <li>Rafraîchissez la page</li>
            </ul>
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-pink-600 mb-4">
            <span className="text-blue-600">🎆👀Object</span> Explorer🎆👀
          </h1>
          <p className="text-xl text-blue-800 max-w-2xl mx-auto">
            Découvrez le monde ensemble grâce à la détection d'objets par IA
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Section Entrée */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-pink-200 backdrop-blur-sm bg-opacity-80">
            <h2 className="text-2xl font-bold text-blue-700 mb-6">Capturer des moments</h2>
            
            <div className="space-y-6">
              {/* Carte Upload */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className={`relative group rounded-xl overflow-hidden ${image ? '' : 'cursor-pointer'}`}
                onClick={() => !image && fileInputRef.current.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${image ? 'from-white to-pink-50' : 'from-pink-400 to-blue-500'} opacity-90 group-hover:opacity-100 transition-all`}></div>
                <div className="relative z-10 p-8 text-center">
                  {!image ? (
                    <>
                      <FiUpload className="mx-auto text-4xl text-white mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Importer une image</h3>
                      <p className="text-pink-100">JPG, PNG ou WEBP</p>
                    </>
                  ) : (
                    <div className="relative">
                      <img 
                        src={image} 
                        alt="Aperçu uploadé" 
                        className="max-h-64 mx-auto rounded-lg shadow-lg border-2 border-white"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resetDetection();
                        }}
                        className="absolute -top-3 -right-3 bg-pink-500 hover:bg-pink-600 text-white p-2 rounded-full shadow-lg transition-all"
                      >
                        <FiX size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Carte Caméra */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl overflow-hidden border border-pink-200 backdrop-blur-sm bg-opacity-80"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-blue-700 mb-4">Caméra live</h3>
                  
                  {!cameraActive ? (
                    <button
                      onClick={startCamera}
                      disabled={cameraPermission === 'denied'}
                      className={`w-full py-4 bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-3 transition-all ${cameraPermission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <FiCamera size={24} />
                      Activer la caméra
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative bg-pink-50 rounded-lg overflow-hidden border-2 border-pink-300 aspect-video">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={captureImage}
                          className="flex-1 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
                        >
                          <FiCamera size={18} />
                          Capturer
                        </button>
                        <button
                          onClick={resetDetection}
                          className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
                        >
                          <FiX size={18} />
                          Arrêter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Section Résultats */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-blue-200 backdrop-blur-sm bg-opacity-80">
            <h2 className="text-2xl font-bold text-blue-700 mb-6">Résultats</h2>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="text-pink-500 mb-4"
                >
                  <FiLoader size={48} />
                </motion.div>
                <p className="text-blue-600 text-lg">Analyse de l'image...</p>
              </div>
            ) : image ? (
              <div className="space-y-6">
                <div className="relative bg-blue-50 rounded-lg overflow-hidden border-2 border-blue-300">
                  <canvas 
                    ref={canvasRef} 
                    className="w-full h-auto max-h-96 mx-auto"
                  />
                </div>
                
                {predictions.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-700">Objets détectés</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {predictions.map((pred, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gradient-to-r from-pink-50 to-blue-50 rounded-lg p-4 border-l-4 border-pink-400 shadow-sm"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-blue-800">{pred.class}</h4>
                              <p className="text-sm text-blue-600">Confiance: {Math.round(pred.score * 100)}%</p>
                            </div>
                            <div className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                              {pred.class}
                            </div>
                          </div>
                          <div className="mt-2 w-full bg-pink-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${pred.score * 100}%` }}
                            ></div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-blue-600">
                    Aucun objet détecté dans cette image.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-br from-pink-50 to-blue-50 rounded-lg border-2 border-dashed border-pink-300">
                <div className="relative mb-4">
                  <FiCamera size={48} className="text-pink-400" />
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-blue-700">Importez une image ou utilisez la caméra pour explorer les objets</p>
              </div>
            )}
          </div>
        </div>

        {/* Section Mère & Enfant */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-pink-400 to-blue-500 rounded-2xl p-6 shadow-lg backdrop-blur-sm bg-opacity-90"
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-white mb-4 md:mb-0">
              <h3 className="text-2xl font-bold mb-2">Explorez ensemble !</h3>
              <p className="max-w-lg">Un outil ludique pour découvrir le monde qui vous entoure grâce à la technologie IA.</p>
            </div>
            <div className="flex space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PhotoDetection;