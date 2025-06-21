import React, { useState, useEffect, useRef } from 'react';

const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  
// Mappage phonétique des lettres pour une meilleure prononciation en français
const letterPronunciations = {
  'A': 'ah',
  'B': 'bé',
  'C': 'cé',
  'D': 'dé',
  'E': 'euh',
  'F': 'èf',
  'G': 'gé',
  'H': 'ash',
  'I': 'i',
  'J': 'ji',
  'K': 'ka',
  'L': 'èl',
  'M': 'èm',
  'N': 'èn',
  'O': 'o',
  'P': 'pé',
  'Q': 'ku',
  'R': 'èr',
  'S': 'èss',
  'T': 'té',
  'U': 'u',
  'V': 'vé',
  'W': 'doobluh vé',
  'X': 'eeks',
  'Y': 'i grèk',
  'Z': 'zèd'
};

// Exemples de mots pour chaque lettre
const letterExamples = {
  'A': 'comme Avion',
  'B': 'comme Ballon',
  'C': 'comme Chat',
  'D': 'comme Dino',
  'E': 'comme Éléphant',
  'F': 'comme Fleur',
  'G': 'comme Gâteau',
  'H': 'comme Hélicoptère',
  'I': 'comme Igloo',
  'J': 'comme Jouet',
  'K': 'comme Koala',
  'L': 'comme Lapin',
  'M': 'comme Maison',
  'N': 'comme Nounours',
  'O': 'comme Oiseau',
  'P': 'comme Pomme',
  'Q': 'comme Quille',
  'R': 'comme Robot',
  'S': 'comme Soleil',
  'T': 'comme Train',
  'U': 'comme Univers',
  'V': 'comme Voiture',
  'W': 'comme Wagon',
  'X': 'comme Xylophone',
  'Y': 'comme Yoyo',
  'Z': 'comme Zèbre'
};

// Configuration par défaut
const featureConfig = {
  letterLearning: {
    voiceAssistant: {
      enabled: true,
      preferredLanguage: 'fr-FR',
      speechRate: 0.9,
      autoSpeakNewLetter: false
    },
    gestureRecognition: {
      enabled: true,
      minTracePoints: 15
    },
    camera: {
      width: 320,
      height: 240,
      autoStart: false
    }
  }
};

// Animated background elements
const FloatingLetters = () => {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {letters.map((letter, index) => (
        <div
          key={index}
          className="absolute text-6xl font-bold text-blue-100 opacity-20 animate-pulse"
          style={{
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            animationDelay: index * 0.5 + 's',
            transform: 'rotate(' + Math.random() * 360 + 'deg)'
          }}
        >
          {letter}
        </div>
      ))}
    </div>
  );
};

