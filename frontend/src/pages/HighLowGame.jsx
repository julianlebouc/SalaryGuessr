import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HighLowGame.css";
import { 
  fetchJob, 
  fetchMultipleJobs, 
  evaluateHigherLowerGuess,
  formatDate,
  validateGuess,
  validateComparison
} from "../utils/gameUtils";
import { useSound } from "../sound/SoundProvider";

/**
 * @module Pages/HighLowGame
 */

/**
 * Higher / Lower game mode component.
 * Players compare two job offers and guess which one pays higher.
 * @component
 * @returns {JSX.Element}
 */
export default function HighLowGame() {
  const navigate = useNavigate();
  const { play } = useSound();
  const [jobs, setJobs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSalary, setShowSalary] = useState(false);
  const [guessResult, setGuessResult] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [animationState, setAnimationState] = useState("idle");

/**
   * Load a batch of jobs for the high/low game.
   * @memberof module:Pages/HighLowGame
   * @returns {Promise<void>}
   */
  const loadJobs = async () => {
    const newJobs = await fetchMultipleJobs(5);
    setJobs(newJobs);
  };

/**
   * Fetch an additional job and append it to the job queue.
   * @memberof module:Pages/HighLowGame
   * @returns {Promise<void>}
   */
  const addNewJob = async () => {
    const newJob = await fetchJob();
    setJobs(prev => [...prev, newJob]);
  };

/**
   * Initialize game state and load the first jobs.
   * @memberof module:Pages/HighLowGame
   * @returns {Promise<void>}
   */
  const startGame = async () => {
    setLoading(true);
    setScore(0);
    setGameOver(false);
    setCurrentIndex(0);
    setShowSalary(false);
    setGuessResult(null);
    setIsWaiting(false);
    setAnimationState("idle");
    const newJobs = await fetchMultipleJobs(5);
    
    // ANTI-CHEAT: Reveal the salary of the first job only
    if (newJobs.length > 0) {
      try {
        const reveal = await validateGuess(newJobs[0].id);
        newJobs[0].salary = reveal.real_salary;
      } catch (err) {
        console.error("Failed to reveal first job salary:", err);
      }
    }
    
    setJobs(newJobs);
    setLoading(false);
  };

/**
   * Transition to the next round with a brief animation.
   * @memberof module:Pages/HighLowGame
   * @returns {void}
   */
  const nextRound = () => {
    setAnimationState("fadingOut");
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setShowSalary(false);
      setGuessResult(null);
      setIsWaiting(false);
      addNewJob();
      
      setAnimationState("fadingIn");
      
      setTimeout(() => {
        setAnimationState("idle");
      }, 300);
    }, 300);
  };

/**
   * Process the user's higher/lower answer and update game state.
   * @memberof module:Pages/HighLowGame
   * @param {string} guess
   * @returns {Promise<void>}
   */
  const handleGuess = async (guess) => {
    if (isWaiting || showSalary) return;

    const leftJob = jobs[currentIndex];
    const rightJob = jobs[currentIndex + 1];
    
    if (!leftJob || !rightJob) return;

    const isCorrect = await (async () => {
      try {
        const response = await validateComparison(rightJob.id, leftJob.id, guess);
        // Update the right job with its real salary now that it's guessed
        const updatedJobs = [...jobs];
        updatedJobs[currentIndex + 1].salary = response.real_salary;
        setJobs(updatedJobs);
        return response.correct;
      } catch (err) {
        console.error("Validation error:", err);
        return false;
      }
    })();

    setShowSalary(true);
    
    if (isCorrect) {
      play("success");
      setGuessResult("correct");
      setScore(prev => prev + 1);
      setIsWaiting(true);
      setTimeout(() => {
        nextRound();
      }, 1500);
    } else {
      play("gameEnd");
      setGuessResult("wrong");
      setTimeout(() => {
        setGameOver(true);
      }, 1500);
    }
  };

