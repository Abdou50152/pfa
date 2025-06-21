import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBook, FiMic, FiMicOff, FiPlay, FiPause, FiTrash2, FiVolume2, FiVolumeX, 
  FiChevronRight, FiStar, FiAward, FiHeart, FiClock, FiCheck 
} from 'react-icons/fi';


// Premium Particle background with dynamic color transitions
const ParticleBackground = () => {
  const colors = [
    'from-indigo-200/40 via-purple-200/30 to-pink-200/20',
    'from-blue-200/40 via-cyan-200/30 to-teal-200/20',
    'from-amber-200/40 via-orange-200/30 to-red-200/20'
  ];
  
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {[...Array(80)].map((_, i) => {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 15 + 5;
        const delay = Math.random() * 5;
        
        return (
          <motion.div
            key={i}
            className={`absolute rounded-full bg-gradient-to-br ${color}`}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              width: size,
              height: size,
              opacity: Math.random() * 0.5 + 0.1,
            }}
            animate={{
              y: [0, Math.random() * 300 - 150],
              x: [0, Math.random() * 300 - 150],
              rotate: [0, Math.random() * 360],
              transition: {
                delay,
                duration: Math.random() * 20 + 15,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }
            }}
          />
        );
      })}
    </div>
  );
};

// Premium recording button with dynamic pulse effect
const RecordingButton = ({ isRecording, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-full p-1 ${isRecording ? 
        'bg-gradient-to-br from-red-500 to-pink-600 shadow-lg shadow-red-300/50' : 
        'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-300/50'}`}
      style={{
        boxShadow: isRecording ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 0 20px rgba(59, 130, 246, 0.3)'
      }}
    >
      <div className="relative z-10 p-4 text-white">
        {isRecording ? <FiMicOff size={28} /> : <FiMic size={28} />}
      </div>
      {isRecording && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full bg-red-400/70"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.7, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-white/20"
            animate={{
              scale: [1, 2],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.5
            }}
          />
        </>
      )}
      {!isRecording && (
        <motion.div
          className="absolute inset-0 rounded-full bg-white/10"
          whileHover={{
            opacity: 0.2,
            transition: { duration: 0.2 }
          }}
        />
      )}
    </motion.button>
  );
};

// Premium floating emoji with more organic movement
const FloatingEmoji = ({ emoji, size = 'text-5xl' }) => {
  return (
    <motion.div
      className={`${size} inline-block`}
      animate={{
        y: [0, -15, -5, 0, -10, 0],
        rotate: [0, 5, -3, 2, -1, 0],
        scale: [1, 1.05, 0.98, 1.02, 1],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {emoji}
    </motion.div>
  );
};

// Premium 3D Card with glass morphism effect
const StoryCard = ({ story, isSelected, onClick }) => {
  return (
    <motion.div
      whileHover={{ 
        y: -10, 
        scale: 1.02,
        boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.25)'
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative cursor-pointer rounded-3xl p-6 transition-all duration-300 ${isSelected ? 
        'bg-gradient-to-br from-white/70 to-white/50 backdrop-blur-lg border-2 border-white/40 shadow-2xl' : 
        'bg-white/80 backdrop-blur-sm border border-white/40 shadow-lg hover:shadow-xl'}`}
      style={{
        transformStyle: 'preserve-3d',
        transform: isSelected ? 'perspective(1000px) rotateY(5deg) translateZ(30px)' : 'perspective(1000px)',
        boxShadow: isSelected ? '0 30px 60px -15px rgba(59, 130, 246, 0.4)' : '0 15px 30px -5px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="flex flex-col items-center">
        <FloatingEmoji emoji={story.emoji} />
        <h2 className="mt-4 text-xl font-bold text-gray-800">{story.title}</h2>
        <motion.div 
          className="mt-4 flex items-center text-blue-600 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: isSelected ? 1 : 0 }}
        >
          Read story <FiChevronRight className="ml-1" />
        </motion.div>
      </div>
      {isSelected && (
        <>
          <motion.div
            className="absolute -bottom-2 left-1/2 h-2 w-4/5 -translate-x-1/2 rounded-full bg-blue-400/50 blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div 
            className="absolute -inset-1 rounded-3xl border-2 border-blue-300/50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div 
            className="absolute -inset-0.5 rounded-[22px] bg-blue-100/20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 0.3 }}
          />
        </>
      )}
    </motion.div>
  );
};

// Enhanced audio visualizer with dynamic gradient bars
const AudioVisualizer = ({ isPlaying, audioRef }) => {
  const [heights, setHeights] = useState(Array(24).fill(2));
  const requestRef = useRef();
  const analyserRef = useRef();
  const dataArrayRef = useRef();
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current || !isPlaying) {
      cancelAnimationFrame(requestRef.current);
      setHeights(Array(24).fill(2));
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;

    // ⚠ Si déjà connecté, ne pas recréer la source
    if (!sourceNodeRef.current || sourceNodeRef.current.mediaElement !== audioRef.current) {
      sourceNodeRef.current = audioContext.createMediaElementSource(audioRef.current);
      sourceNodeRef.current.connect(audioContext.destination);
    }

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    analyserRef.current = analyser;

    sourceNodeRef.current.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);

    const updateVisualizer = () => {
      analyser.getByteFrequencyData(dataArrayRef.current);

      const newHeights = Array(24).fill(0).map((_, i) => {
        const value = dataArrayRef.current[i % bufferLength] / 255;
        return Math.max(2, value * 50 * (0.7 + Math.random() * 0.6));
      });

      setHeights(newHeights);
      requestRef.current = requestAnimationFrame(updateVisualizer);
    };

    requestRef.current = requestAnimationFrame(updateVisualizer);

    return () => {
      cancelAnimationFrame(requestRef.current);
      if (analyser) analyser.disconnect();
    };
  }, [isPlaying, audioRef]);

  return (
    <div className="flex items-end justify-center h-20 gap-1.5">
      {heights.map((height, i) => (
        <motion.div
          key={i}
          className="w-2 rounded-t-sm"
          animate={{ height }}
          transition={{ duration: 0.1 }}
          style={{
            height: 2,
            background: `linear-gradient(to top, 
              ${i % 3 === 0 ? '#3b82f6' :
                i % 3 === 1 ? '#8b5cf6' : '#ec4899'}, 
              ${i % 2 === 0 ? '#6366f1' : '#f43f5e'})`,
            boxShadow: `0 2px 8px ${i % 3 === 0 ? 'rgba(59, 130, 246, 0.4)' :
              i % 3 === 1 ? 'rgba(139, 92, 246, 0.4)' : 'rgba(236, 72, 153, 0.4)'}`
          }}
        />
      ))}
    </div>
  );
};