const LetterLearning = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentLetter, setCurrentLetter] = useState(alphabet[0]);
  const [assistantMessage, setAssistantMessage] = useState("Bonjour ! Cliquez sur 'Dire la Lettre' ou tracez avec votre doigt !");
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Voice assistant states
  const [voices, setVoices] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Gesture recognition states
  const [isDetecting, setIsDetecting] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPath, setDrawingPath] = useState([]);
  const [drawingStrokes, setDrawingStrokes] = useState([]);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Configuration
  const { voiceAssistant, gestureRecognition, camera } = featureConfig.letterLearning;

  // Load available voices
  useEffect(() => {
    if (!voiceAssistant.enabled) return;
    
    const loadVoices = () => {
      try {
        const availableVoices = window.speechSynthesis.getVoices();
        console.log('Voix disponibles:', availableVoices.length);
        
        const frenchVoices = availableVoices.filter(voice => 
          voice.lang.includes('fr') || voice.lang.includes('FR')
        );
        
        setVoices(frenchVoices.length > 0 ? frenchVoices : availableVoices);
        console.log('Voix françaises trouvées:', frenchVoices.length);
      } catch (error) {
        console.error('Erreur lors du chargement des voix:', error);
      }
    };
    
    if (!window.speechSynthesis) {
      console.error('Synthèse vocale non supportée');
      setAssistantMessage("Votre navigateur ne supporte pas la synthèse vocale.");
      return;
    }
    
    // Initialiser la synthèse vocale
    try {
      if (window.speechSynthesis.cancel) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {
      console.warn('Erreur d\'initialisation:', e);
    }
    
    loadVoices();
    
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  
  // Update current letter when index changes
  useEffect(() => {
    setCurrentLetter(alphabet[currentIndex]);
    setDrawingPath([]); // Reset drawing path
    setDrawingStrokes([]); // Reset drawing strokes
    
    if (voiceAssistant.autoSpeakNewLetter) {
      setTimeout(() => handleSayLetter(alphabet[currentIndex], true), 500);
    }
  }, [currentIndex]);

  const handleNextLetter = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % alphabet.length);
  };

  const handlePreviousLetter = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + alphabet.length) % alphabet.length);
  };

  // Function to convert letter to its phonetic pronunciation with example
  const getLetterPhoneticPronunciation = (letter) => {
    return {
      pronunciation: letterPronunciations[letter.toUpperCase()] || letter,
      example: letterExamples[letter.toUpperCase()] || ''
    };
  };

  // Handle text-to-speech for letters with improved pronunciation and examples
  const handleSayLetter = (text, autoSpeak = false) => {
    if (!voiceAssistant.enabled) {
      console.log('Assistant vocal désactivé');
      return;
    }
    
    setIsSpeaking(true);
    
    // Interrupt any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    let speechText = text;
    
    // Check if the text is a single letter
    if (text.length === 1 && alphabet.includes(text.toUpperCase())) {
      const { pronunciation, example } = getLetterPhoneticPronunciation(text);
      const message = `La lettre est ${text}. Elle se prononce ${pronunciation}. ${example}.`;
      speechText = message;
      setAssistantMessage(message);
    } else {
      setAssistantMessage(text);
    }
    
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.8; // Encore plus lent pour meilleure clarté pour les enfants
    
    // Get available voices and select a French voice if available
    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find(voice => voice.lang.includes('fr'));
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }
    
    utterance.onend = () => {
      console.log('Fin de la synthèse vocale');
      setIsSpeaking(false);
    };
    
    utterance.onerror = (event) => {
      console.error('Erreur synthèse vocale:', event);
      setIsSpeaking(false);
      setAssistantMessage("Erreur avec l'assistant vocal.");
    };
    
    try {
      window.speechSynthesis.speak(utterance);
      console.log(`Assistant vocal: ${text}`);
    } catch (error) {
      console.error('Erreur:', error);
      setIsSpeaking(false);
      setAssistantMessage("Erreur de synthèse vocale.");
    }
  };
  
  // Toggle drawing mode
  const toggleDrawingMode = () => {
    setIsDetecting(!isDetecting);
    setDrawingPath([]);
    if (!isDetecting) {
      setAssistantMessage("Mode tracé désactivé.");
    } else {
      setAssistantMessage(`Tracez la lettre ${currentLetter} avec votre souris ou votre doigt !`);
    }
  };
  
  // Get mouse/touch coordinates relative to canvas
  const getCanvasCoordinates = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };
  
  // Mouse events for drawing
  const handleCanvasMouseDown = (e) => {
    e.preventDefault();
    if (!isDetecting) return;
    
    const coords = getCanvasCoordinates(e, canvasRef.current);
    setIsDrawing(true);
    setDrawingPath([coords]);
  };
  
  const handleCanvasMouseMove = (e) => {
    e.preventDefault();
    if (!isDetecting || !isDrawing) return;
    
    const coords = getCanvasCoordinates(e, canvasRef.current);
    setDrawingPath(prev => [...prev, coords]);
  };
  
  const handleCanvasMouseUp = (e) => {
    e.preventDefault();
    if (!isDetecting || !isDrawing) return;
    
    setIsDrawing(false);
    
    if (drawingPath.length >= gestureRecognition.minTracePoints) {
      // Analyze the drawn path
      const detectedLetter = analyzeDrawnPath(drawingPath, currentLetter);
      
      if (detectedLetter === currentLetter) {
        setShowCelebration(true);
        setAssistantMessage(`Excellent ! Vous avez tracé la lettre ${currentLetter} !`);
        if (voiceAssistant.enabled) {
          handleSayLetter(`Bravo ! Vous avez réussi la lettre ${currentLetter} !`);
        }
        
        setTimeout(() => {
          setShowCelebration(false);
          handleNextLetter();
        }, 3000);
      } else {
        setAssistantMessage(`Essayez encore de tracer la lettre ${currentLetter}. Points tracés: ${drawingPath.length}`);
      }
    } else {
      setAssistantMessage(`Tracé trop court. Essayez de tracer la lettre ${currentLetter} plus lentement.`);
    }
  };
  
  // Touch events for mobile
  const handleCanvasTouchStart = (e) => {
    handleCanvasMouseDown(e);
  };
  
  const handleCanvasTouchMove = (e) => {
    handleCanvasMouseMove(e);
  };
  
  const handleCanvasTouchEnd = (e) => {
    handleCanvasMouseUp(e);
  };
  
  // Draw the canvas content
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f0f9ff');
    gradient.addColorStop(1, '#e0e7ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw animated grid
    const time = Date.now() * 0.001;
    ctx.strokeStyle = `rgba(147, 197, 253, ${0.3 + 0.1 * Math.sin(time)})`;
    ctx.lineWidth = 1;
    const gridSize = 25;
    
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Draw instructions with glassmorphism effect
    if (isDetecting) {
      // Glassmorphism background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(0, 0, canvas.width, 50);
      
      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width, 50);
      
      // Text with shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.font = 'bold 18px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Tracez la lettre ${currentLetter}`, canvas.width / 2 + 1, 31);
      
      ctx.fillStyle = 'rgba(30, 64, 175, 0.9)';
      ctx.fillText(`Tracez la lettre ${currentLetter}`, canvas.width / 2, 30);
    } else {
      // Overlay for inactive state
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Pulsing effect
      const pulse = 0.8 + 0.2 * Math.sin(time * 2);
      ctx.fillStyle = `rgba(59, 130, 246, ${pulse})`;
      ctx.font = 'bold 20px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Cliquez sur "Activer le Tracé"', canvas.width / 2, canvas.height / 2 - 15);
      ctx.font = '16px Inter, Arial';
      ctx.fillText('pour commencer l\'aventure !', canvas.width / 2, canvas.height / 2 + 15);
      
      // Add sparkle effect
      for (let i = 0; i < 5; i++) {
        const sparkleX = canvas.width / 2 + Math.cos(time + i) * 80;
        const sparkleY = canvas.height / 2 + Math.sin(time + i) * 40;
        ctx.fillStyle = `rgba(251, 191, 36, ${0.5 + 0.5 * Math.sin(time * 3 + i)})`;
        ctx.beginPath();
        ctx.arc(sparkleX, sparkleY, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    
    // Draw current path with glow effect
    if (drawingPath.length > 1) {
      // Glow effect
      ctx.shadowColor = isDrawing ? '#3b82f6' : '#10b981';
      ctx.shadowBlur = 10;
      
      ctx.strokeStyle = isDrawing ? '#3b82f6' : '#10b981';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(drawingPath[0].x, drawingPath[0].y);
      
      for (let i = 1; i < drawingPath.length; i++) {
        ctx.lineTo(drawingPath[i].x, drawingPath[i].y);
      }
      
      ctx.stroke();
      
      // Reset shadow
      ctx.shadowBlur = 0;
      
      // Draw start point with animation
      const startPulse = 1 + 0.3 * Math.sin(time * 4);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(drawingPath[0].x, drawingPath[0].y, 6 * startPulse, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw end point
      if (drawingPath.length > 1) {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        const lastPoint = drawingPath[drawingPath.length - 1];
        ctx.arc(lastPoint.x, lastPoint.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }, [drawingPath, isDetecting, currentLetter, isDrawing]);
  
  // Clear drawing path
  const clearDrawing = () => {
    setDrawingPath([]);
    setIsDrawing(false);
  };
  
  // Analyze drawn path to detect letters
  const analyzeDrawnPath = (path, expectedLetter) => {
    if (!path || path.length < gestureRecognition.minTracePoints) return null;
    
    // Calculate bounding box
    const xs = path.map(p => p.x);
    const ys = path.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Normalize path to 0-1 coordinates
    const normalizedPath = path.map(p => ({
      x: width > 0 ? (p.x - minX) / width : 0.5,
      y: height > 0 ? (p.y - minY) / height : 0.5
    }));
    
    console.log(`Analyzing letter ${expectedLetter}, path length: ${path.length}`);
    
    // Simple pattern matching based on letter characteristics
    switch(expectedLetter) {
      case 'A':
        return detectLetterA(normalizedPath) ? 'A' : null;
      case 'B':
        return detectLetterB(normalizedPath) ? 'B' : null;
      case 'C':
        return detectLetterC(normalizedPath) ? 'C' : null;
      case 'O':
        return detectLetterO(normalizedPath) ? 'O' : null;
      case 'L':
        return detectLetterL(normalizedPath) ? 'L' : null;
      case 'I':
        return detectLetterI(normalizedPath) ? 'I' : null;
      default:
        return detectGenericLetter(normalizedPath, expectedLetter);
    }
  };
  
  // Letter detection functions
  const detectLetterA = (path) => {
    let hasUpward = false;
    let hasDownward = false;
    
    for (let i = 1; i < path.length; i++) {
      const dy = path[i].y - path[i-1].y;
      if (dy < -0.1) hasUpward = true;
      if (dy > 0.1 && hasUpward) hasDownward = true;
    }
    
    return hasUpward && hasDownward;
  };
  
  const detectLetterB = (path) => {
    let hasVertical = false;
    let hasCurves = false;
    
    for (let i = 5; i < path.length; i++) {
      const dy = Math.abs(path[i].y - path[i-5].y);
      const dx = Math.abs(path[i].x - path[i-5].x);
      
      if (dy > 0.3 && dx < 0.2) hasVertical = true;
      if (dx > 0.3) hasCurves = true;
    }
    
    return hasVertical && hasCurves;
  };
  
  const detectLetterC = (path) => {
    const startPoint = path[0];
    const endPoint = path[path.length - 1];
    const distance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + 
      Math.pow(endPoint.y - startPoint.y, 2)
    );
    
    return distance > 0.3 && path.length > 10;
  };
  
  const detectLetterO = (path) => {
    const startPoint = path[0];
    const endPoint = path[path.length - 1];
    const distance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + 
      Math.pow(endPoint.y - startPoint.y, 2)
    );
    
    return distance < 0.2 && path.length > 15;
  };
  
  const detectLetterL = (path) => {
    let hasVertical = false;
    let hasHorizontal = false;
    
    for (let i = 5; i < path.length; i++) {
      const dy = Math.abs(path[i].y - path[i-5].y);
      const dx = Math.abs(path[i].x - path[i-5].x);
      
      if (dy > 0.3 && dx < 0.2) hasVertical = true;
      if (dx > 0.3 && dy < 0.2 && path[i].y > 0.7) hasHorizontal = true;
    }
    
    return hasVertical && hasHorizontal;
  };
  
  const detectLetterI = (path) => {
    let verticalMovement = 0;
    
    for (let i = 1; i < path.length; i++) {
      verticalMovement += Math.abs(path[i].y - path[i-1].y);
    }
    
    return verticalMovement > 0.5;
  };
  
  const detectGenericLetter = (path, expectedLetter) => {
    if (path.length < 10) return null;
    
    let directionChanges = 0;
    for (let i = 2; i < path.length; i++) {
      const dx1 = path[i-1].x - path[i-2].x;
      const dy1 = path[i-1].y - path[i-2].y;
      const dx2 = path[i].x - path[i-1].x;
      const dy2 = path[i].y - path[i-1].y;
      
      const dot = dx1 * dx2 + dy1 * dy2;
      const mag1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const mag2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      
      if (mag1 > 0.01 && mag2 > 0.01) {
        const cosAngle = dot / (mag1 * mag2);
        if (cosAngle < 0.8) directionChanges++;
      }
    }
    
    return (directionChanges >= 2 && Math.random() > 0.2) ? expectedLetter : null;
  };

  // Celebration animation component
  const CelebrationOverlay = () => (
    <div className={`fixed inset-0 pointer-events-none z-50 transition-opacity duration-500 ${showCelebration ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 opacity-20 animate-pulse"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-8xl animate-bounce">🎉</div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="text-4xl font-bold text-white text-center bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent animate-pulse">
            BRAVO !
          </div>
        </div>
      </div>
      {/* Confetti effect */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-4 h-4 bg-yellow-400 animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${1 + Math.random()}s`
          }}
        ></div>
      ))}
    </div>
  );

  // Friend character speech bubble component
  const FriendSpeechBubble = ({ message }) => {
    // Alternate between left and right position based on current letter index
    const isRightSide = currentIndex % 2 === 0;
    
    // Use a variety of friendly animal characters
    const characters = [
      { emoji: "🦊", name: "Russel", color: "orange" },
      { emoji: "🐼", name: "Bambou", color: "blue" },
      { emoji: "🐰", name: "Pompom", color: "pink" },
      { emoji: "🐨", name: "Koko", color: "gray" },
      { emoji: "🦁", name: "Leo", color: "yellow" },
      { emoji: "🐵", name: "Momo", color: "brown" }
    ];
    
    // Select character based on current letter to maintain consistency
    const characterIndex = currentIndex % characters.length;
    const character = characters[characterIndex];
    
    // Animation style for character based on side
    const [isWaving, setIsWaving] = useState(false);
    
    useEffect(() => {
      // Wave animation when message changes
      setIsWaving(true);
      const timer = setTimeout(() => setIsWaving(false), 2000);
      return () => clearTimeout(timer);
    }, [message]);
    
    // Generate bubble color based on character
    const getBubbleStyle = () => {
      const colorMap = {
        orange: "bg-orange-100 border-orange-300",
        blue: "bg-blue-100 border-blue-300",
        pink: "bg-pink-100 border-pink-300",
        gray: "bg-gray-100 border-gray-300",
        yellow: "bg-yellow-100 border-yellow-300",
        brown: "bg-amber-100 border-amber-300"
      };
      
      return colorMap[character.color] || "bg-blue-100 border-blue-300";
    };
    
    return (
      <div className={`fixed bottom-24 ${isRightSide ? 'right-8' : 'left-8'} transition-all duration-500 z-40`}>
        {/* Character */}
        <div 
          className={`text-5xl absolute ${isRightSide ? '-left-14' : '-right-14'} bottom-0 cursor-pointer transform transition-all`}
          style={{
            animation: isWaving ? `${isRightSide ? 'waveRight' : 'waveLeft'} 0.5s ease-in-out infinite` : 'bounce 2s infinite',
            transformOrigin: isRightSide ? 'bottom right' : 'bottom left'
          }}
          onClick={() => handleSayLetter(`La lettre est ${currentLetter}`)}
        >
          {character.emoji}
        </div>
        
        {/* Speech bubble */}
        <div 
          className={`relative max-w-xs p-4 rounded-2xl ${isRightSide ? 'rounded-tr-none' : 'rounded-tl-none'} 
                     shadow-lg border-2 ${getBubbleStyle()} transform transition-all duration-300`}
          style={{
            animation: 'popIn 0.3s ease-out forwards'
          }}
        >
          <div className="font-bold mb-1 text-sm text-opacity-80 flex items-center">
            <span className="mr-1">{character.emoji} {character.name}</span>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-ping ml-1"></div>
          </div>
          <p className="text-gray-800 text-sm md:text-base">{message}</p>
          
          {/* Speech bubble tail */}
          <div 
            className={`absolute ${isRightSide ? 'top-0 -right-3' : 'top-0 -left-3'} w-4 h-4 
                      ${isRightSide ? 'border-t-2 border-r-2' : 'border-t-2 border-l-2'}
                      ${isRightSide ? getBubbleStyle() : getBubbleStyle()}`}
            style={{ 
              transform: isRightSide ? 'skewX(-45deg)' : 'skewX(45deg)',
              background: 'inherit'
            }}
          >
          </div>
        </div>
      </div>
    );
  };

  // Add custom animations to the global style
  useEffect(() => {
    // Add animations to document head
    const style = document.createElement('style');
    style.textContent = `
      @keyframes waveRight {
        0% { transform: rotate(0deg); }
        50% { transform: rotate(15deg); }
        100% { transform: rotate(0deg); }
      }
      
      @keyframes waveLeft {
        0% { transform: rotate(0deg); }
        50% { transform: rotate(-15deg); }
        100% { transform: rotate(0deg); }
      }
      
      @keyframes popIn {
        0% { transform: scale(0.8); opacity: 0; }
        70% { transform: scale(1.05); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
      
      .animate-pulse-subtle {
        animation: pulse 3s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-600 overflow-hidden">
      <FloatingLetters />
      <CelebrationOverlay />
      
      <div className="relative z-10 p-6 flex flex-col items-center min-h-screen">
        {/* Modern Animated Header */}
<div className="text-center mb-12 relative overflow-visible">
  {/* Glowing background effect */}
  <div className="absolute -inset-3 bg-gradient-to-r from-yellow-400/20 via-pink-500/20 to-purple-500/20 rounded-xl blur-xl opacity-75 animate-pulse-slow -z-10"></div>
  
  {/* Main header content */}
  <div className="relative">
    <h1 className="text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-4 animate-gradient bg-300%">
      🔤 Apprenons les Lettres ! 🔤
    </h1>
    
    {/* Animated underline */}
    <div className="relative w-48 h-2 mx-auto">
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full animate-underline"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-yellow-300 rounded-full animate-underline-reverse opacity-70"></div>
    </div>
  </div>
</div>

        {/* Friend speech bubble */}
        {assistantMessage && <FriendSpeechBubble message={assistantMessage} />}
        
        {/* Letter Display Area with glassmorphism */}
        <div className="backdrop-blur-lg bg-white/10 p-12 rounded-3xl shadow-2xl mb-8 w-full max-w-md flex flex-col items-center border border-white/20 hover:bg-white/20 transition-all duration-300">
          <div className="text-9xl font-black bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-6 animate-pulse hover:scale-110 transition-transform duration-300">
            {currentLetter}
          </div>
          <button
            onClick={() => handleSayLetter()}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-2xl text-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 hover:scale-105 transform active:scale-95"
            disabled={isSpeaking}
          >
            <span className="flex items-center gap-2">
              {isSpeaking ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  En cours...
                </>
              ) : (
                <>
                  🔊 Dire la Lettre
                </>
              )}
            </span>
          </button>
        </div>

        {/* Navigation with enhanced design */}
        <div className="flex justify-between items-center w-full max-w-lg mb-8 backdrop-blur-lg bg-white/10 p-4 rounded-2xl border border-white/20">
          <button
            onClick={handlePreviousLetter}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform active:scale-95"
          >
            ⬅ Précédent
          </button>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-white mb-1">{currentIndex + 1} / {alphabet.length}</span>
            <div className="w-24 h-2 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / alphabet.length) * 100}%` }}
              ></div>
            </div>
          </div>
          <button
            onClick={handleNextLetter}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform active:scale-95"
          >
            Suivant ➡
          </button>
        </div>

        {/* Assistant Message with modern styling */}
        <div className="backdrop-blur-lg bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border-l-4 border-yellow-400 p-6 mb-8 w-full max-w-2xl rounded-2xl border border-yellow-400/30">
          <p className="text-white text-center font-medium text-lg">
            {assistantMessage}
          </p>
        </div>

        {/* Drawing Area with enhanced visuals */}
        <div className="backdrop-blur-lg bg-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-2xl border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-6 text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            🎯 Zone de Traçage Magique 🎯
          </h2>
          
          <div className="relative mb-6">
            <canvas
              ref={canvasRef}
              className="w-full border-2 border-white/30 rounded-2xl cursor-crosshair hover:border-white/50 transition-all duration-300 shadow-lg"
              width={500}
              height={400}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onTouchStart={handleCanvasTouchStart}
              onTouchMove={handleCanvasTouchMove}
              onTouchEnd={handleCanvasTouchEnd}
              style={{ touchAction: 'none' }}
            />
          </div>
          
          <div className="flex justify-center space-x-4 mb-4">
            <button
              onClick={toggleDrawingMode}
              className={`${
                isDetecting 
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
              } text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform active:scale-95`}
            >
              {isDetecting ? '⏹ Désactiver Tracé' : '▶ Activer Tracé'}
            </button>
            
            {isDetecting && (
              <button
                onClick={clearDrawing}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform active:scale-95"
              >
                🧹 Effacer
              </button>
            )}
          </div>
          
          {isDetecting && (
            <div className="mt-6 text-center">
              <p className="text-white text-lg mb-2">
                Tracez la lettre <strong className="text-3xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{currentLetter}</strong> avec votre souris ou votre doigt
              </p>
              <p className="text-white/70 text-sm mb-4">
                Points tracés: <span className="font-bold">{drawingPath.length}</span> | État: <span className="font-bold">{isDrawing ? 'En cours de tracé' : 'Arrêté'}</span>
              </p>
              <div className="flex justify-center space-x-6">
                <span className="text-sm text-red-400 flex items-center">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                  Point de départ
                </span>
                <span className="text-sm text-blue-400 flex items-center">
                  <div className="w-8 h-1 bg-blue-400 rounded mr-2"></div>
                  Tracé
                </span>
                <span className="text-sm text-green-400 flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                  Point d'arrivée
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Instructions with modern design */}
        <div className="mt-8 backdrop-blur-lg bg-blue-500/20 p-8 rounded-3xl w-full max-w-3xl border border-blue-400/30">
          <h3 className="text-2xl font-bold text-white mb-6 text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            📋 Guide d'Utilisation
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-bold">1</div>
                <p className="text-white">Cliquez sur "Dire la Lettre" pour entendre la prononciation</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold">2</div>
                <p className="text-white">Activez le mode tracé et dessinez la lettre avec votre souris ou votre doigt</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">3</div>
                <p className="text-white">Le tracé apparaîtra en temps réel avec des effets visuels</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold">4</div>
                <p className="text-white">L'application reconnaîtra automatiquement vos tracés et vous félicitera !</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LetterLearning;
