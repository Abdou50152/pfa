import React, { useState, useEffect } from "react";
import { Trash2, Undo2, Volume2, Sparkles, BookOpen } from "lucide-react";

const words = [
  "Un", "jour", "le", "chat", "a", "vu", "une", "souris", "qui", "courait", "vite",
  "Il", "a", "décidé", "de", "jouer", "avec", "elle", "dans", "le", "jardin",
  "Soudain", "la", "petite", "bête", "s'est", "cachée", "sous", "un", "arbre",
  "Alors", "notre", "ami", "félin", "a", "commencé", "à", "chercher", "partout"
];

const wordCategories = {
  "Un": "article",
  "le": "article", 
  "la": "article",
  "une": "article",
  "un": "article",
  "chat": "noun",
  "souris": "noun",
  "jardin": "noun",
  "arbre": "noun",
  "bête": "noun",
  "ami": "noun",
  "jour": "noun",
  "a": "verb",
  "vu": "verb",
  "courait": "verb",
  "décidé": "verb",
  "jouer": "verb",
  "cachée": "verb",
  "commencé": "verb",
  "chercher": "verb",
  "qui": "pronoun",
  "elle": "pronoun",
  "notre": "pronoun",
  "avec": "preposition",
  "dans": "preposition",
  "sous": "preposition",
  "vite": "adverb",
  "partout": "adverb",
  "Soudain": "adverb",
  "Alors": "adverb",
  "petite": "adjective",
  "félin": "adjective",
  "s'est": "verb",
  "de": "preposition"
};

const categoryColors = {
  "noun": "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
  "verb": "bg-green-100 text-green-800 border-green-200 hover:bg-green-200", 
  "adjective": "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
  "adverb": "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200",
  "pronoun": "bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200",
  "article": "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200",
  "preposition": "bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200"
};

export default function EnhancedStoryBuilder() {
  const [story, setStory] = useState([]);
  const [history, setHistory] = useState([]);
  const [isReading, setIsReading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  function addWord(word) {
    setHistory([...history, [...story]]);
    setStory([...story, word]);
  }

  function removeLastWord() {
    if (story.length > 0) {
      setHistory([...history, [...story]]);
      setStory(story.slice(0, -1));
    }
  }

  function undoLastAction() {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setStory(previousState);
      setHistory(history.slice(0, -1));
    }
  }

  function resetStory() {
    if (story.length > 0) {
      setHistory([...history, [...story]]);
      setStory([]);
    }
  }

  function readStory() {
    if ('speechSynthesis' in window && story.length > 0) {
      setIsReading(true);
      const utterance = new SpeechSynthesisUtterance(story.join(" "));
      utterance.lang = 'fr-FR';
      utterance.rate = 0.8;
      utterance.onend = () => setIsReading(false);
      speechSynthesis.speak(utterance);
    }
  }

  function stopReading() {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsReading(false);
    }
  }

  const wordCount = story.length;
  const storyText = story.join(" ");

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Constructeur d'Histoires
            </h1>
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-gray-600 text-lg">Crée ton histoire en français mot par mot !</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
          <button
            onClick={() => setShowCategories(!showCategories)}
            className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
              showCategories 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showCategories ? 'Masquer les catégories' : 'Afficher les catégories'}
          </button>
          
          <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {wordCount} mot{wordCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Category Legend */}
        {showCategories && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Légende des catégories :</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">Noms</span>
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-800">Verbes</span>
              <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800">Adjectifs</span>
              <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-800">Adverbes</span>
              <span className="px-2 py-1 rounded-full bg-pink-100 text-pink-800">Pronoms</span>
              <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">Articles</span>
              <span className="px-2 py-1 rounded-full bg-teal-100 text-teal-800">Prépositions</span>
            </div>
          </div>
        )}

        {/* Word Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Choisis tes mots :</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {words.map((word, i) => {
              const category = wordCategories[word] || "other";
              const colorClass = categoryColors[category] || "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200";
              
              return (
                <button
                  key={i}
                  onClick={() => addWord(word)}
                  className={`px-4 py-2 rounded-full font-medium border-2 transition-all duration-200 transform hover:scale-105 hover:shadow-md ${colorClass}`}
                >
                  {word}
                </button>
              );
            })}
          </div>
        </div>

        {/* Story Display */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Ton histoire :</h3>
          <div className="min-h-[120px] p-6 border-2 border-dashed border-gray-300 rounded-xl text-left bg-gradient-to-r from-gray-50 to-blue-50 relative overflow-hidden">
            {story.length > 0 ? (
              <div className="relative z-10">
                <p className="text-lg leading-relaxed text-gray-800 font-medium">
                  {storyText}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-lg italic">
                  Ton histoire magique apparaîtra ici... ✨
                </p>
              </div>
            )}
            
            {/* Decorative elements */}
            <div className="absolute top-2 right-2 text-6xl opacity-5">📚</div>
            <div className="absolute bottom-2 left-2 text-4xl opacity-5">✨</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={isReading ? stopReading : readStory}
            disabled={story.length === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 ${
              story.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isReading
                ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
                : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
            }`}
          >
            <Volume2 className="w-5 h-5" />
            {isReading ? 'Arrêter' : 'Lire l\'histoire'}
          </button>

          <button
            onClick={removeLastWord}
            disabled={story.length === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 ${
              story.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg'
            }`}
          >
            <Undo2 className="w-5 h-5" />
            Retirer le dernier
          </button>

          <button
            onClick={undoLastAction}
            disabled={history.length === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 ${
              history.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg'
            }`}
          >
            <Undo2 className="w-5 h-5" />
            Annuler
          </button>

          <button
            onClick={resetStory}
            disabled={story.length === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 ${
              story.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
            }`}
          >
            <Trash2 className="w-5 h-5" />
            Recommencer
          </button>
        </div>
      </div>
    </div>
  );
}