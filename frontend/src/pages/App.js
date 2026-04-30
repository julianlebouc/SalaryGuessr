import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import GamePage from "./GamePage";
import HighLowGame from "./HighLowGame";
import ModeSelectPage from "./ModeSelectPage";

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