import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ChildHome from "./pages/ChildHome";
import ParentHome from "./pages/ParentHome";
import StoryTeller from "./pages/StoryTeller";
import LetterLearning from "./pages/LetterLearning";
import RoomOrganizer from "./pages/RoomOrganizer";
import Draw from "./pages/Draw";
import LegoSorting from "./pages/LegoSorting";
import ObjectSorting from "./pages/ObjectSorting";
import PhotoDetection from "./pages/PhotoDetection";
import ScanBox from "./pages/ScanBox";
import VoiceSearch from "./pages/VoiceSearch";
import { RoomProvider } from "./context/RoomContext";
import MemoryGame from "./pages/MemoryGame";

// 👉 Nouveaux jeux

import AnimalSoundDetective from "./pages/AnimalSoundDetective";
import StoryBuilderBlocks from "./pages/StoryBuilderBlocks";

function App() {
  return (
    <RoomProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<ChildHome />} />
          <Route path="/parent" element={<ParentHome />} />
          <Route path="/story" element={<StoryTeller />} />
          <Route path="/learn" element={<LetterLearning />} />
          <Route path="/room-organizer" element={<RoomOrganizer />} />
          <Route path="/draw" element={<Draw />} />
          <Route path="/lego-sorting" element={<LegoSorting />} />
          <Route path="/object-sorting" element={<ObjectSorting />} />
          <Route path="/photo-detection" element={<PhotoDetection />} />
          <Route path="/scan-box" element={<ScanBox />} />
          <Route path="/voice-search" element={<VoiceSearch />} />
          <Route path="/memory-game" element={<MemoryGame />} />

          {/* 👉 Routes des nouveaux jeux */}
          
          <Route path="/animal-sound" element={<AnimalSoundDetective />} />
          <Route path="/story-builder" element={<StoryBuilderBlocks />} />
        </Routes>
      </Router>
    </RoomProvider>
  );
}

export default App;
