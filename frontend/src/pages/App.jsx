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
import TwilightBackground from "../components/TwilightBackground";

/**
 * Global Navigation component that handles the persistent Home button and Sound slider.
 */
function GlobalNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  return (
    <>
      <SoundToggleSlider />
      <AnimatePresence>
        {!isHome && (
          <motion.button
            key="home-btn"
            className="gp-homeBtn"
            onClick={() => navigate("/")}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>🏠 Accueil</span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Root application component with routing and audio context.
 */
function App() {
  return (
    <SoundProvider>
      <TwilightBackground />
      <Router>
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