// Premium recording timer with dynamic glow effect
const RecordingTimer = ({ isRecording }) => {
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef();

  useEffect(() => {
    if (isRecording) {
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setSeconds(0);
    }

    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      className="flex items-center justify-center"
      animate={isRecording ? { 
        scale: [1, 1.05, 1],
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="relative">
        <motion.div 
          className="absolute inset-0 bg-red-500 rounded-full opacity-20 blur-lg"
          animate={isRecording ? {
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2]
          } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div 
          className="absolute inset-0 bg-white rounded-full opacity-10 blur-sm"
          animate={isRecording ? {
            scale: [1, 1.5, 1],
            opacity: [0.1, 0.3, 0.1]
          } : {}}
          transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
        />
        <div className="relative z-10 px-5 py-2.5 text-lg font-mono font-bold text-white bg-gradient-to-r from-red-500 to-pink-600 rounded-full border border-red-300/50 shadow-inner">
          {formatTime(seconds)}
          {isRecording && (
            <motion.span
              className="ml-2 inline-block w-2 h-2 bg-white rounded-full"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Premium rating component
const RatingStars = ({ rating }) => {
  return (
    <div className="flex items-center justify-center mt-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStar
          key={star}
          className={`${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} mx-0.5`}
          size={16}
        />
      ))}
    </div>
  );
};

// Enhanced mock data for stories with ratings and difficulty
const stories = [
  {
    id: 1,
    title: "Le Petit Chaperon Rouge",
    emoji: "👧🌲🐺🧺",
    content: `Il était une fois une petite fille que tout le monde appelait le Petit Chaperon Rouge, car elle portait toujours un joli chaperon de cette couleur offert par sa grand-mère. Un jour, sa maman lui dit : "Va porter cette galette et ce petit pot de beurre à ta grand-mère qui est malade. Prends bien garde de ne pas t’arrêter en chemin." 

Le Petit Chaperon Rouge partit à travers la forêt. En chemin, elle rencontra le loup, qui lui demanda où elle allait. "Je vais chez ma grand-mère", répondit-elle. Le loup, rusé, proposa une course : lui prendrait le chemin le plus court, et elle le plus long, pour voir qui arriverait le premier.

Le loup arriva le premier chez la grand-mère, frappa à la porte, entra et dévora la vieille dame. Puis il enfila son bonnet, se coucha dans le lit et attendit la fillette. Quand le Petit Chaperon Rouge arriva, elle trouva sa "grand-mère" bien changée : "Ma mère-grand, que vous avez de grands bras ! — C’est pour mieux t’embrasser, mon enfant. — Ma mère-grand, que vous avez de grandes jambes ! — C’est pour mieux courir, mon enfant. — Ma mère-grand, que vous avez de grandes oreilles ! — C’est pour mieux t’entendre, mon enfant. — Ma mère-grand, que vous avez de grands yeux ! — C’est pour mieux te voir, mon enfant. — Ma mère-grand, que vous avez de grandes dents ! — C’est pour mieux te manger !" Et le loup se jeta sur elle et la dévora aussi.

Heureusement, un chasseur qui passait par là entendit du bruit, entra, tua le loup et sauva la grand-mère et la fillette. Depuis ce jour, le Petit Chaperon Rouge promit de toujours écouter sa maman et de ne plus parler aux inconnus dans la forêt.`,
    rating: 4,
    difficulty: "Facile",
    length: "5 min"
  },

    {
      id: 2,
      title: "Les Trois Petits Cochons",
      emoji: "🐷🐷🐷🏠",
      content: `Il était une fois trois petits cochons qui décidèrent de quitter leur maison pour construire chacun leur propre demeure. Le premier cochon construisit une maison en paille, le second une maison en bois, et le troisième, plus travailleur, une maison en briques.
    
    Un jour, le grand méchant loup arriva devant la maison de paille. Il souffla, souffla, et la maison s'envola ! Le petit cochon courut se réfugier chez son frère, dans la maison de bois. Mais le loup arriva, souffla, souffla, et la maison de bois s'effondra aussi. Les deux cochons effrayés coururent chez leur frère, dans la solide maison de briques.
    
    Le loup arriva, souffla de toutes ses forces, mais la maison ne bougea pas. Furieux, il tenta de passer par la cheminée, mais le troisième cochon avait fait bouillir une grande marmite d’eau. Le loup tomba dedans et s’enfuit, brûlé, sans jamais revenir.
    
    Les trois petits cochons vécurent heureux et en sécurité dans leur belle maison de briques, ayant appris qu’il vaut mieux travailler dur pour être à l’abri du danger.`,
      rating: 5,
      difficulty: "Moyen",
      length: "7 min"
    },    
    {
      id: 3,
      title: "Le Lion et la Souris",
      emoji: "🦁🌿🐭🧵",
      content: `Un lion dormait paisiblement dans la jungle lorsqu'une petite souris, en jouant, courut sur son nez. Le lion se réveilla en sursaut et attrapa la souris. "Pardonne-moi, roi des animaux," implora la souris. "Si tu me laisses partir, un jour je te rendrai la pareille." Le lion rit à l'idée qu'une si petite créature puisse l'aider, mais il la laissa partir.
    
    Quelques jours plus tard, le lion fut pris au piège dans un filet tendu par des chasseurs. Il rugit si fort que la petite souris l'entendit. Elle accourut, rongea les cordes du filet avec ses petites dents et libéra le lion. "Tu vois," dit la souris, "je t'avais promis de t'aider un jour !"
    
    Le lion remercia la souris et ils devinrent amis pour la vie. Ainsi, même les plus petits peuvent aider les plus grands.`,
      rating: 3,
      difficulty: "Facile",
      length: "4 min"
    }
    
];

const StoryTeller = () => {
  const [selectedStory, setSelectedStory] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayerRef = useRef(null);

  // Load available voices
  useEffect(() => {
    const synth = window.speechSynthesis;
    
    const loadVoices = () => {
      const voices = synth.getVoices();
      setAvailableVoices(voices);
    };
    
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
    
    loadVoices();
    
    return () => {
      if (synth.speaking) {
        synth.cancel();
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  // Handle audio player events
  useEffect(() => {
    const audioPlayer = audioPlayerRef.current;
    if (!audioPlayer) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnd = () => setIsPlaying(false);

    audioPlayer.addEventListener('play', handlePlay);
    audioPlayer.addEventListener('pause', handlePause);
    audioPlayer.addEventListener('ended', handleEnd);

    return () => {
      audioPlayer.removeEventListener('play', handlePlay);
      audioPlayer.removeEventListener('pause', handlePause);
      audioPlayer.removeEventListener('ended', handleEnd);
    };
  }, [audioUrl]);

  const handleSelectStory = (story) => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    
    if (audioPlayerRef.current && !audioPlayerRef.current.paused) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    }
    
    setSelectedStory(story);
  };
  
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        setHasRecording(true);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Impossible d\'accéder au microphone. Veuillez vérifier les permissions de votre navigateur.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const togglePlayRecording = () => {
    const audioPlayer = audioPlayerRef.current;
    if (!audioPlayer) return;
    
    if (audioPlayer.paused) {
      audioPlayer.play();
    } else {
      audioPlayer.pause();
    }
  };
  
  const deleteRecording = () => {
    if (audioPlayerRef.current && !audioPlayerRef.current.paused) {
      audioPlayerRef.current.pause();
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioBlob(null);
    setAudioUrl('');
    setHasRecording(false);
    setIsPlaying(false);
  };
  
  const handleSpeak = () => {
    const synth = window.speechSynthesis;
    
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }
    
    if (!selectedStory) return;
    
    const utterance = new SpeechSynthesisUtterance(selectedStory.content);
    
    const frenchVoice = availableVoices.find(voice => 
      voice.lang.includes('fr') ||
      voice.name.toLowerCase().includes('français') ||
      voice.name.toLowerCase().includes('french')
    );
    
    if (frenchVoice) {
      utterance.voice = frenchVoice;
      utterance.lang = frenchVoice.lang;
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synth.speak(utterance);
  };

  return (
    <div className="relative min-h-screen p-6 bg-gradient-to-br from-blue-50/30 to-purple-50/30 overflow-hidden">
      <ParticleBackground />
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-6xl mx-auto"
      >
        <div className="flex flex-col items-center mb-12">
          <motion.div
            whileHover={{ rotate: 5, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="mb-4"
          >
            <FiBook className="text-6xl text-indigo-500 drop-shadow-lg" />
          </motion.div>
          <h1 className="text-5xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-600">
            L'Heure du Conte
          </h1>
          <p className="text-gray-600 text-lg text-center max-w-2xl">
            Choisissez une histoire et laissez-vous emporter dans un monde magique de narration
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              isSelected={selectedStory?.id === story.id}
              onClick={() => handleSelectStory(story)}
            />
          ))}
        </div>

        <motion.div
          layout
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {selectedStory ? (
              <motion.div
                key="story-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="p-8"
              >
                <div className="flex items-start mb-6">
                  <div className="text-5xl mr-6">
                    <FloatingEmoji emoji={selectedStory.emoji} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-800">{selectedStory.title}</h2>
                    <div className="w-20 h-1 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full mt-2 mb-4"></div>
                    
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <FiAward className="mr-1 text-amber-500" /> 
                        <span className="font-medium">{selectedStory.difficulty}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FiClock className="mr-1 text-blue-500" /> 
                        <span className="font-medium">{selectedStory.length}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <RatingStars rating={selectedStory.rating} />
                      </div>
                    </div>
                  </div>
                </div>
                
                <motion.div
                  className="text-gray-700 leading-relaxed text-lg bg-white/50 p-8 rounded-xl border border-white/40 mb-8 shadow-inner"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="mb-4">{selectedStory.content}</p>
                  <div className="text-center py-4">
                    <motion.div
                      className="inline-block px-4 py-2 bg-indigo-100/50 text-indigo-600 rounded-full text-sm font-medium"
                      animate={{ 
                        scale: [1, 1.05, 1],
                        opacity: [0.8, 1, 0.8]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity
                      }}
                    >
                      La suite de l'histoire arrive bientôt...
                    </motion.div>
                  </div>
                </motion.div>

                {/* Premium Recording Section */}
                <div className="bg-gradient-to-br from-indigo-50/50 to-pink-50/50 rounded-2xl p-8 mb-8 border border-white/40 shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>
                  
                  <h3 className="text-xl font-bold mb-6 text-gray-700 flex items-center">
                    <FiMic className="mr-2 text-indigo-500" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-600">
                      Enregistrer votre narration
                    </span>
                  </h3>
                  
                  <div className="flex flex-col items-center gap-8">
                    {isRecording ? (
                      <motion.div 
                        className="w-full flex flex-col items-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <RecordingTimer isRecording={isRecording} />
                        <div className="mt-4">
                          <RecordingButton isRecording={true} onClick={stopRecording} />
                        </div>
                        <motion.p 
                          className="mt-4 text-sm text-gray-500 font-medium"
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          Enregistrement en cours...
                        </motion.p>
                      </motion.div>
                    ) : (
                      <motion.div 
                        className="flex flex-col items-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <RecordingButton 
                          isRecording={false} 
                          onClick={startRecording} 
                          disabled={isPlaying}
                        />
                        <p className="mt-4 text-sm text-gray-500 font-medium">
                          Cliquez pour commencer l'enregistrement
                        </p>
                      </motion.div>
                    )}
                    
                    {hasRecording && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-md"
                      >
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/40 relative">
                          {showSuccess && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg flex items-center"
                            >
                              <FiCheck className="mr-1" /> Enregistrement réussi!
                            </motion.div>
                          )}
                          <AudioVisualizer isPlaying={isPlaying} audioRef={audioPlayerRef} />
                          <audio 
                            ref={audioPlayerRef} 
                            src={audioUrl} 
                            className="w-full mt-6 rounded-lg"
                            controls
                          />
                          <div className="flex justify-center gap-4 mt-6">
                            <motion.button
                              whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(139, 92, 246, 0.3)" }}
                              whileTap={{ scale: 0.95 }}
                              onClick={togglePlayRecording}
                              className={`flex items-center gap-2 px-6 py-2.5 rounded-full ${isPlaying ? 
                                'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-200' : 
                                'bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-700 border border-indigo-200'}`}
                            >
                              {isPlaying ? <FiPause /> : <FiPlay />}
                              {isPlaying ? 'Pause' : 'Écouter'}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(239, 68, 68, 0.3)" }}
                              whileTap={{ scale: 0.95 }}
                              onClick={deleteRecording}
                              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-red-100 to-red-50 text-red-700 rounded-full border border-red-200"
                            >
                              <FiTrash2 />
                              Supprimer
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Premium Text-to-speech button */}
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: isSpeaking ? 
                        "0 5px 20px rgba(239, 68, 68, 0.4)" : 
                        "0 5px 20px rgba(99, 102, 241, 0.4)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSpeak}
                    className={`flex items-center gap-3 px-8 py-3.5 rounded-full text-white ${isSpeaking ? 
                      'bg-gradient-to-br from-red-500 to-pink-600 shadow-lg shadow-red-200' : 
                      'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-200'}`}
                  >
                    {isSpeaking ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
                    {isSpeaking ? 'Arrêter la lecture' : 'Lecture automatique'}
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="no-story"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="p-12 text-center"
              >
                <motion.div
                  animate={{ 
                    y: [0, -20, -10, 0],
                    rotate: [0, 10, -5, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="text-7xl mb-6"
                >
                  📚
                </motion.div>
                <h3 className="text-2xl font-medium text-gray-700 mb-2">
                  Choisis une histoire à écouter !
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Sélectionne une des histoires ci-dessus pour découvrir un monde magique de narration et enregistre ta propre version !
                </p>
                <motion.div 
                  className="mt-8 flex justify-center"
                  animate={{
                    x: [0, 10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  <div className="w-12 h-1.5 bg-indigo-400 rounded-full"></div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Premium Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>© 2023 L'Heure du Conte - Tous droits réservés</p>
          <div className="flex justify-center mt-2 gap-4">
            <motion.a 
              href="#" 
              className="hover:text-indigo-600"
              whileHover={{ y: -2 }}
            >
              Conditions d'utilisation
            </motion.a>
            <motion.a 
              href="#" 
              className="hover:text-indigo-600"
              whileHover={{ y: -2 }}
            >
              Politique de confidentialité
            </motion.a>
            <motion.a 
              href="#" 
              className="hover:text-indigo-600"
              whileHover={{ y: -2 }}
            >
              Contact
            </motion.a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StoryTeller;
