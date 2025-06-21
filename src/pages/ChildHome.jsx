import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const ChildHome = () => {
  const [activeTitle, setActiveTitle] = useState(0);
  const titles = [
    {
      text: "Bienvenue petits héros!  🦸🏻‍♂",
      gradient: "from-purple-600 to-blue-600"
    },
    {
      text: "Bienvenue petites héroïnes! 🦸🏻‍♀ ",
      gradient: "from-pink-600 to-purple-600"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTitle(prev => (prev + 1) % titles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Sparkle background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute text-white opacity-70"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 10 + 10}px`,
              animation: `sparkle ${Math.random() * 3 + 2}s infinite ${Math.random() * 2}s`,
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          >
            ✨
          </div>
        ))}
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-16 h-16 bg-yellow-300 rounded-full opacity-70 animate-bounce delay-1000"></div>
        <div className="absolute top-20 right-16 w-12 h-12 bg-pink-300 rounded-full opacity-60 animate-pulse delay-500"></div>
        <div className="absolute bottom-20 left-20 w-20 h-20 bg-blue-300 rounded-full opacity-50 animate-bounce delay-300"></div>
        <div className="absolute bottom-32 right-12 w-14 h-14 bg-green-300 rounded-full opacity-60 animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-8 w-8 h-8 bg-orange-300 rounded-full opacity-80 animate-bounce delay-1200"></div>
        <div className="absolute top-1/3 right-6 w-10 h-10 bg-indigo-300 rounded-full opacity-70 animate-pulse delay-200"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <div className="mb-8 h-28 md:h-40 flex items-center justify-center">
          {titles.map((title, index) => (
            <h1
              key={index}
              className={`absolute text-5xl md:text-7xl font-black text-white mb-4 drop-shadow-2xl bg-gradient-to-r ${title.gradient} bg-clip-text text-transparent transition-all duration-1000 ease-in-out ${
                activeTitle === index
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
            >
              {title.text}
            </h1>
          ))}
          <div className="w-32 h-1 bg-gradient-to-r from-yellow-400 to-pink-400 mx-auto rounded-full shadow-lg absolute bottom-0" />
        </div>
        
        <p className="text-xl md:text-2xl text-white font-semibold mb-12 drop-shadow-lg bg-white bg-opacity-10 rounded-full py-3 px-6 backdrop-blur-sm border border-white border-opacity-20">
          Choisis une super activité pour t'amuser et apprendre ! ✨
        </p>
        
        <div className="grid md:grid-cols-3 gap-8 px-4">
          <Link
            to="/learn"
            className="group relative bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-8 px-6 rounded-3xl shadow-2xl transform hover:scale-110 hover:rotate-1 transition-all duration-500 ease-out flex flex-col items-center justify-center overflow-hidden border-2 border-white border-opacity-20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
            <div className="absolute inset-0 rounded-3xl border-2 border-white border-opacity-0 group-hover:border-opacity-30 transition-all duration-500"></div>
            <div className="relative z-10">
              <span className="text-6xl mb-4 block transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500">🔤</span>
              <span className="text-xl md:text-2xl font-extrabold tracking-wide">Apprendre les Lettres</span>
              <div className="w-16 h-1 bg-white bg-opacity-50 mx-auto mt-3 rounded-full group-hover:bg-opacity-80 transition-all duration-300"></div>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-300 rounded-full animate-ping opacity-70"></div>
          </Link>
          
          <Link
            to="/story"
            className="group relative bg-gradient-to-br from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-bold py-8 px-6 rounded-3xl shadow-2xl transform hover:scale-110 hover:rotate-1 transition-all duration-500 ease-out flex flex-col items-center justify-center overflow-hidden border-2 border-white border-opacity-20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
            <div className="absolute inset-0 rounded-3xl border-2 border-white border-opacity-0 group-hover:border-opacity-30 transition-all duration-500"></div>
            <div className="relative z-10">
              <span className="text-6xl mb-4 block transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500">📖</span>
              <span className="text-xl md:text-2xl font-extrabold tracking-wide">Écouter une Histoire</span>
              <div className="w-16 h-1 bg-white bg-opacity-50 mx-auto mt-3 rounded-full group-hover:bg-opacity-80 transition-all duration-300"></div>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-300 rounded-full animate-ping opacity-70"></div>
          </Link>
          
          <Link
            to="/room-organizer"
            className="group relative bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-8 px-6 rounded-3xl shadow-2xl transform hover:scale-110 hover:rotate-1 transition-all duration-500 ease-out flex flex-col items-center justify-center overflow-hidden border-2 border-white border-opacity-20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
            <div className="absolute inset-0 rounded-3xl border-2 border-white border-opacity-0 group-hover:border-opacity-30 transition-all duration-500"></div>
            <div className="relative z-10">
              <span className="text-6xl mb-4 block transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500">🧸</span>
              <span className="text-xl md:text-2xl font-extrabold tracking-wide">Ranger ma Chambre</span>
              <div className="w-16 h-1 bg-white bg-opacity-50 mx-auto mt-3 rounded-full group-hover:bg-opacity-80 transition-all duration-300"></div>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-300 rounded-full animate-ping opacity-70"></div>
          </Link>
        </div>
      </div>
      
      {/* Floating hearts animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute text-pink-400 opacity-70"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 20 + 10}px`,
              animation: `float ${Math.random() * 10 + 5}s infinite ${Math.random() * 5}s`,
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          >
            ❤
          </div>
        ))}
      </div>
      
      {/* Floating stars animation */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 text-yellow-300 text-2xl animate-pulse delay-100">⭐</div>
        <div className="absolute top-3/4 right-1/3 text-pink-300 text-xl animate-pulse delay-300">✨</div>
        <div className="absolute bottom-1/4 left-1/3 text-blue-300 text-lg animate-pulse delay-500">🌟</div>
        <div className="absolute top-1/3 right-1/4 text-purple-300 text-2xl animate-pulse delay-700">⭐</div>
      </div>
      
      {/* Animations */}
      <style>{`
        @keyframes sparkle {
          0% { opacity: 0.3; transform: scale(0.5) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
          100% { opacity: 0.3; transform: scale(0.5) rotate(360deg); }
        }
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
          100% { transform: translateY(0) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ChildHome;