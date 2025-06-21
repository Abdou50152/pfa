// pages/LegoSorting.jsx
import React, { useState, useEffect } from "react";
import AnimatedBackground from "../components/AnimatedBackground";

const LegoSorting = () => {
  // Enhanced Lego data for different levels
  const legoData = {
    easy: [
      { id: 1, color: "red", size: "small", type: "brick", name: "Petit Lego Rouge" },
      { id: 2, color: "blue", size: "small", type: "brick", name: "Petit Lego Bleu" },
      { id: 3, color: "yellow", size: "small", type: "brick", name: "Petit Lego Jaune" },
      { id: 4, color: "red", size: "big", type: "brick", name: "Gros Lego Rouge" },
      { id: 5, color: "blue", size: "big", type: "brick", name: "Gros Lego Bleu" },
      { id: 6, color: "yellow", size: "big", type: "brick", name: "Gros Lego Jaune" },
    ],
    medium: [
      { id: 1, color: "red", size: "small", type: "brick", name: "Petite Brique Rouge" },
      { id: 2, color: "blue", size: "medium", type: "plate", name: "Plaque Bleue Moyenne" },
      { id: 3, color: "green", size: "big", type: "brick", name: "Grosse Brique Verte" },
      { id: 4, color: "red", size: "medium", type: "plate", name: "Plaque Rouge Moyenne" },
      { id: 5, color: "yellow", size: "small", type: "brick", name: "Petite Brique Jaune" },
      { id: 6, color: "blue", size: "small", type: "plate", name: "Petite Plaque Bleue" },
      { id: 7, color: "green", size: "big", type: "plate", name: "Grosse Plaque Verte" },
      { id: 8, color: "black", size: "medium", type: "brick", name: "Brique Noire Moyenne" },
    ],
    hard: [
      { id: 1, color: "red", size: "small", type: "brick", name: "Petite Brique Rouge" },
      { id: 2, color: "blue", size: "medium", type: "plate", name: "Plaque Bleue Moyenne" },
      { id: 3, color: "green", size: "big", type: "tile", name: "Grand Cercle Vert" },
      { id: 4, color: "red", size: "medium", type: "slope", name: "Triangle Rouge" },
      { id: 5, color: "yellow", size: "small", type: "brick", name: "Petite Brique Jaune" },
      { id: 6, color: "blue", size: "small", type: "tile", name: "Petit Cercle Bleu" },
      { id: 7, color: "green", size: "big", type: "brick", name: "Grosse Brique Verte" },
      { id: 8, color: "black", size: "medium", type: "brick", name: "Brique Noire Moyenne" },
      { id: 9, color: "white", size: "small", type: "plate", name: "Petite Plaque Blanche" },
      { id: 10, color: "yellow", size: "big", type: "tile", name: "Grand Cercle Jaune" },
      { id: 11, color: "black", size: "small", type: "slope", name: "Petit Triangle Noir" },
      { id: 12, color: "white", size: "medium", type: "brick", name: "Brique Blanche Moyenne" },
    ]
  };

  const [level, setLevel] = useState("medium");
  const [legos, setLegos] = useState(legoData.medium);
  const [sortBy, setSortBy] = useState(null);
  const [sortedBoxes, setSortedBoxes] = useState({});
  const [manualSorting, setManualSorting] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [selectedMode, setSelectedMode] = useState("auto");
  const [gameStarted, setGameStarted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [perfectScore, setPerfectScore] = useState(false);
  
  // Categories for manual sorting by level
  const sortingCategories = {
    easy: [
      { 
        id: 'color', 
        name: 'Couleur', 
        options: ['red', 'blue', 'yellow'],
        emoji: '🎨',
        labels: {
          red: 'Rouge',
          blue: 'Bleu',
          yellow: 'Jaune'
        },
        helpText: "Trie les Legos par leur couleur"
      },
      { 
        id: 'size', 
        name: 'Taille', 
        options: ['small', 'big'],
        emoji: '📏',
        labels: {
          small: 'Petit',
          big: 'Grand'
        },
        helpText: "Trie les Legos par leur taille"
      }
    ],
    medium: [
      { 
        id: 'color', 
        name: 'Couleur', 
        options: ['red', 'blue', 'green', 'yellow', 'black'],
        emoji: '🎨',
        labels: {
          red: 'Rouge',
          blue: 'Bleu',
          green: 'Vert',
          yellow: 'Jaune',
          black: 'Noir'
        },
        helpText: "Trie les Legos par leur couleur"
      },
      { 
        id: 'size', 
        name: 'Taille', 
        options: ['small', 'medium', 'big'],
        emoji: '📏',
        labels: {
          small: 'Petit',
          medium: 'Moyen',
          big: 'Grand'
        },
        helpText: "Trie les Legos par leur taille"
      },
      { 
        id: 'type', 
        name: 'Forme', 
        options: ['brick', 'plate'],
        emoji: '🧩',
        labels: {
          brick: 'Brique',
          plate: 'Plaque'
        },
        helpText: "Trie les Legos par leur forme"
      }
    ],
    hard: [
      { 
        id: 'color', 
        name: 'Couleur', 
        options: ['red', 'blue', 'green', 'yellow', 'black', 'white'],
        emoji: '🎨',
        labels: {
          red: 'Rouge',
          blue: 'Bleu',
          green: 'Vert',
          yellow: 'Jaune',
          black: 'Noir',
          white: 'Blanc'
        },
        helpText: "Trie les Legos par leur couleur"
      },
      { 
        id: 'size', 
        name: 'Taille', 
        options: ['small', 'medium', 'big'],
        emoji: '📏',
        labels: {
          small: 'Petit',
          medium: 'Moyen',
          big: 'Grand'
        },
        helpText: "Trie les Legos par leur taille"
      },
      { 
        id: 'type', 
        name: 'Forme', 
        options: ['brick', 'plate', 'tile', 'slope'],
        emoji: '🧩',
        labels: {
          brick: 'Brique',
          plate: 'Plaque',
          tile: 'Cercle',
          slope: 'Triangle'
        },
        helpText: "Trie les Legos par leur forme"
      }
    ]
  };

  const [manualSortingBoxes, setManualSortingBoxes] = useState(() => {
    const boxes = {};
    sortingCategories.medium.forEach(category => {
      boxes[category.id] = {};
      category.options.forEach(option => {
        boxes[category.id][option] = [];
      });
    });
    return boxes;
  });

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Change level handler
  const handleLevelChange = (newLevel) => {
    setLevel(newLevel);
    setLegos(legoData[newLevel]);
    setSortBy(null);
    setSortedBoxes({});
    setManualSorting(false);
    setSelectedMode("auto");
    setGameStarted(false);
    setTimer(0);
    setIsTimerRunning(false);
    setScore(0);
    setFeedback("");
    setPerfectScore(false);
    
    // Reset manual sorting boxes for new level
    const boxes = {};
    sortingCategories[newLevel].forEach(category => {
      boxes[category.id] = {};
      category.options.forEach(option => {
        boxes[category.id][option] = [];
      });
    });
    setManualSortingBoxes(boxes);
  };

  // Start game handler
  const startGame = () => {
    setGameStarted(true);
    if (selectedMode === 'manual') {
      setIsTimerRunning(true);
    }
  };

  useEffect(() => {
    if (manualSorting) {
      let newScore = 0;
      Object.keys(manualSortingBoxes).forEach(category => {
        Object.keys(manualSortingBoxes[category]).forEach(option => {
          manualSortingBoxes[category][option].forEach(legoId => {
            const lego = legos.find(l => l.id === legoId);
            if (lego && lego[category] === option) {
              newScore += 1;
            }
          });
        });
      });
      
      setScore(newScore);
      
      const totalPieces = legos.length;
      const percentage = (newScore / totalPieces) * 100;
      
      if (percentage === 100) {
        setFeedback("Parfait ! Tu es un champion du tri ! 🎉");
        setShowConfetti(true);
        setIsTimerRunning(false);
        setPerfectScore(true);
        setTimeout(() => setShowConfetti(false), 5000);
      } else if (percentage >= 75) {
        setFeedback("Super travail ! Continue comme ça ! 👍");
      } else if (percentage >= 50) {
        setFeedback("Bien joué ! Tu peux faire encore mieux ! 😊");
      } else {
        setFeedback("Essaie encore ! Tu vas y arriver ! 💪");
      }
    }
  }, [manualSortingBoxes, manualSorting, legos]);

  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    if (mode === 'manual') {
      enableManualSortingBy('color');
    } else {
      setManualSorting(false);
      setSortBy(null);
      setSortedBoxes({});
      setIsTimerRunning(false);
      setTimer(0);
    }
    setGameStarted(false);
    setScore(0);
    setFeedback("");
    setPerfectScore(false);
  };

  const enableManualSortingBy = (criteria) => {
    setManualSorting(true);
    setSortBy(criteria);
    
    const boxes = {};
    sortingCategories[level].forEach(category => {
      boxes[category.id] = {};
      category.options.forEach(option => {
        boxes[category.id][option] = [];
      });
    });
    
    setManualSortingBoxes(boxes);
    setScore(0);
    setFeedback("");
    setSelectedMode("manual");
    setPerfectScore(false);
  };

  const sortByColor = () => {
    const boxes = {};
    legos.forEach(lego => {
      if (!boxes[lego.color]) {
        boxes[lego.color] = [];
      }
      boxes[lego.color].push(lego);
    });
    return boxes;
  };

  const sortBySize = () => {
    const boxes = {};
    legos.forEach(lego => {
      if (!boxes[lego.size]) {
        boxes[lego.size] = [];
      }
      boxes[lego.size].push(lego);
    });
    return boxes;
  };

  const sortByType = () => {
    const boxes = {};
    legos.forEach(lego => {
      if (!boxes[lego.type]) {
        boxes[lego.type] = [];
      }
      boxes[lego.type].push(lego);
    });
    return boxes;
  };

  const handleSort = (criteria) => {
    setSortBy(criteria);
    let boxes = {};
    
    switch (criteria) {
      case "color":
        boxes = sortByColor();
        break;
      case "size":
        boxes = sortBySize();
        break;
      case "type":
        boxes = sortByType();
        break;
      default:
        break;
    }
    
    setSortedBoxes(boxes);
  };

  const resetSorting = () => {
    setSortBy(null);
    setSortedBoxes({});
    setManualSorting(false);
    setLegos(legoData[level]);
    setScore(0);
    setFeedback("");
    setSelectedMode("auto");
    setGameStarted(false);
    setTimer(0);
    setIsTimerRunning(false);
    setPerfectScore(false);
    
    const boxes = {};
    sortingCategories[level].forEach(category => {
      boxes[category.id] = {};
      category.options.forEach(option => {
        boxes[category.id][option] = [];
      });
    });
    setManualSortingBoxes(boxes);
  };

  const handleDragStart = (e, lego) => {
    setDraggedItem(lego);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
  };

  const handleTouchStart = (e, lego) => {
    setDraggedItem(lego);
    e.preventDefault();
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
  };

  const handleTouchEnd = (e, category, option) => {
    if (!draggedItem) return;
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element && element.closest('[data-dropzone]')) {
      handleDropOnSortingBox(e, category, option);
    }
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnSortingBox = (e, category, option) => {
    e.preventDefault();
    if (!draggedItem) return;
    if (!gameStarted) setGameStarted(true);
    if (!isTimerRunning) setIsTimerRunning(true);

    const newBoxes = JSON.parse(JSON.stringify(manualSortingBoxes));
    Object.keys(newBoxes).forEach(cat => {
      Object.keys(newBoxes[cat]).forEach(opt => {
        newBoxes[cat][opt] = newBoxes[cat][opt].filter(id => id !== draggedItem.id);
      });
    });

    newBoxes[category][option].push(draggedItem.id);
    setManualSortingBoxes(newBoxes);
    setDraggedItem(null);
  };

  const getUnsortedLegos = () => {
    const allSortedIds = [];
    Object.keys(manualSortingBoxes).forEach(category => {
      Object.keys(manualSortingBoxes[category]).forEach(option => {
        allSortedIds.push(...manualSortingBoxes[category][option]);
      });
    });
    
    return legos.filter(lego => !allSortedIds.includes(lego.id));
  };

  const getColorClass = (color) => {
    const colorMap = {
      red: "bg-red-500 border-red-700 border-b-4",
      blue: "bg-blue-500 border-blue-700 border-b-4",
      green: "bg-green-500 border-green-700 border-b-4",
      yellow: "bg-yellow-400 border-yellow-600 border-b-4",
      black: "bg-gray-800 border-gray-900 border-b-4",
      white: "bg-white border-gray-300 border-b-4 text-gray-800",
    };
    return colorMap[color] || "bg-gray-300 border-gray-500 border-b-4";
  };

  const getSizeClass = (size) => {
    const sizeMap = {
      small: "w-8 h-6 text-xs",
      medium: "w-12 h-8 text-sm",
      big: "w-16 h-10 text-base",
    };
    return sizeMap[size] || "w-8 h-6";
  };

  const getTileEmoji = (color) => {
    const colorMap = {
      red: "🔴",
      blue: "🔵",
      green: "🟢",
      yellow: "🟡",
      black: "⚫",
      white: "⚪",
    };
    return colorMap[color] || "⭕";
  };

  const getTypeEmoji = (type, color) => {
    if (type === 'tile') return getTileEmoji(color);
    
    const typeMap = {
      brick: "🧱",
      plate: "🟫",
      slope: "🔺",
    };
    return typeMap[type] || "❓";
  };

  const isCorrectlySorted = (legoId, category, option) => {
    const lego = legos.find(l => l.id === legoId);
    return lego && lego[category] === option;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('legoTutorialSeen', 'true');
  };

  useEffect(() => {
    const tutorialSeen = localStorage.getItem('legoTutorialSeen');
    if (tutorialSeen) {
      setShowTutorial(false);
    }
  }, []);

  return (
    <div className="relative min-h-screen">
    <AnimatedBackground />
  
      {showConfetti && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          {[...Array(100)].map((_, i) => (
            <div
              key={`confetti-${i}`}
              className={`absolute w-2 h-2 rounded-full animate-confetti`}
              style={{
                left: `${Math.random() * 100}vw`,
                top: `${-10 + Math.random() * 10}vh`,
                animationDelay: `${i * 0.05}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
                backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
              }}
            />
          ))}
        </div>
      )}

      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full relative">
            <button 
              onClick={closeTutorial}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center text-purple-600">Comment jouer ?</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <span className="text-purple-600 text-xl">1</span>
                </div>
                <p className="text-gray-700">Choisis un niveau de difficulté (Facile, Moyen, Difficile)</p>
              </div>
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <span className="text-purple-600 text-xl">2</span>
                </div>
                <p className="text-gray-700">Sélectionne le mode de tri (Automatique ou Manuel)</p>
              </div>
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <span className="text-purple-600 text-xl">3</span>
                </div>
                <p className="text-gray-700">Dans le mode manuel, fais glisser les pièces dans les bonnes cases</p>
              </div>
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <span className="text-purple-600 text-xl">4</span>
                </div>
                <p className="text-gray-700">Essaie de faire le meilleur score en un minimum de temps !</p>
              </div>
            </div>
            <button
              onClick={closeTutorial}
              className="mt-6 w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Commencer à jouer
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border-t-8 border-lego-red relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-1 text-gray-800 flex items-center">
              <span className="mr-2 md:mr-3">🧱</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-blue-500 to-green-500">
                Mon Atelier Lego
              </span>
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Triez automatiquement ou organisez manuellement vos pièces Lego.
            </p>
          </div>
          
          {manualSorting && gameStarted && (
            <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-200 flex items-center">
              <span className="text-blue-700 font-medium mr-2">⏱️ Temps:</span>
              <span className="text-blue-800 font-bold">{formatTime(timer)}</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex flex-col md:flex-row gap-2">
              <h3 className="text-sm font-medium text-gray-700 md:mr-2 md:mt-1">Niveau :</h3>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => handleLevelChange("easy")}
                  className={`px-3 py-1 rounded-lg font-medium text-sm transition-all ${
                    level === "easy"
                      ? "bg-green-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Facile (2-4 ans)
                </button>
                <button
                  onClick={() => handleLevelChange("medium")}
                  className={`px-3 py-1 rounded-lg font-medium text-sm transition-all ${
                    level === "medium"
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Moyen (4-5 ans)
                </button>
                <button
                  onClick={() => handleLevelChange("hard")}
                  className={`px-3 py-1 rounded-lg font-medium text-sm transition-all ${
                    level === "hard"
                      ? "bg-purple-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Difficile (5-7 ans)
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="sortingMode"
                  value="auto"
                  checked={selectedMode === 'auto'}
                  onChange={() => handleModeChange('auto')}
                />
                <span className="ml-2">Tri Automatique</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="sortingMode"
                  value="manual"
                  checked={selectedMode === 'manual'}
                  onChange={() => handleModeChange('manual')}
                />
                <span className="ml-2">Tri Manuel</span>
              </label>
            </div>
          </div>

          {!gameStarted && selectedMode === 'manual' ? (
            <button
              onClick={startGame}
              className="w-full py-3 bg-green-500 text-white rounded-lg font-bold text-lg shadow-md hover:bg-green-600 transition-colors"
            >
              Commencer le jeu !
            </button>
          ) : selectedMode === 'auto' ? (
            <div className="flex flex-wrap gap-2 md:gap-3">
              {sortingCategories[level].map(category => (
                <button
                  key={category.id}
                  onClick={() => handleSort(category.id)}
                  className={`px-3 py-2 md:px-5 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all transform hover:scale-105 shadow-md ${
                    sortBy === category.id
                      ? category.id === "color" 
                        ? "bg-red-500 text-white shadow-red-500/30" 
                        : category.id === "size" 
                          ? "bg-blue-500 text-white shadow-blue-500/30" 
                          : "bg-green-500 text-white shadow-green-500/30"
                      : "bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {category.name}
                </button>
              ))}
              <button
                onClick={resetSorting}
                className="px-3 py-2 md:px-5 md:py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold border-2 border-gray-200 transition-all transform hover:scale-105 hover:bg-gray-200 shadow-md text-sm md:text-base"
              >
                Réinitialiser
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 md:gap-3">
              {sortingCategories[level].map(category => (
                <button
                  key={category.id}
                  onClick={() => enableManualSortingBy(category.id)}
                  className={`px-3 py-2 md:px-5 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all transform hover:scale-105 shadow-md ${
                    sortBy === category.id
                      ? category.id === "color" 
                        ? "bg-red-500 text-white shadow-red-500/30" 
                        : category.id === "size" 
                          ? "bg-blue-500 text-white shadow-blue-500/30" 
                          : "bg-green-500 text-white shadow-green-500/30"
                      : "bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Trier par {category.name}
                </button>
              ))}
              <button
                onClick={resetSorting}
                className="px-3 py-2 md:px-5 md:py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold border-2 border-gray-200 transition-all transform hover:scale-105 hover:bg-gray-200 shadow-md text-sm md:text-base"
              >
                Réinitialiser
              </button>
            </div>
          )}
        </div>

        {manualSorting && gameStarted && (
          <div className="mb-4 md:mb-6 bg-purple-50 p-3 md:p-4 rounded-lg border border-purple-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
              <div>
                <h2 className="text-lg md:text-2xl font-semibold mb-1 text-purple-800">
                  <span className="text-purple-500">Mode Manuel</span> - Trie les pièces par {sortBy === 'color' ? 'couleur' : sortBy === 'size' ? 'taille' : 'forme'}
                </h2>
                <div className="flex items-center gap-4">
                  <p className="text-sm md:text-base text-purple-600">
                    Score: <strong>{score}/{legos.length}</strong>
                  </p>
                  <p className="text-sm md:text-base text-blue-600">
                    ⏱️ Temps: <strong>{formatTime(timer)}</strong>
                  </p>
                </div>
              </div>
              {feedback && (
                <div className={`bg-white px-3 py-1 md:px-4 md:py-2 rounded-full shadow-md border ${
                  perfectScore ? 'border-yellow-300 animate-bounce' : 'border-purple-200'
                }`}>
                  <span className={`text-sm md:text-base font-medium ${
                    perfectScore ? 'text-yellow-600' : 'text-purple-700'
                  }`}>{feedback}</span>
                </div>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 md:h-2.5 mt-2 md:mt-3">
              <div 
                className="h-2 md:h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" 
                style={{ width: `${(score / legos.length) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {manualSorting && gameStarted ? (
        <div className="space-y-4 md:space-y-6 relative z-10">
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-700">
              Pièces à trier ({getUnsortedLegos().length})
            </h3>
            <div 
              className="flex flex-wrap gap-2 md:gap-3 p-3 md:p-4 bg-gray-50 rounded-lg min-h-24 md:min-h-32"
              onDragOver={handleDragOver}
            >
              {getUnsortedLegos().map(lego => (
                <div
                  key={lego.id}
                  className={`${getColorClass(lego.color)} ${getSizeClass(lego.size)} 
                    ${lego.type === 'tile' ? 'rounded-full' : 'rounded-sm'}
                    flex items-center justify-center font-bold cursor-move 
                    relative transition-transform shadow-md hover:shadow-lg hover:z-10 hover:scale-105`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lego)}
                  onTouchStart={(e) => handleTouchStart(e, lego)}
                  onTouchMove={handleTouchMove}
                  title={lego.name}
                >
                  {getTypeEmoji(lego.type, lego.color)}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            {sortingCategories[level]
              .filter(category => category.id === sortBy)
              .map(category => (
                <div key={category.id}>
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-700 flex items-center">
                      <span className="mr-2 text-xl md:text-2xl">{category.emoji}</span>
                      {category.name}
                    </h3>
                    <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {category.helpText}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {category.options.map(option => {
                      const legosInBox = manualSortingBoxes[category.id][option] || [];
                      const correctCount = legosInBox.filter(id => 
                        isCorrectlySorted(id, category.id, option)
                      ).length;
                      
                      return (
                        <div
                          key={option}
                          data-dropzone="true"
                          className={`border-2 border-dashed rounded-lg p-2 md:p-3 transition-all
                            ${correctCount === legosInBox.length && legosInBox.length > 0 
                              ? 'border-green-300 bg-green-50' 
                              : 'border-gray-300 bg-gray-50'}
                            min-h-16 md:min-h-20 touch-action-none`}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDropOnSortingBox(e, category.id, option)}
                          onTouchEnd={(e) => handleTouchEnd(e, category.id, option)}
                        >
                          <div className="flex justify-between items-center mb-1 md:mb-2">
                            <span className="text-sm md:text-base font-medium capitalize">
                              {category.labels[option] || option}
                            </span>
                            <span className="text-xs md:text-sm px-1 md:px-2 py-0.5 md:py-1 rounded-full bg-white">
                              {correctCount}/{legosInBox.length}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 md:gap-2">
                            {legosInBox.map(legoId => {
                              const lego = legos.find(l => l.id === legoId);
                              if (!lego) return null;
                              
                              const isCorrect = isCorrectlySorted(legoId, category.id, option);
                              
                              return (
                                <div
                                  key={legoId}
                                  className={`${getColorClass(lego.color)} ${getSizeClass(lego.size)} 
                                    ${lego.type === 'tile' ? 'rounded-full' : 'rounded-sm'}
                                    flex items-center justify-center font-bold
                                    relative shadow-md ${isCorrect ? 'animate-pulse' : 'animate-shake'}`}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, lego)}
                                  onTouchStart={(e) => handleTouchStart(e, lego)}
                                  onTouchMove={handleTouchMove}
                                  title={`${lego.name} - ${isCorrect ? 'Correct' : 'Incorrect'}`}
                                >
                                  {getTypeEmoji(lego.type, lego.color)}
                                  {!isCorrect && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full border border-white"></div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      ) : Object.keys(sortedBoxes).length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 relative z-10">
          {Object.entries(sortedBoxes).map(([boxName, boxLegos]) => (
            <div 
              key={boxName} 
              className="border rounded-xl p-4 md:p-5 shadow-md bg-white hover:shadow-lg transition-shadow"
            >
              <h3 className="font-bold text-lg md:text-xl mb-2 md:mb-3 capitalize flex justify-between items-center">
                <span>
                  {sortBy === 'color' ? (
                    sortingCategories[level].find(c => c.id === 'color')?.labels[boxName] || boxName
                  ) : sortBy === 'size' ? (
                    sortingCategories[level].find(c => c.id === 'size')?.labels[boxName] || boxName
                  ) : (
                    sortingCategories[level].find(c => c.id === 'type')?.labels[boxName] || boxName
                  )} <span className="text-gray-500 ml-1">({boxLegos.length})</span>
                </span>
                <span className="text-xs md:text-sm font-normal px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-gray-100 text-gray-600">
                  {sortBy === "color" ? "Couleur" : sortBy === "size" ? "Taille" : "Forme"}
                </span>
              </h3>
              <div className="flex flex-wrap gap-2 md:gap-3 p-1 md:p-2 bg-gray-50 rounded-lg">
                {boxLegos.map(lego => (
                  <div
                    key={lego.id}
                    className={`${getColorClass(lego.color)} ${getSizeClass(lego.size)} 
                      ${lego.type === 'tile' ? 'rounded-full' : 'rounded-sm'}
                      flex items-center justify-center font-bold shadow-md`}
                    title={lego.name}
                  >
                    {getTypeEmoji(lego.type, lego.color)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 relative z-10">
          <h2 className="text-lg md:text-2xl font-semibold mb-3 md:mb-4 text-gray-700">
            Toutes les pièces ({legos.length})
          </h2>
          <div className="flex flex-wrap gap-2 md:gap-3 p-2 md:p-4 bg-gray-50 rounded-lg min-h-24 md:min-h-32">
            {legos.map(lego => (
              <div
                key={lego.id}
                className={`${getColorClass(lego.color)} ${getSizeClass(lego.size)} 
                  ${lego.type === 'tile' ? 'rounded-full' : 'rounded-sm'}
                  flex items-center justify-center font-bold shadow-md`}
                title={lego.name}
              >
                {getTypeEmoji(lego.type, lego.color)}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20vh) rotate(180deg);
          }
          100% {
            transform: translateY(0) rotate(360deg);
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
        
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-pulse {
          animation: pulse 1s ease-in-out infinite;
        }
        
        @media (max-width: 640px) {
          .animate-float {
            animation-duration: 30s !important;
          }
          .animate-confetti {
            animation-duration: 2s !important;
          }
        }
      `}</style>
    </div>
  );
}

export default LegoSorting;