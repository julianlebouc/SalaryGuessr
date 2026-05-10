import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import GamePage from "./GamePage";
import HighLowGame from "./HighLowGame";
import ModeSelectPage from "./ModeSelectPage";
import BattleRoyale from "./BattleRoyale";
import StatsPage from "./StatsPage";
import { SoundProvider } from "../sound/SoundProvider";
import SoundToggleSlider from "../sound/SoundToggleSlider";

/**
 * @module Pages/App
 */

/**
 * Root application component with routing and audio context.
 * @component
 * @returns {JSX.Element}
 */
function App() {
  return (
    <SoundProvider>
      <Router>
        <SoundToggleSlider />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/mode-select" element={<ModeSelectPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/highlow" element={<HighLowGame />} />
          <Route path="/battleroyale" element={<BattleRoyale />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </Router>
    </SoundProvider>
  );
}

export default App;