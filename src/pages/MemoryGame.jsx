import React, { useState, useEffect, useCallback } from 'react';

const MemoryGame = () => {
  // Thème Lego avec plusieurs catégories
  const legoEmojis = {
    colors: ['🔴', '🔵', '🟢', '🟡', '🟠', '🟣', '⚫', '⚪', '🟤'],
    animals: ['🦖', '🐶', '🐱', '🐰', '🐻', '🐼', '🦁', '🐸', '🐙'],
    food: ['🍎', '🍕', '🍦', '🍪', '🍩', '🍉', '🍇', '🥕', '🍔'],
    objects: ['🧱', '⭐', '❤️', '🎯', '🚀', '🏆', '⚽', '🎸', '📚'],
    nature: ['🌞', '🌈', '🌲', '🌻', '🌊', '⛄', '🍂', '🌸', '🌙']
  };

  // Niveaux de difficulté
  const difficultyLevels = {
    easy: {
      name: "Facile (2-4 ans)",
      pairs: 4,
      grid: "grid-cols-4",
      emojiSize: "text-5xl md:text-6xl",
      timeBonus: 5,
      category: 'colors',
      flipDuration: 1000,
      maxTime: 300
    },
    medium: {
      name: "Moyen (4-5 ans)",
      pairs: 6,
      grid: "grid-cols-4",
      emojiSize: "text-4xl md:text-5xl",
      timeBonus: 3,
      category: 'animals',
      flipDuration: 800,
      maxTime: 240
    },
    hard: {
      name: "Difficile (5-7 ans)",
      pairs: 8,
      grid: "grid-cols-4 md:grid-cols-5",
      emojiSize: "text-3xl md:text-4xl",
      timeBonus: 1,
      category: 'mixed',
      flipDuration: 600,
      maxTime: 180
    }
  };

  const [difficulty, setDifficulty] = useState('easy');
  const currentLevel = difficultyLevels[difficulty];
  const [confetti, setConfetti] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [theme, setTheme] = useState('light');
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  // Fonction pour obtenir un emoji aléatoire
  const getRandomLegoEmoji = useCallback(() => {
    const allEmojis = Object.values(legoEmojis).flat();
    return allEmojis[Math.floor(Math.random() * allEmojis.length)];
  }, []);

  // Effets sonores
  const playSound = (type) => {
    if (!soundEnabled) return;
    
    const sounds = {
      flip: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-click-1114.mp3'),
      match: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3'),
      win: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'),
      error: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3')
    };
    
    sounds[type].volume = 0.3;
    sounds[type].play().catch(e => console.log("Audio play failed:", e));
  };

  // Création des cartes
  const createCards = useCallback(() => {
    let selectedEmojis;
    
    if (currentLevel.category === 'mixed') {
      selectedEmojis = Object.values(legoEmojis).flat();
    } else {
      selectedEmojis = legoEmojis[currentLevel.category] || legoEmojis.colors;
    }
    
    selectedEmojis = [...selectedEmojis]
      .sort(() => 0.5 - Math.random())
      .slice(0, currentLevel.pairs);
      
    const cards = [...selectedEmojis, ...selectedEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        flipped: false,
        matched: false
      }));
      
    return cards;
  }, [currentLevel.pairs, currentLevel.category]);

  const [cards, setCards] = useState(createCards());
  const [flippedCards, setFlippedCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [timeWarning, setTimeWarning] = useState(false);

  // Réinitialisation du jeu
  useEffect(() => {
    resetGame();
  }, [difficulty, createCards]);

  // Timer
  useEffect(() => {
    let interval;
    if (gameStarted && !gameCompleted) {
      interval = setInterval(() => {
        setTimer(prevTimer => {
          const newTime = prevTimer + 1;
          if (newTime > currentLevel.maxTime * 0.75) {
            setTimeWarning(true);
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameCompleted, currentLevel.maxTime]);

  // Vérification des paires
  useEffect(() => {
    if (flippedCards.length === 2) {
      const [firstCard, secondCard] = flippedCards;
      
      if (cards[firstCard].emoji === cards[secondCard].emoji) {
        playSound('match');
        setCards(prevCards => 
          prevCards.map(card => 
            card.id === firstCard || card.id === secondCard
              ? { ...card, matched: true }
              : card
          )
        );
        
        if (cards.filter(card => !card.matched).length === 2) {
          setTimeout(() => {
            setGameCompleted(true);
            playSound('win');
            setConfetti(true);
            setTimeout(() => setConfetti(false), 3000);
          }, 500);
        }
        
        setFlippedCards([]);
      } else {
        playSound('error');
        setTimeout(() => {
          setCards(prevCards => 
            prevCards.map(card => 
              card.id === firstCard || card.id === secondCard
                ? { ...card, flipped: false }
                : card
            )
          );
          setFlippedCards([]);
        }, currentLevel.flipDuration);
      }
      
      setMoves(prevMoves => prevMoves + 1);
    }
  }, [flippedCards, cards, currentLevel.flipDuration]);

  const handleCardClick = (id) => {
    if (!gameStarted) {
      setGameStarted(true);
      playSound('flip');
    }
    
    if (flippedCards.length >= 2 || cards[id].flipped || cards[id].matched) {
      return;
    }

    playSound('flip');
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === id ? { ...card, flipped: true } : card
      )
    );
    
    setFlippedCards(prev => [...prev, id]);
  };

  const resetGame = () => {
    setCards(createCards());
    setFlippedCards([]);
    setMoves(0);
    setGameCompleted(false);
    setTimer(0);
    setGameStarted(false);
    setTimeWarning(false);
  };

  const changeDifficulty = (level) => {
    setDifficulty(level);
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Conseils adaptés à l'âge
  const getAgeAppropriateTips = () => {
    const allTips = {
      easy: [
        "Regarde bien les couleurs des briques Lego",
        "Essaie de te souvenir où sont les briques identiques",
        "Retourne les cartes une par une pour bien les voir",
        "Demande à un adulte de t'aider si besoin"
      ],
      medium: [
        "Associe d'abord les formes et couleurs simples",
        "Compte combien de paires tu as déjà trouvées",
        "Retourne les cartes deux par deux pour comparer",
        "Prends ton temps pour bien observer"
      ],
      hard: [
        "Crée une carte mentale des positions",
        "Fais des associations (ex: animaux, nourriture...)",
        "Priorise les coins et bords pour commencer",
        "Essaie de battre ton record de temps!"
      ]
    };
    
    return allTips[difficulty];
  };

  // Calcul du score
  const calculateScore = () => {
    const timeScore = Math.max(0, currentLevel.maxTime - timer);
    const movesScore = (currentLevel.pairs * 10) - moves;
    return timeScore + movesScore;
  };

  // Classes de thème
  const themeClasses = {
    light: {
      bg: 'from-blue-50 to-purple-50',
      card: 'bg-white/90 backdrop-blur-sm',
      text: 'text-gray-800',
      button: 'bg-white/80 hover:bg-white/90 text-gray-800 backdrop-blur-sm'
    },
    dark: {
      bg: 'from-gray-800 to-gray-900',
      card: 'bg-gray-800/90 backdrop-blur-sm',
      text: 'text-gray-100',
      button: 'bg-gray-700/80 hover:bg-gray-600/90 text-gray-100 backdrop-blur-sm'
    }
  };

  return (
    <div className={`relative min-h-screen py-8 px-4 overflow-hidden bg-gradient-to-br ${themeClasses[theme].bg}`}>
      {/* Mind-blowing animated background */}
      <div className="fixed inset-0 overflow-hidden">
        {/* Animated gradient mesh */}
        <div className="absolute inset-0 bg-gradient-mesh animate-gradient-shift opacity-30"></div>
        
        {/* Floating geometric shapes */}
        <div className="absolute inset-0">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={`geo-${i}`}
              className={`absolute w-8 h-8 ${theme === 'light' ? 'bg-blue-200/40' : 'bg-blue-500/20'} rounded-lg animate-float-geometric shadow-lg backdrop-blur-sm`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${8 + Math.random() * 4}s`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
        </div>

        {/* Particle system */}
        <div className="absolute inset-0">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={`particle-${i}`}
              className={`absolute w-1 h-1 ${theme === 'light' ? 'bg-purple-400' : 'bg-purple-300'} rounded-full animate-particles opacity-60`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${15 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>

        {/* Morphing blobs */}
        <div className="absolute inset-0">
          <div className={`absolute w-64 h-64 ${theme === 'light' ? 'bg-gradient-to-r from-pink-200/30 to-yellow-200/30' : 'bg-gradient-to-r from-pink-500/20 to-yellow-500/20'} rounded-full blur-3xl animate-blob-1`}></div>
          <div className={`absolute w-72 h-72 ${theme === 'light' ? 'bg-gradient-to-r from-purple-200/30 to-blue-200/30' : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20'} rounded-full blur-3xl animate-blob-2`}></div>
          <div className={`absolute w-56 h-56 ${theme === 'light' ? 'bg-gradient-to-r from-green-200/30 to-cyan-200/30' : 'bg-gradient-to-r from-green-500/20 to-cyan-500/20'} rounded-full blur-3xl animate-blob-3`}></div>
        </div>

        {/* Floating Lego pieces with enhanced animation */}
        <div className="absolute inset-0">
          {Array.from({ length: 25 }).map((_, i) => (
            <div 
              key={`lego-${i}`}
              className="absolute lego-brick animate-lego-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 25 + 15}px`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${12 + Math.random() * 8}s`,
                filter: `hue-rotate(${Math.random() * 360}deg)`,
                opacity: theme === 'light' ? 0.4 : 0.3
              }}
            >
              {getRandomLegoEmoji()}
            </div>
          ))}
        </div>

        {/* Ripple effects */}
        <div className="absolute inset-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`ripple-${i}`}
              className={`absolute border-2 ${theme === 'light' ? 'border-blue-300/20' : 'border-blue-400/10'} rounded-full animate-ripple`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${8 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        {/* Sparkle effects */}
        <div className="absolute inset-0">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className={`absolute w-2 h-2 ${theme === 'light' ? 'bg-yellow-300' : 'bg-yellow-400'} animate-sparkle`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
              }}
            />
          ))}
        </div>
      </div>

      {/* Confetti effect */}
      {confetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={`confetti-${i}`}
              className="absolute w-3 h-3 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'][Math.floor(Math.random() * 7)],
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      <div className={`relative z-10 ${themeClasses[theme].card} rounded-xl shadow-2xl p-4 md:p-6 mb-6 border-t-8 border-gradient-to-r from-red-500 to-yellow-500 max-w-3xl mx-auto transform transition-all hover:scale-[1.005] ${themeClasses[theme].text} border border-white/20`}>
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 text-center bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 bg-clip-text text-transparent animate-gradient-text">
            <span className="mr-2 animate-bounce">🧠</span>
            Jeu de Mémoire Lego
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={toggleSound}
              className={`p-2 rounded-full transition-all transform hover:scale-110 ${soundEnabled ? 'bg-green-100 text-green-800 shadow-lg shadow-green-200/50' : 'bg-gray-100 text-gray-800'}`}
              aria-label={soundEnabled ? "Désactiver le son" : "Activer le son"}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-all transform hover:scale-110 ${themeClasses[theme].button} shadow-lg`}
              aria-label={theme === 'light' ? "Mode sombre" : "Mode clair"}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
        
        {/* Sélecteur de difficulté */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {Object.keys(difficultyLevels).map(level => (
            <button
              key={level}
              onClick={() => changeDifficulty(level)}
              className={`px-4 py-2 rounded-lg font-medium transition-all shadow-sm transform hover:scale-105 hover:shadow-lg ${
                difficulty === level 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-300/50' 
                  : `${themeClasses[theme].button}`
              }`}
            >
              {difficultyLevels[level].name}
            </button>
          ))}
        </div>
        
        {/* Sélecteur de catégorie */}
        {difficulty !== 'easy' && (
          <div className="mb-4 text-center">
            <button 
              onClick={() => setShowCategorySelector(!showCategorySelector)}
              className={`px-3 py-1 rounded-lg text-sm transition-all transform hover:scale-105 ${themeClasses[theme].button}`}
            >
              {showCategorySelector ? 'Cacher les catégories' : 'Changer de catégorie'}
            </button>
            
            {showCategorySelector && (
              <div className="mt-2 flex flex-wrap justify-center gap-2 animate-fade-in">
                {Object.keys(legoEmojis).map(category => (
                  <button
                    key={category}
                    onClick={() => {
                      const newLevel = {...difficultyLevels[difficulty]};
                      newLevel.category = category;
                      setDifficulty(newLevel);
                      setShowCategorySelector(false);
                    }}
                    className={`px-3 py-1 rounded-lg text-sm transition-all transform hover:scale-105 ${
                      currentLevel.category === category 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-300/50' 
                        : `${themeClasses[theme].button}`
                    }`}
                  >
                    {category === 'colors' && 'Couleurs'}
                    {category === 'animals' && 'Animaux'}
                    {category === 'food' && 'Nourriture'}
                    {category === 'objects' && 'Objets'}
                    {category === 'nature' && 'Nature'}
                  </button>
                ))}
                <button
                  onClick={() => {
                    const newLevel = {...difficultyLevels[difficulty]};
                    newLevel.category = 'mixed';
                    setDifficulty(newLevel);
                    setShowCategorySelector(false);
                  }}
                  className={`px-3 py-1 rounded-lg text-sm transition-all transform hover:scale-105 ${
                    currentLevel.category === 'mixed' 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-300/50' 
                      : `${themeClasses[theme].button}`
                  }`}
                >
                  Mélangé
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Statistiques du jeu */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <div className={`px-4 py-2 rounded-lg shadow-lg transition-all transform hover:scale-105 ${theme === 'light' ? 'bg-blue-100 text-blue-800 shadow-blue-200/50' : 'bg-blue-900 text-blue-100 shadow-blue-800/50'}`}>
            <span className="font-medium">Mouvements: </span>
            <span className="font-bold">{moves}</span>
          </div>
          <div className={`px-4 py-2 rounded-lg shadow-lg transition-all transform hover:scale-105 ${timeWarning ? 'bg-red-100 text-red-800 animate-pulse shadow-red-200/50' : theme === 'light' ? 'bg-green-100 text-green-800 shadow-green-200/50' : 'bg-green-900 text-green-100 shadow-green-800/50'}`}>
            <span className="font-medium">Temps: </span>
            <span className="font-bold">{formatTime(timer)}</span>
            {timeWarning && <span className="ml-2 animate-bounce">⏰</span>}
          </div>
          <div className={`px-4 py-2 rounded-lg shadow-lg transition-all transform hover:scale-105 ${theme === 'light' ? 'bg-yellow-100 text-yellow-800 shadow-yellow-200/50' : 'bg-yellow-900 text-yellow-100 shadow-yellow-800/50'}`}>
            <span className="font-medium">Score: </span>
            <span className="font-bold">{calculateScore()}</span>
          </div>
          <button 
            onClick={resetGame}
            className={`px-4 py-2 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl flex items-center transform hover:scale-105 ${
              theme === 'light' ? 'bg-red-100 hover:bg-red-200 text-red-800 shadow-red-200/50' : 'bg-red-900 hover:bg-red-800 text-red-100 shadow-red-800/50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Recommencer
          </button>
        </div>

        {/* Message de fin de jeu */}
        {gameCompleted && (
          <div className={`border rounded-lg p-4 mb-4 text-center animate-victory shadow-2xl ${
            theme === 'light' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300 text-yellow-800 shadow-yellow-300/50' : 'bg-gradient-to-r from-yellow-700 to-yellow-800 border-yellow-600 text-yellow-100 shadow-yellow-600/50'
          }`}>
            <p className="text-2xl font-bold animate-bounce">Bravo ! 🎉</p>
            <p>Tu as complété le jeu en {moves} mouvements et {formatTime(timer)} !</p>
            <p className="mt-2">Ton score: <span className="font-bold animate-pulse">{calculateScore()}</span> points</p>
          </div>
        )}

        {/* Message de temps écoulé */}
        {timer >= currentLevel.maxTime && !gameCompleted && (
          <div className={`border rounded-lg p-4 mb-4 text-center animate-shake ${
            theme === 'light' ? 'bg-red-100 border-red-300 text-red-800' : 'bg-red-900 border-red-700 text-red-100'
          }`}>
            <p className="text-xl font-bold">Temps écoulé ! ⌛</p>
            <p>Tu as presque fini ! Essaie encore !</p>
            <button 
              onClick={resetGame}
              className={`mt-2 px-4 py-1 rounded-lg font-medium transition-all transform hover:scale-105 ${
                theme === 'light' ? 'bg-red-200 hover:bg-red-300' : 'bg-red-700 hover:bg-red-600'
              }`}
            >
              Rejouer
            </button>
          </div>
        )}

        {/* Grille de jeu */}
        <div className={`grid ${currentLevel.grid} gap-3 md:gap-4`}>
          {cards.map(card => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`aspect-square flex items-center justify-center ${currentLevel.emojiSize} rounded-lg cursor-pointer transition-all duration-500 transform ${
                card.flipped || card.matched 
                  ? `rotate-y-180 ${theme === 'light' ? 'bg-white/95 border-gray-200' : 'bg-gray-600/95 border-gray-500'} shadow-inner border-2 backdrop-blur-sm` 
                  : `bg-gradient-to-br ${theme === 'light' ? 'from-blue-100/90 to-blue-200/90' : 'from-blue-900/90 to-blue-800/90'} shadow-lg hover:shadow-xl hover:scale-110 backdrop-blur-sm border border-white/20`
              } ${
                card.matched ? `animate-match-celebration border-2 ${theme === 'light' ? 'border-green-400 shadow-lg shadow-green-400/50' : 'border-green-600 shadow-lg shadow-green-600/50'}` : ''
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: card.flipped || card.matched ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {(card.flipped || card.matched) ? (
                <span className="block transform rotate-y-180 animate-emoji-pop">{card.emoji}</span>
              ) : (
                <span className={`block ${theme === 'light' ? 'text-blue-400' : 'text-blue-300'} font-bold animate-pulse`}>?</span>
              )}
            </div>
          ))}
        </div>

        {/* Section d'aide */}
        <div className="mt-6">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className={`w-full p-2 rounded-lg font-medium flex items-center justify-center mb-2 transition-all transform hover:scale-105 shadow-lg ${themeClasses[theme].button}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
            {showHelp ? 'Cacher les conseils' : 'Montrer les conseils'}
          </button>
          
          {showHelp && (
            <div className={`p-4 rounded-lg border shadow-lg animate-fade-in backdrop-blur-sm ${
              theme === 'light' ? 'bg-gradient-to-br from-gray-50/90 to-gray-100/90 border-gray-200' : 'bg-gradient-to-br from-gray-600/90 to-gray-700/90 border-gray-500'
            }`}>
              <h3 className="font-semibold mb-2 flex items-center text-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                </svg>
                Conseils pour mieux jouer ({difficultyLevels[difficulty].name}):
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                {getAgeAppropriateTips().map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-1 mr-2 text-blue-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Enhanced CSS Animations */}
        <style jsx global>{`
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          
          @keyframes float-geometric {
            0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
            25% { transform: translateY(-20px) rotate(90deg) scale(1.1); }
            50% { transform: translateY(-10px) rotate(180deg) scale(0.9); }
            75% { transform: translateY(-25px) rotate(270deg) scale(1.05); }
          }
          
          @keyframes particles {
            0% { transform: translateY(100vh) translateX(0) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-100vh) translateX(100px) rotate(360deg); opacity: 0; }
          }
          
          @keyframes blob-1 {
            0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
            25% { transform: translate(20px, -30px) scale(1.1) rotate(90deg); }
            50% { transform: translate(-20px, 20px) scale(0.9) rotate(180deg); }
            75% { transform: translate(30px, 10px) scale(1.05) rotate(270deg); }
          }
          
          @keyframes blob-2 {
            0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
            33% { transform: translate(-30px, 20px) scale(1.2) rotate(120deg); }
            66% { transform: translate(25px, -25px) scale(0.8) rotate(240deg); }
          }
          
          @keyframes blob-3 {
            0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
            20% { transform: translate(15px, 25px) scale(1.15) rotate(72deg); }
            40% { transform: translate(-25px, -15px) scale(0.85) rotate(144deg); }
            60% { transform: translate(30px, -5px) scale(1.1) rotate(216deg); }
            80% { transform: translate(-10px, 30px) scale(0.95) rotate(288deg); }
          }
          
          @keyframes lego-float {
            0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
            25% { transform: translateY(-30px) rotate(90deg) scale(1.1); }
            50% { transform: translateY(-15px) rotate(180deg) scale(0.9); }
            75% { transform: translateY(-40px) rotate(270deg) scale(1.05); }
          }
          
          @keyframes ripple {
            0% { width: 0; height: 0; opacity: 1; }
            100% { width: 300px; height: 300px; opacity: 0; }
          }
          
          @keyframes sparkle {
            0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
            50% { opacity: 1; transform: scale(1) rotate(180deg); }
          }
          
          @keyframes confetti {
            0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          
          @keyframes gradient-text {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes victory {
            0%, 100% { transform: scale(1); }
            25% { transform: scale(1.05); }
            50% { transform: scale(1.1); }
            75% { transform: scale(1.05); }
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          
          @keyframes match-celebration {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          
          @keyframes emoji-pop {
            0% { transform: scale(0) rotate(0deg); }
            50% { transform: scale(1.2) rotate(180deg); }
            100% { transform: scale(1) rotate(360deg); }
          }
          
          @keyframes rotate-y-180 {
            from { transform: rotateY(0deg); }
            to { transform: rotateY(180deg); }
          }
          
          .rotate-y-180 {
            animation: rotate-y-180 0.6s ease forwards;
          }
          
          .bg-gradient-mesh {
            background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
            background-size: 400% 400%;
          }
          
          .animate-gradient-shift {
            animation: gradient-shift 15s ease infinite;
          }
          
          .animate-float-geometric {
            animation: float-geometric 12s ease-in-out infinite;
          }
          
          .animate-particles {
            animation: particles 25s linear infinite;
          }
          
          .animate-blob-1 {
            animation: blob-1 20s ease-in-out infinite;
          }
          
          .animate-blob-2 {
            animation: blob-2 25s ease-in-out infinite reverse;
          }
          
          .animate-blob-3 {
            animation: blob-3 30s ease-in-out infinite;
          }
          
          .animate-lego-float {
            animation: lego-float 20s ease-in-out infinite;
          }
          
          .animate-ripple {
            animation: ripple 12s ease-out infinite;
          }
          
          .animate-sparkle {
            animation: sparkle 3s ease-in-out infinite;
          }
          
          .animate-confetti {
            animation: confetti 5s linear infinite;
          }
          
          .animate-gradient-text {
            background-size: 200% 200%;
            animation: gradient-text 3s ease infinite;
          }
          
          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }
          
          .animate-victory {
            animation: victory 2s ease-in-out infinite;
          }
          
          .animate-shake {
            animation: shake 0.5s ease-in-out infinite;
          }
          
          .animate-match-celebration {
            animation: match-celebration 0.6s ease-in-out;
          }
          
          .animate-emoji-pop {
            animation: emoji-pop 0.6s ease-out;
          }
          
          .lego-brick {
            will-change: transform;
          }
        `}</style>
      </div>
    </div>
  );
};

export default MemoryGame;