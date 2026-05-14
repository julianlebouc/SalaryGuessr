import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import HomePage from "./HomePage";
import GamePage from "./GamePage";
import HighLowGame from "./HighLowGame";
import ModeSelectPage from "./ModeSelectPage";
import BattleRoyale from "./BattleRoyale";
import StatsPage from "./StatsPage";
import MentionsLegales from "./MentionsLegales";
import { SoundProvider } from "../sound/SoundProvider";
import SoundToggleSlider from "../sound/SoundToggleSlider";

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

  return (
    <>
      <SoundToggleSlider />
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
function App() {
  return (
    <SoundProvider>
      <Router>
        <div className="noise-overlay" />
        <GlobalNav />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/mode-select" element={<ModeSelectPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/highlow" element={<HighLowGame />} />
          <Route path="/battleroyale" element={<BattleRoyale />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
        </Routes>
      </Router>
    </SoundProvider>
  );
}

export default App;