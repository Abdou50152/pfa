import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, RotateCcw, Trophy, Star, Play, Pause } from "lucide-react";
import dogSound from '../sounds/dog.mp3';
import catSound from '../sounds/cat.mp3';
import cowSound from '../sounds/cow.mp3';
import birdSound from '../sounds/bird.mp3';
import pigSound from '../sounds/pig.mp3';
import sheepSound from '../sounds/sheep.mp3';
import lionSound from '../sounds/lion.mp3';
import elephantSound from '../sounds/elephant.mp3';

const animals = [
  { 
    name: "Chien", 
    emoji: "🐕", 
    color: "from-amber-400 to-orange-500",
    description: "Fidèle compagnon de l'homme",
    soundFile: dogSound,
    soundPattern: { 
      type: "bark", 
      frequency: [200, 800], 
      duration: 500,
      oscillatorType: "sawtooth",
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.1 }
    }
  },
  { 
    name: "Chat", 
    emoji: "🐱", 
    color: "from-purple-400 to-pink-500",
    description: "Petit félin domestique",
    soundFile: catSound,
    soundPattern: { 
      type: "meow", 
      frequency: [300, 1000], 
      duration: 800,
      oscillatorType: "triangle",
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.2, release: 0.2 }
    }
  },
  { 
    name: "Vache", 
    emoji: "🐄", 
    color: "from-green-400 to-blue-500",
    description: "Animal de la ferme",
    soundFile: cowSound,
    soundPattern: { 
      type: "moo", 
      frequency: [100, 400], 
      duration: 1200,
      oscillatorType: "sine",
      envelope: { attack: 0.1, decay: 0.5, sustain: 0.3, release: 0.3 }
    }
  },
  { 
    name: "Oiseau", 
    emoji: "🐦", 
    color: "from-sky-400 to-indigo-500",
    description: "Créature qui vole dans le ciel",
    soundFile: birdSound,
    soundPattern: { 
      type: "chirp", 
      frequency: [2000, 4000], 
      duration: 300,
      oscillatorType: "sine",
      envelope: { attack: 0.01, decay: 0.05, sustain: 0.01, release: 0.01 }
    }
  },
  { 
    name: "Cochon", 
    emoji: "🐷", 
    color: "from-pink-400 to-rose-500",
    description: "Animal rose de la ferme",
    soundFile: pigSound,
    soundPattern: { 
      type: "oink", 
      frequency: [150, 600], 
      duration: 600,
      oscillatorType: "square",
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.1, release: 0.1 }
    }
  },
  { 
    name: "Mouton", 
    emoji: "🐑", 
    color: "from-gray-300 to-gray-500",
    description: "Animal à la laine blanche",
    soundFile: sheepSound,
    soundPattern: { 
      type: "baa", 
      frequency: [200, 700], 
      duration: 1000,
      oscillatorType: "sine",
      envelope: { attack: 0.1, decay: 0.4, sustain: 0.2, release: 0.3 }
    }
  },
  { 
    name: "Lion", 
    emoji: "🦁", 
    color: "from-yellow-400 to-orange-600",
    description: "Roi de la savane",
    soundFile: lionSound,
    soundPattern: { 
      type: "roar", 
      frequency: [80, 300], 
      duration: 2000,
      oscillatorType: "sawtooth",
      envelope: { attack: 0.2, decay: 0.8, sustain: 0.5, release: 0.5 }
    }
  },
  { 
    name: "Éléphant", 
    emoji: "🐘", 
    color: "from-gray-400 to-gray-600",
    description: "Géant aux grandes oreilles",
    soundFile: elephantSound,
    soundPattern: { 
      type: "trumpet", 
      frequency: [50, 200], 
      duration: 1500,
      oscillatorType: "square",
      envelope: { attack: 0.1, decay: 0.6, sustain: 0.4, release: 0.4 }
    }
  }
];

