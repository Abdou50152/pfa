import React, { useRef, useState, useEffect } from "react";

const ObjectSorting = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detectedColor, setDetectedColor] = useState(null);
  const [detectedShape, setDetectedShape] = useState(null);
  const [bins, setBins] = useState({});
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

  // Camera setup
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "environment" 
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraOn(true);
          setError(null);
        }
      } catch (err) {
        console.error("Camera error:", err);
        setError(`Erreur caméra: ${err.message}`);
        setIsCameraOn(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const detectObject = () => {
    if (!videoRef.current || !canvasRef.current || isDetecting) return;
    
    setIsDetecting(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Analyze center area (100x100px)
      const centerX = canvas.width / 2 - 50;
      const centerY = canvas.height / 2 - 50;
      const imageData = context.getImageData(centerX, centerY, 100, 100);
      const { data } = imageData;

      let r = 0, g = 0, b = 0;
      let brightness = 0;

      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
      }

      const pixelCount = data.length / 4;
      r = Math.round(r / pixelCount);
      g = Math.round(g / pixelCount);
      b = Math.round(b / pixelCount);
      const avgBrightness = brightness / pixelCount;

      const color = getColorNameFromRGB(r, g, b);
      const shape = estimateShape(avgBrightness);

      setDetectedColor(color);
      setDetectedShape(shape);
      
      // Add to scan history
      const newScan = { 
        color, 
        shape, 
        rgb: [r, g, b], 
        timestamp: new Date().toLocaleTimeString() 
      };
      setScanHistory(prev => [newScan, ...prev].slice(0, 10));

      // Update bins
      const key = `${color} - ${shape}`;
      setBins(prev => ({
        ...prev,
        [key]: (prev[key] || 0) + 1,
      }));

      // Speak result
      speak(`${color.replace(/[🔴🟢🔵🟡⚪⚫🔍]/g, '')}, ${shape.replace(/[⚪⬛]/g, '')}`);

    } catch (err) {
      console.error("Detection error:", err);
      setError(`Erreur de détection: ${err.message}`);
    } finally {
      setIsDetecting(false);
    }
  };

  const getColorNameFromRGB = (r, g, b) => {
    // More precise color detection with thresholds
    const colorMap = [
      { threshold: (r, g, b) => r > 200 && g < 100 && b < 100, emoji: "🔴", name: "Rouge" },
      { threshold: (r, g, b) => r < 100 && g > 200 && b < 100, emoji: "🟢", name: "Vert" },
      { threshold: (r, g, b) => r < 100 && g < 100 && b > 200, emoji: "🔵", name: "Bleu" },
      { threshold: (r, g, b) => r > 220 && g > 220 && b < 150, emoji: "🟡", name: "Jaune" },
      { threshold: (r, g, b) => r > 200 && g > 200 && b > 200, emoji: "⚪", name: "Blanc" },
      { threshold: (r, g, b) => r < 50 && g < 50 && b < 50, emoji: "⚫", name: "Noir" },
      { threshold: (r, g, b) => r > 200 && g < 150 && b < 150, emoji: "❤️", name: "Rose" },
      { threshold: (r, g, b) => r < 150 && g > 150 && b > 200, emoji: "💙", name: "Bleu clair" }
    ];

    const detected = colorMap.find(color => color.threshold(r, g, b));
    return detected ? `${detected.emoji} ${detected.name}` : "🔍 Inconnu";
  };

  const estimateShape = (avgBrightness) => {
    // More sophisticated shape estimation could be added here
    return avgBrightness > 180 ? "⚪ Rond" : "⬛ Carré";
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "fr-FR";
      synth.speak(utter);
    }
  };

  const clearBins = () => {
    setBins({});
    setScanHistory([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            🧠 Tri Intelligent d'Objets
          </h1>
          <p className="text-lg text-indigo-100">
            Scanner des objets par couleur et forme
          </p>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Camera Section */}
          <div className="mb-8">
            <div className="relative w-full aspect-video bg-gray-900 rounded-xl shadow-lg overflow-hidden mb-4">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className={`w-full h-full object-cover transition-opacity ${isCameraOn ? 'opacity-100' : 'opacity-0'}`}
              />
              
              {/* Camera overlay */}
              {isCameraOn && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-white border-dashed rounded-lg w-40 h-40 md:w-48 md:h-48 opacity-70"></div>
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 text-center text-white bg-black bg-opacity-50 py-1">
                    Placez l'objet dans le cadre
                  </div>
                </>
              )}
              
              {!isCameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400">
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p>Camera {error ? 'non disponible' : 'en chargement...'}</p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
                <p>{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={detectObject}
                disabled={!isCameraOn || isDetecting}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium shadow-md transition-all ${
                  !isCameraOn || isDetecting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-95 text-white'
                }`}
              >
                {isDetecting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Détection en cours...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Scanner l'objet
                  </>
                )}
              </button>

              <button
                onClick={clearBins}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium shadow-md transition-all hover:shadow-lg active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Detection Results */}
          {(detectedColor || detectedShape) && (
            <div className="mb-8 bg-blue-50 rounded-xl p-6 shadow-inner border border-blue-100">
              <h2 className="text-2xl font-bold text-center mb-4 text-blue-800">🔍 Résultat de la Détection</h2>
              
              <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md text-center min-w-[200px]">
                  <div className="text-5xl mb-2">
                    {detectedColor?.split(' ')[0] || '❓'}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700">Couleur</h3>
                  <p className="text-lg mt-1">{detectedColor?.replace(/[^a-zA-Z ]/g, '') || 'Inconnue'}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md text-center min-w-[200px]">
                  <div className="text-5xl mb-2">
                    {detectedShape?.split(' ')[0] || '❓'}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700">Forme</h3>
                  <p className="text-lg mt-1">{detectedShape?.replace(/[^a-zA-Z ]/g, '') || 'Inconnue'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Historique des Scans
              </h2>
              <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heure</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Couleur</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forme</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RGB</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scanHistory.map((scan, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{scan.timestamp}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{scan.color}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{scan.shape}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {scan.rgb.join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bins Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Conteneurs d'Objets
              </h2>
              <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                Total: {Object.values(bins).reduce((a, b) => a + b, 0)} objets
              </span>
            </div>

            {Object.keys(bins).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(bins).map(([key, count]) => (
                  <div key={key} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-800">
                          {key.split(' - ')[0]} {key.split(' - ')[1]}
                        </h3>
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                          {count}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm text-gray-500">Type: {key.split(' - ')[1].replace(/[^a-zA-Z ]/g, '')}</span>
                        <button 
                          className="text-xs text-blue-600 hover:text-blue-800"
                          onClick={() => speak(key.replace(/[^a-zA-Z ,-]/g, ''))}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.728" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-700">Aucun objet trié</h3>
                <p className="mt-1 text-gray-500">Scannez des objets pour les voir apparaître ici</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObjectSorting;