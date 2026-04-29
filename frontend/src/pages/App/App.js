import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "../HomePage/HomePage";
import GamePage from "../GamePage/GamePage";
import HighLowGame from "../HighLowGame/HighLowGame";
import ModeSelectPage from "../ModeSelectPage/ModeSelectPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/mode-select" element={<ModeSelectPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/highlow" element={<HighLowGame />} />
      </Routes>
    </Router>
  );
}

export default App;