export default function EnhancedAnimalDetective() {
  const [target, setTarget] = useState(null);
  const [message, setMessage] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [wrongGuesses, setWrongGuesses] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gameMode, setGameMode] = useState('easy');
  const [playedAnimals, setPlayedAnimals] = useState([]);
  const [audioContext, setAudioContext] = useState(null);

  useEffect(() => {
    // Initialize audio context on first user interaction
    const initAudioContext = () => {
      if (!audioContext) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        setAudioContext(ctx);
      }
    };

    document.addEventListener('click', initAudioContext, { once: true });
    return () => document.removeEventListener('click', initAudioContext);
  }, [audioContext]);

  useEffect(() => {
    if (!target) {
      selectNewTarget();
    }
  }, []);

  function selectNewTarget() {
    const availableAnimals = gameMode === 'hard' && playedAnimals.length < animals.length 
      ? animals.filter(animal => !playedAnimals.some(played => played.name === animal.name))
      : animals;
    
    const newTarget = availableAnimals[Math.floor(Math.random() * availableAnimals.length)];
    setTarget(newTarget);
    setWrongGuesses([]);
    setShowHint(false);
    
    if (gameMode === 'hard') {
      setPlayedAnimals(prev => [...prev, newTarget]);
    }
  }

  function playSound() {
    if (!target || !soundEnabled) return;

    setPlaying(true);
    setGameStarted(true);

    if (target.soundFile) {
      const audio = new Audio(target.soundFile);
      audio.play();
      audio.onended = () => setPlaying(false);
    } else {
      if (!audioContext) return;
      const { frequency, duration, oscillatorType, envelope } = target.soundPattern;
      const now = audioContext.currentTime;
      
      // Create oscillator
      const oscillator = audioContext.createOscillator();
      oscillator.type = oscillatorType;
      
      // Create gain node for volume envelope
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(1, now + envelope.attack);
      gainNode.gain.linearRampToValueAtTime(envelope.sustain, now + envelope.attack + envelope.decay);
      gainNode.gain.linearRampToValueAtTime(0, now + duration/1000 - envelope.release);
      
      // Frequency modulation
      oscillator.frequency.setValueAtTime(frequency[0], now);
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency[1], 
        now + duration/2000
      );
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency[0], 
        now + duration/1000
      );
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Start/stop
      oscillator.start(now);
      oscillator.stop(now + duration/1000);
      
      oscillator.onended = () => {
        setPlaying(false);
      };
    }
  }

  function handleGuess(name) {
    if (!gameStarted) {
      setMessage("Écoute d'abord le son ! 🔊");
      return;
    }

    if (name === target.name) {
      const newScore = score + 1;
      const newStreak = streak + 1;
      
      setScore(newScore);
      setStreak(newStreak);
      
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }
      
      setMessage(`🎉 Bravo! +1 point (Série: ${newStreak})`);
      
      setTimeout(() => {
        selectNewTarget();
        setMessage("");
        setGameStarted(false);
      }, 2000);
    } else {
      setStreak(0);
      setWrongGuesses(prev => [...prev, name]);
      
      if (wrongGuesses.length >= 1) {
        setShowHint(true);
        setMessage("💡 Indice activé ! Regarde la description.");
      } else {
        setMessage("❌ Essaie encore ! Tu peux le faire !");
      }
    }
  }

  function resetGame() {
    setScore(0);
    setStreak(0);
    setMessage("");
    setGameStarted(false);
    setWrongGuesses([]);
    setShowHint(false);
    setPlayedAnimals([]);
    selectNewTarget();
  }

  function toggleGameMode() {
    const newMode = gameMode === 'easy' ? 'hard' : 'easy';
    setGameMode(newMode);
    setPlayedAnimals([]);
    resetGame();
  }

  if (!target) return <div>Chargement...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
      <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm border border-white/20">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="text-4xl">🕵️</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Détective Animalier
            </h1>
            <div className="text-4xl">🔍</div>
          </div>
          <p className="text-gray-600 text-lg">Écoute et devine quel animal fait ce son !</p>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-8 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="font-semibold text-gray-700">Score: {score}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-purple-500" />
            <span className="font-semibold text-gray-700">Série: {streak}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-gray-700">Record: {bestStreak}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              gameMode === 'easy' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              Mode: {gameMode === 'easy' ? 'Facile' : 'Difficile'}
            </span>
          </div>
        </div>

        {/* Current Animal Display */}
        <div className="text-center mb-8">
          <div className={`inline-block p-8 rounded-3xl bg-gradient-to-br ${target.color} shadow-xl mb-6 transform transition-all duration-300 ${playing ? 'scale-110 animate-pulse' : ''}`}>
            <div className="text-8xl mb-4">{target.emoji}</div>
            {showHint && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 mt-4">
                <p className="text-gray-700 font-medium">💡 {target.description}</p>
              </div>
            )}
          </div>
          
          {/* Play Sound Button */}
          <button
            onClick={playSound}
            disabled={playing || !soundEnabled}
            className={`px-8 py-4 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-lg ${
              playing 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-green-500 text-white hover:from-blue-600 hover:to-green-600'
            }`}
          >
            <div className="flex items-center gap-3">
              {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              {playing ? "Écoute bien..." : "🔊 Jouer le son"}
            </div>
          </button>
        </div>

        {/* Animal Choices */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {animals.map((animal) => {
            const isWrong = wrongGuesses.includes(animal.name);
            const isCorrect = gameStarted && message.includes("Bravo") && animal.name === target.name;
            
            return (
              <button
                key={animal.name}
                onClick={() => handleGuess(animal.name)}
                disabled={isWrong}
                className={`p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  isWrong 
                    ? 'border-red-300 bg-red-50 opacity-50 cursor-not-allowed' 
                    : isCorrect
                    ? 'border-green-400 bg-green-100 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-lg'
                }`}
              >
                <div className="text-4xl mb-2">{animal.emoji}</div>
                <p className={`font-semibold ${
                  isWrong ? 'text-red-400' : isCorrect ? 'text-green-600' : 'text-gray-700'
                }`}>
                  {animal.name}
                </p>
              </button>
            );
          })}
        </div>

        {/* Message Display */}
        {message && (
          <div className={`text-center p-4 rounded-2xl mb-6 font-bold text-lg ${
            message.includes("Bravo") 
              ? 'bg-green-100 text-green-800' 
              : message.includes("Indice")
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {message}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={resetGame}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <RotateCcw className="w-5 h-5" />
            Nouvelle partie
          </button>
          
          <button
            onClick={toggleGameMode}
            className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <Trophy className="w-5 h-5" />
            Mode {gameMode === 'easy' ? 'Difficile' : 'Facile'}
          </button>
          
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg ${
              soundEnabled 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            Son {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Game Mode Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center">
          <p className="text-sm text-gray-600">
            <strong>Mode Facile:</strong> Animaux aléatoires • <strong>Mode Difficile:</strong> Chaque animal une seule fois
          </p>
        </div>
      </div>
    </div>
  );
}