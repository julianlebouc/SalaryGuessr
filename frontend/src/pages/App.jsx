import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import HomePage from "./HomePage";
import GamePage from "./GamePage";
import HighLowGame from "./HighLowGame";
import ModeSelectPage from "./ModeSelectPage";
import BattleRoyale from "./BattleRoyale";
import StatsPage from "./StatsPage";
import MentionsLegales from "./MentionsLegales";
import { SoundProvider } from "../sound/SoundProvider";
import { SettingsProvider, useSettings } from "../context/SettingsContext";
import SettingsPopup from "../components/SettingsPopup";
import { useState, useEffect } from "react";
import TutorialPopup from "../components/TutorialPopup";

// Themes
import "../styles/retro-theme.css";
import "../styles/professional-theme.css";

/**
 * GlobalNavigation component.
 * Handles the persistent "Home" button and the sound volume slider.
 * 
 * @component
 */
function GlobalNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <div className="sg-top-right-nav">
        <button 
          className="sg-settings-btn tile-animate"
          onClick={() => setIsSettingsOpen(true)}
          title="Paramètres"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span>Paramètres</span>
        </button>
      </div>

      <SettingsPopup isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {!isHome && (
        <button
          className="gp-homeBtn tile-animate"
          onClick={() => navigate("/")}
          style={{ animationDelay: '0s' }}
        >
          <img src="/logo512.svg" alt="Logo" className="gp-home-logo" />
          <span>Accueil</span>
        </button>
      )}
    </>
  );
}

/**
 * Root Application component.
 * Sets up routing, global providers (Sound), and common navigation elements.
 * 
 * @component
 * @returns {JSX.Element}
 */
function AppContent() {
  const { theme } = useSettings();
  const [showTutorial, setShowTutorial] = useState(false);

  // Check if tutorial has been completed before
  useEffect(() => {
    const tutorialDone = localStorage.getItem("sg_tutorial_done");
    if (!tutorialDone) {
      setShowTutorial(true);
    }
  }, []);

  const handleTutorialComplete = () => {
    localStorage.setItem("sg_tutorial_done", "true");
    setShowTutorial(false);
  };

  return (
    <Router>
      <div className={`theme-${theme}`}>
        {(theme === 'classic' || theme === 'retro') && <div className="noise-overlay" />}
        <GlobalNav />
        <TutorialPopup isOpen={showTutorial} onComplete={handleTutorialComplete} />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/mode-select" element={<ModeSelectPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/highlow" element={<HighLowGame />} />
          <Route path="/battleroyale" element={<BattleRoyale />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
        </Routes>
      </div>
    </Router>
  );
}

/**
 * Root Application component.
 * Sets up routing, global providers (Sound), and common navigation elements.
 * 
 * @component
 * @returns {JSX.Element}
 */
function App() {
  return (
    <SettingsProvider>
      <SoundProvider>
        <AppContent />
      </SoundProvider>
    </SettingsProvider>
  );
}

export default App;