/**
   * Restart the high/low game from the beginning.
   * @memberof module:Pages/HighLowGame
   * @returns {void}
   */
  const resetGame = () => {
    startGame();
  };

  useEffect(() => {
    startGame();
  }, []);


  if (loading || jobs.length < currentIndex + 3) {
    return (
      <div className="hl-container">
        <div className="gp-bubble gp-bubble-1">🎯</div>
        <div className="gp-bubble gp-bubble-2">💰</div>
        <div className="gp-bubble gp-bubble-3">⚡</div>
        <div className="gp-float gp-float--one" />
        <div className="gp-float gp-float--two" />
        <div className="gp-float gp-float--three" />
        <div className="hl-loader">
          <div className="gp-loader">
            <span></span><span></span><span></span>
          </div>
          <p>Chargement des offres...</p>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="hl-container">
        <div className="gp-bubble gp-bubble-1">🏆</div>
        <div className="gp-bubble gp-bubble-2">⭐</div>
        <div className="gp-float gp-float--one" />
        <div className="gp-float gp-float--two" />
        <div className="gp-float gp-float--three" />
        <div className="hl-gameover">
          <div className="hl-gameover-icon">💀</div>
          <h1>GAME OVER</h1>
          <div className="hl-final-score">
            <span>Score final</span>
            <strong>{score}</strong>
          </div>
          <button className="hl-replay-btn" onClick={resetGame}>
            🔁 Rejouer
          </button>
          <button className="hl-home-btn" onClick={() => navigate("/")}>
            🏠 Accueil
          </button>
        </div>
      </div>
    );
  }

  const leftJob = jobs[currentIndex];
  const rightJob = jobs[currentIndex + 1];
  const nextJob = jobs[currentIndex + 2];

  return (
    <div className="hl-container">
      <div className="gp-bubble gp-bubble-1">🎯</div>
      <div className="gp-bubble gp-bubble-2">💪</div>
      <div className="gp-bubble gp-bubble-3">⚡</div>
      <div className="gp-float gp-float--one" />
      <div className="gp-float gp-float--two" />
      <div className="gp-float gp-float--three" />

      <button className="hl-home-link" onClick={() => navigate("/")}>
        <img src="/logo512.svg" alt="SalaryGuessr" className="hl-home-logo" />
        <span>SalaryGuessr</span>
      </button>

      <div className="hl-header">
        <div className="roundBadge">
          <span>🏆 Score</span>
          <strong>{score}</strong>
        </div>
      </div>

      <div className={`hl-carousel ${animationState === "fadingOut" ? "hl-fade-out" : ""} ${animationState === "fadingIn" ? "hl-fade-in" : ""}`}>
  
      {/* Card 1 - Known salary */}
      <div className="hl-card">
        <div className="gp-cardGlow" />
        <div className="gp-cardShine"></div>
        <div className="hl-card-header">
          <span className="gp-badge">OFFRE 1</span>
          <span className="hl-salary-badge">💰 Salaire connu</span>
        </div>
        <h2 className="hl-title">{leftJob.title}</h2>
        
        <div className="badgesContainer">
          <div className="hl-badgeGroup hl-badgePrimary">
            {leftJob.company && <span className="gp-badge gp-badgeCompany">🏢 {leftJob.company}</span>}
            <span className="gp-badge gp-badgeLocation">📍 {leftJob.location}</span>
          </div>
          
          <div className="hl-badgeGroup">
            {leftJob.contractType && <span className="gp-badge">📄 {leftJob.contractType}</span>}
            {leftJob.contractHours && <span className="gp-badge">⏱️ {leftJob.contractHours}</span>}
            {leftJob.travailType && <span className="gp-badge">💼 {leftJob.travailType}</span>}
            {leftJob.experience && <span className="gp-badge">🎓 {leftJob.experience}</span>}
            {leftJob.qualification && <span className="gp-badge">📊 {leftJob.qualification}</span>}
            {leftJob.nombrePostes > 1 && <span className="gp-badge">👥 {leftJob.nombrePostes} postes</span>}
          </div>
          
          <div className="hl-badgeGroup">
            {leftJob.deplacement && leftJob.deplacement !== "Jamais" && <span className="gp-badge">🚗 {leftJob.deplacement}</span>}
            {leftJob.permis && <span className="gp-badge">🚗 Permis: {leftJob.permis}</span>}
            {leftJob.alternance && <span className="gp-badge gp-badgeSpecial">🔄 Alternance</span>}
            {leftJob.accessibleTH && <span className="gp-badge gp-badgeSpecial">♿ Accessible TH</span>}
            {leftJob.employeurHandiEngage && <span className="gp-badge gp-badgeSpecial">🤝 Handi-Engagé</span>}
          </div>
          
          <div className="hl-badgeGroup">
            {leftJob.sector && !leftJob.romeLabel && <span className="gp-badge">🏭 {leftJob.sector}</span>}
          </div>
        </div>
        
        <div className="hl-salary">
          <strong className="hl-salary-value">{leftJob.salary.toLocaleString("fr-FR")} €</strong>
        </div>
      </div>

      {/* Card 2 - To guess */}
      <div className="hl-card">
        <div className="gp-cardGlow" />
        <div className="gp-cardShine"></div>
        <div className="hl-card-header">
          <span className="gp-badge">OFFRE 2</span>
          <span className="hl-question-badge">❓ À deviner</span>
        </div>
        <h2 className="hl-title">{rightJob.title}</h2>

        <div className="badgesContainer">
          <div className="hl-badgeGroup hl-badgePrimary">
            {rightJob.company && <span className="gp-badge gp-badgeCompany">🏢 {rightJob.company}</span>}
            <span className="gp-badge gp-badgeLocation">📍 {rightJob.location}</span>
          </div>
          
          <div className="hl-badgeGroup">
            {rightJob.contractType && <span className="gp-badge">📄 {rightJob.contractType}</span>}
            {rightJob.contractHours && <span className="gp-badge">⏱️ {rightJob.contractHours}</span>}
            {rightJob.travailType && <span className="gp-badge">💼 {rightJob.travailType}</span>}
            {rightJob.experience && <span className="gp-badge">🎓 {rightJob.experience}</span>}
            {rightJob.qualification && <span className="gp-badge">📊 {rightJob.qualification}</span>}
            {rightJob.nombrePostes > 1 && <span className="gp-badge">👥 {rightJob.nombrePostes} postes</span>}
          </div>
          
          <div className="hl-badgeGroup">
            {rightJob.deplacement && rightJob.deplacement !== "Jamais" && <span className="gp-badge">🚗 {rightJob.deplacement}</span>}
            {rightJob.permis && <span className="gp-badge">🚗 Permis: {rightJob.permis}</span>}
            {rightJob.alternance && <span className="gp-badge gp-badgeSpecial">🔄 Alternance</span>}
            {rightJob.accessibleTH && <span className="gp-badge gp-badgeSpecial">♿ Accessible TH</span>}
            {rightJob.employeurHandiEngage && <span className="gp-badge gp-badgeSpecial">🤝 Handi-Engagé</span>}
          </div>
          
          <div className="hl-badgeGroup">
            {rightJob.sector && !rightJob.romeLabel && <span className="gp-badge">🏭 {rightJob.sector}</span>}
          </div>
        </div>
        
        <div className="hl-salary">
          {showSalary ? (
            <div className={`hl-salary-reveal ${guessResult === "correct" ? "hl-reveal-correct" : "hl-reveal-wrong"}`}>
              <strong>{guessResult === "correct" ? "✅ " : "❌ "}{rightJob.salary.toLocaleString("fr-FR")} €</strong>
            </div>
          ) : (
            <div className="hl-salary-placeholder">
              <span>???</span>
            </div>
          )}
        </div>
      </div>

      {/* Arrows */}
      <div className="hl-arrows">
        <button
          className={`hl-arrow-up ${guessResult === "correct" ? "hl-correct" : ""} ${guessResult === "wrong" ? "hl-wrong" : ""}`}
          onClick={() => handleGuess("higher")}
          disabled={showSalary}
        >
          <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
            <path d="M12 4l-8 8h6v8h4v-8h6z"/>
          </svg>
          <span>PLUS ÉLEVÉ</span>
        </button>
        <button
          className={`hl-arrow-down ${guessResult === "correct" ? "hl-correct" : ""} ${guessResult === "wrong" ? "hl-wrong" : ""}`}
          onClick={() => handleGuess("lower")}
          disabled={showSalary}
        >
          <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
            <path d="M12 20l8-8h-6v-8h-4v8h-6z"/>
          </svg>
          <span>PLUS BAS</span>
        </button>
      </div>

        {/* Card 3 - Next offer */}
        <div className="hl-card hl-card-next">
          <div className="gp-cardGlow" />
          <div className="gp-cardShine"></div>
          <div className="hl-card-header">
            <span className="gp-badge">OFFRE 3</span>
            <span className="hl-next-badge">⏳ Prochaine</span>
          </div>
          <h2 className="hl-next-title">{nextJob.title}</h2>
          <div className="hl-next-meta">
            {nextJob.company && <span>🏢 {nextJob.company}</span>}
            <span>📍 {nextJob.location}</span>
          </div>
          <div className="hl-next-placeholder">
            <span>???</span>
          </div>
        </div>
      </div>
    </div>
  );
}