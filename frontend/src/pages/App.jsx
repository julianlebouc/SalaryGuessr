import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
      <AnimatePresence mode="popLayout">
        {!isHome && (
          <motion.button
            key="home-btn"
            className="gp-homeBtn"
            onClick={() => navigate("/")}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0, transition: { duration: 0.2 } }}
            whileHover={{ translateY: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <img src="/logo512.svg" alt="Logo" className="gp-home-logo" />
            <span>Accueil</span>
          </motion.button>
        )}
      </AnimatePresence>
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