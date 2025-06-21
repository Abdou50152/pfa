import React, { useState, useEffect } from "react";

// FileUpload component
const FileUpload = ({ onFileSelect }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      onFileSelect(file);
    } else {
      alert('Veuillez sélectionner un fichier image');
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="text-center">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
          dragActive 
            ? 'border-purple-500 bg-purple-50' 
            : 'border-purple-300 hover:border-purple-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <div className="text-6xl">📷</div>
          <div>
            <p className="text-xl font-semibold text-purple-700 mb-2">
              Prenez ou glissez une photo de la chambre
            </p>
            <p className="text-gray-600">
              Formats acceptés: JPG, PNG, WEBP
            </p>
          </div>
          
          {selectedFile && (
            <div className="mt-4 p-4 bg-purple-100 rounded-lg">
              <p className="text-purple-800 font-medium">
                📁 {selectedFile.name}
              </p>
              <p className="text-purple-600 text-sm">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ParentHome = () => {
  const [backendMessage, setBackendMessage] = useState("Système d'analyse d'images activé et prêt ! ");
  const [uploadResponse, setUploadResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Utilise l'API backend pour détecter les objets dans l'image
  const detectObjects = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://127.0.0.1:8000/available_classes/', {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des classes: ${response.status}`);
      }
      
      const classes = await response.json();
      console.log("Classes disponibles:", classes);
      
      return classes.classes;
    } catch (error) {
      console.error("Erreur lors de la détection:", error);
      throw error;
    }
  };

  const handleFileSelected = async (file) => {
    try {
      setIsLoading(true);
      setBackendMessage("Analyse de l'image en cours...");
      
      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Appeler l'API pour envoyer l'image comme référence
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch('http://127.0.0.1:8000/chambre/upload_reference/', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Erreur lors de l'upload: ${uploadResponse.status}`);
      }
      
      const uploadData = await uploadResponse.json();
      console.log("Upload response:", uploadData);
      
      // Analyser les objets détectés
      const objects = {};
      if (uploadData.objects && Array.isArray(uploadData.objects)) {
        uploadData.objects.forEach(obj => {
          const name = obj.name;
          if (!objects[name]) {
            objects[name] = 1;
          } else {
            objects[name]++;
          }
        });
      }
      
      setUploadResponse({
        message: uploadData.message || "Image de référence enregistrée avec succès!",
        filename: uploadData.filename || file.name,
        objects: objects
      });
      
      setBackendMessage("Image analysée avec succès! ");
    } catch (error) {
      console.error("Erreur lors du traitement de l'image:", error);
      setBackendMessage(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate organization tips based on detected objects
  const generateTips = (objects) => {
    if (!objects) return [];
    
    const tips = [];
    
    if (objects.livres > 5) {
      tips.push({
        icon: "",
        title: "Bibliothèque organisée",
        tip: "Créez une petite bibliothèque avec des livres classés par taille ou par thème."
      });
    }
    
    if (objects.legos > 0) {
      tips.push({
        icon: "",
        title: "Station LEGO",
        tip: "Utilisez des bacs transparents pour trier les LEGO par couleur ou par taille."
      });
    }
    
    if (objects.peluches > 3) {
      tips.push({
        icon: "",
        title: "Coin câlin",
        tip: "Créez un espace douillet avec un panier en osier pour les peluches."
      });
    }
    
    if (objects.crayons > 8) {
      tips.push({
        icon: "",
        title: "Atelier créatif",
        tip: "Organisez les fournitures d'art dans des pots ou des boîtes étiquetées."
      });
    }

    return tips;
  };

  useEffect(() => {
    // Simulate connection check
    setBackendMessage("Système d'analyse d'images activé et prêt ! ");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 relative overflow-hidden">
      {/* Playful floating toys */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-16 text-6xl animate-bounce opacity-20 transform rotate-12">🧸</div>
        <div className="absolute top-32 right-24 text-5xl animate-pulse opacity-20 transform -rotate-12">🎨</div>
        <div className="absolute bottom-40 left-12 text-4xl animate-bounce opacity-20 transform rotate-45" style={{animationDelay: '1s'}}>🚗</div>
        <div className="absolute bottom-20 right-20 text-5xl animate-pulse opacity-20 transform -rotate-6" style={{animationDelay: '2s'}}>🎭</div>
        <div className="absolute top-1/2 left-8 text-3xl animate-bounce opacity-20" style={{animationDelay: '0.5s'}}>🎲</div>
        <div className="absolute top-1/3 right-12 text-4xl animate-pulse opacity-20" style={{animationDelay: '1.5s'}}>🪀</div>
      </div>

      <div className="relative z-10 p-8 max-w-6xl mx-auto">
        {/* Warm family header */}
        <div className="text-center mb-12">
          <div className="inline-block relative group">
            <h1 className="text-5xl md:text-7xl font-black mb-6 relative">
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">
                👩‍👧‍👦 Maman Assistante
              </span>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 rounded-full"></div>
            </h1>
          </div>
          
          <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Votre compagnon intelligent pour organiser la chambre des enfants et créer un environnement d'apprentissage harmonieux 💫
          </p>
        </div>

        {/* Connection status with family warmth */}
        {backendMessage && (
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm border-2 border-indigo-200 rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="relative">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-indigo-700 font-semibold">Connexion au système</span>
              </div>
              <p className="text-gray-700">{backendMessage}</p>
            </div>
          </div>
        )}

        {/* Main toy organization section */}
        <div className="relative">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-purple-200 p-8 relative overflow-hidden">
            
            {/* Decorative corner elements */}
            <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-pink-200 to-transparent rounded-br-full opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-indigo-200 to-transparent rounded-tl-full opacity-50"></div>
            
            {/* Header with playful icon */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-3xl mb-6 shadow-lg transform hover:rotate-6 transition-transform duration-300">
                <span className="text-4xl">🧸</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
                  Assistant d'Organisation
                </span>
              </h2>
              
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Transformez le désordre en ordre avec l'aide de notre intelligence artificielle ! 
                Prenez une photo de la chambre et recevez des conseils personnalisés pour un rangement efficace et ludique.
              </p>
            </div>

            {/* File upload section */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-dashed border-purple-300 hover:border-purple-400 transition-colors duration-300">
                <FileUpload onFileSelect={handleFileSelected} />
              </div>
            </div>

            {/* Image preview */}
            {imagePreview && (
              <div className="mb-8">
                <div className="bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-lg">
                  <h3 className="text-xl font-bold mb-4 text-purple-700">📷 Image analysée</h3>
                  <div className="flex justify-center">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-w-full max-h-80 rounded-xl shadow-md border border-gray-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Results display */}
            {uploadResponse && (
              <div className={`rounded-2xl shadow-lg p-6 mb-8 border-2 transition-all duration-500 ${
                uploadResponse.type === 'success' ? 'bg-green-50 border-green-300' :
                uploadResponse.type === 'error' ? 'bg-red-50 border-red-300' :
                'bg-blue-50 border-blue-300'
              }`}>
                
                <div className="flex items-center mb-4">
                  <div className={`w-6 h-6 rounded-full mr-4 flex items-center justify-center ${
                    uploadResponse.type === 'success' ? 'bg-green-500' :
                    uploadResponse.type === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`}>
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="text-white text-sm">
                        {uploadResponse.type === 'success' ? '' :
                         uploadResponse.type === 'error' ? '' : ''}
                      </span>
                    )}
                  </div>
                  <p className={`font-semibold text-lg ${
                    uploadResponse.type === 'success' ? 'text-green-800' :
                    uploadResponse.type === 'error' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>
                    {uploadResponse.message}
                  </p>
                </div>

                {!isLoading && uploadResponse.objects && (
                  <div className="mt-6">
                    <div className="mb-4">
                      <h5 className="font-semibold text-indigo-800 mb-3 flex items-center">
                        <span className="mr-2">🔍</span>
                        Objets identifiés dans la chambre
                      </h5>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {Object.entries(uploadResponse.objects).map(([name, count], index) => {
                          // Obtenir une version française du nom si disponible
                          const displayName = name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ');
                          const icon = (name.includes('livre') || name === 'book') ? '📚' : 
                                       (name.includes('peluche') || name === 'teddy bear') ? '🧸' :
                                       (name.includes('voiture') || name === 'car') ? '🚗' :
                                       (name.includes('ballon') || name === 'ball') ? '⚽' :
                                       (name.includes('puzzle')) ? '🧩' :
                                       (name.includes('poupée')) ? '👧' :
                                       '🧸';
                          
                          return (
                            <div key={index} className="bg-white/80 rounded-lg p-3 border border-indigo-100 text-center">
                              <div className="text-2xl mb-1">{icon}</div>
                              <div className="font-medium text-indigo-800">{displayName}</div>
                              <div className="text-sm text-indigo-600 font-medium">{count}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <h5 className="font-semibold text-indigo-800 mb-3 flex items-center">
                        <span className="mr-2">💡</span>
                        Conseils personnalisés pour cette chambre
                      </h5>
                      <div className="grid md:grid-cols-2 gap-4">
                        {generateTips(uploadResponse.objects).map((tip, index) => (
                          <div key={index} className="bg-white/80 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center mb-2">
                              <span className="text-2xl mr-2">{tip.icon}</span>
                              <h6 className="font-semibold text-blue-800">{tip.title}</h6>
                            </div>
                            <p className="text-blue-700 text-sm">{tip.tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tips section with family-friendly design */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-8 border-2 border-yellow-200">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl mb-4 shadow-md">
                  <span className="text-3xl">💡</span>
                </div>
                <h3 className="text-2xl font-bold text-yellow-800 mb-2">Conseils d'organisation</h3>
                <p className="text-yellow-700">Des astuces testées et approuvées par les mamans !</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/80 rounded-xl p-6 border border-yellow-200 text-center transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
                  <div className="text-4xl mb-3">🎨</div>
                  <h4 className="font-bold text-yellow-800 mb-2">Tri par catégorie</h4>
                  <p className="text-yellow-700 text-sm">LEGOs, poupées, livres... Chaque type de jouet dans sa zone dédiée pour un rangement intuitif.</p>
                </div>
                
                <div className="bg-white/80 rounded-xl p-6 border border-yellow-200 text-center transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
                  <div className="text-4xl mb-3">📦</div>
                  <h4 className="font-bold text-yellow-800 mb-2">Boîtes étiquetées</h4>
                  <p className="text-yellow-700 text-sm">Des contenants colorés avec étiquettes visuelles pour que même les plus petits s'y retrouvent.</p>
                </div>
                
                <div className="bg-white/80 rounded-xl p-6 border border-yellow-200 text-center transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
                  <div className="text-4xl mb-3">👶</div>
                  <h4 className="font-bold text-yellow-800 mb-2">Impliquer l'enfant</h4>
                  <p className="text-yellow-700 text-sm">Transformer le rangement en jeu ! L'enfant apprend l'organisation tout en s'amusant.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle floating elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute top-1/4 left-1/4 text-pink-300 text-2xl animate-pulse" style={{animationDelay: '0.5s'}}>✨</div>
          <div className="absolute top-3/4 right-1/3 text-purple-300 text-xl animate-pulse" style={{animationDelay: '1.2s'}}>🌟</div>
          <div className="absolute bottom-1/4 left-1/3 text-indigo-300 text-lg animate-pulse" style={{animationDelay: '2s'}}>💫</div>
          <div className="absolute top-1/3 right-1/4 text-pink-300 text-2xl animate-pulse" style={{animationDelay: '0.8s'}}>✨</div>
        </div>
      </div>
    </div>
  );
};

export default ParentHome;