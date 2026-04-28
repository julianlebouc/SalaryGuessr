import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "../HomePage/HomePage";
import GamePage from "../GamePage/GamePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
      </Routes>
    </Router>
  );
}

export default App;