import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../images/logo.png"; // Import du logo PNG depuis le dossier images

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md relative z-30 w-full">
      <nav className="container mx-auto py-2 px-4">
        <div className="flex justify-between items-center h-12">
          {/* Logo à gauche */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center font-bold hover:text-yellow-200">
              <img src={logo} alt="Logo Smart Kid" className="h-10 w-auto mr-2" />
              {/* <span className="hidden sm:inline text-lg">Smart Kid</span> */}
            </Link>
          </div>

          {/* Liens Enfant et Maman à droite + icône menu */}
          <div className="flex items-center gap-4">
            <Link to="/" className="font-bold hover:text-yellow-200">
              <span role="img" aria-label="enfant" className="mr-1">👶</span> Enfant
            </Link>
            <Link to="/parent" className="font-bold hover:text-yellow-200">
              <span role="img" aria-label="maman" className="mr-1">👩</span> Maman
            </Link>

            {/* Bouton hamburger pour le menu */}
            <button 
              onClick={toggleMenu} 
              className="p-1 rounded hover:bg-purple-700 focus:outline-none"
              aria-label="Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Menu déroulant pour les autres liens */}
        {menuOpen && (
          <div className="mt-2 py-2 bg-purple-700 rounded-lg shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* Learning activities */}
              <div className="px-4 py-2">
                <h3 className="text-yellow-200 font-semibold border-b border-purple-500 pb-1 mb-2">Activités</h3>
                <div className="flex flex-col gap-2">
                  <Link to="/story" className="hover:text-yellow-200" onClick={handleLinkClick}>
                    <span role="img" aria-label="histoire" className="mr-2">📖</span> Histoire
                  </Link>
                  <Link to="/learn" className="hover:text-yellow-200" onClick={handleLinkClick}>
                    <span role="img" aria-label="lettres" className="mr-2">🔤</span> Lettres
                  </Link>
                  <Link to="/draw" className="hover:text-yellow-200" onClick={handleLinkClick}>
                    <span role="img" aria-label="dessiner" className="mr-2">🎨</span> Dessiner
                  </Link>
                  <Link to="/memory-game" className="hover:text-yellow-200" onClick={handleLinkClick}>
                    <span role="img" aria-label="memory game" className="mr-2">🧠</span> Jeu de Mémoire
                  </Link>
                </div>
              </div>
              
              {/* Organization tools */}
              <div className="px-4 py-2">
                <h3 className="text-yellow-200 font-semibold border-b border-purple-500 pb-1 mb-2">Organisation</h3>
                <div className="flex flex-col gap-2">
                  <Link to="/room-organizer" className="hover:text-yellow-200" onClick={handleLinkClick}>
                    <span role="img" aria-label="chambre" className="mr-2">🧸</span> Chambre
                  </Link>
                  <Link to="/lego-sorting" className="hover:text-yellow-200" onClick={handleLinkClick}>
                    <span role="img" aria-label="lego" className="mr-2">🧩</span> Lego
                  </Link>
                  <Link to="/photo-detection" className="hover:text-yellow-200" onClick={handleLinkClick}>
                    <span role="img" aria-label="tri" className="mr-2">📸</span> Explorateur d'objets
                  </Link>
                  <Link to="/animal-sound" className="hover:text-yellow-200" onClick={handleLinkClick}>
                    <span role="img" aria-label="tri" className="mr-2">🔊</span> Les sons d'animaux
                  </Link>
                </div>
              </div>
              
              {/* Detection tools */}
              {/* <div className="px-4 py-2">
                <h3 className="text-yellow-200 font-semibold border-b border-purple-500 pb-1 mb-2">Détection</h3>
                <div className="flex flex-col gap-2">
                  <Link to="/photo-detection" className="hover:text-yellow-200">
                    <span role="img" aria-label="photo" className="mr-2">📷</span> Photo
                  </Link>
                  <Link to="/scan-box" className="hover:text-yellow-200">
                    <span role="img" aria-label="boites" className="mr-2">📦</span> Boîtes
                  </Link>
                  <Link to="/voice-search" className="hover:text-yellow-200">
                    <span role="img" aria-label="voix" className="mr-2">🎤</span> Voix
                  </Link>
                </div>
              </div> */}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;
