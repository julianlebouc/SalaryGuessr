import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/HighLowGame.css";
import {
  fetchJob,
  fetchMultipleJobs,
  validateGuess,
  validateComparison
} from "../utils/gameUtils";
import { useSound } from "../sound/SoundProvider";
import logger from "../utils/logger";

/**
 * @module Pages/HighLowGame
 */

/**
 * HighLowGame component.
 * Implements the "Higher or Lower" game mode where players compare two jobs.
 * 
 * @component
 * @returns {JSX.Element} The rendered High/Low game page.
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

  /**
   * Initializes the game state and fetches the first set of jobs.
   * 
   * @async
   */
  const startGame = async () => {
    logger.info("High/Low game started");
    setLoading(true);
    setScore(0);
    setGameOver(false);
    setCurrentIndex(0);
    setShowSalary(false);
    setGuessResult(null);
    setIsWaiting(false);

    try {
      const newJobs = await fetchMultipleJobs(5);
      if (newJobs.length > 0) {
        const reveal = await validateGuess(newJobs[0].id);
        newJobs[0].salary = reveal.real_salary;
      }
      setJobs(newJobs);
    } catch (err) {
      console.error("Start game failed", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Processes the user's guess (higher or lower).
   * 
   * @async
   * @param {"higher"|"lower"} guess - The user's comparison guess.
   */
  const handleGuess = async (guess) => {
    if (isWaiting || showSalary || !jobs[currentIndex] || !jobs[currentIndex + 1]) return;

    const leftJob = jobs[currentIndex];
    const rightJob = jobs[currentIndex + 1];

    try {
      const response = await validateComparison(rightJob.id, leftJob.id, guess);

      const updatedJobs = [...jobs];
      updatedJobs[currentIndex + 1].salary = response.real_salary;
      setJobs(updatedJobs);

      setShowSalary(true);

      if (response.correct) {
        play("success");
        setGuessResult("correct");
        setScore(s => s + 1);
        setIsWaiting(true);

        setTimeout(async () => {
          if (gameOver) return;

          setCurrentIndex(c => c + 1);
          setShowSalary(false);
          setGuessResult(null);
          setIsWaiting(false);

          try {
            const nextJob = await fetchJob();
            setJobs(prev => [...prev, nextJob]);
          } catch (e) {
            console.error("Fetch next job failed", e);
          }
        }, 1500);
      } else {
        play("gameEnd");
        setGuessResult("wrong");
        logger.info("High/Low game over", { finalScore: score });
        setTimeout(() => setGameOver(true), 1500);
      }
    } catch (err) {
      console.error("Guess validation failed", err);
    }
  };

  useEffect(() => {
    startGame();
  }, []);

  if (loading) return <div className="page-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>Chargement des offres...</div>;

  return (
    <motion.div className="page-wrapper hl-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {gameOver ? (
        <div className="hl-gameover-view">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <h1>PARTIE TERMINÉE</h1>
            <div className="hl-final-score">
              {score}
              <span>Série de victoires</span>
            </div>
            <div className="hl-result-actions">
              <button className="hp-btn-primary" onClick={startGame}>Rejouer</button>
              <button className="hp-btn-secondary" onClick={() => navigate("/")}>Retour Accueil</button>
            </div>
          </motion.div>
        </div>
      ) : (
        <>
          <div className="hl-game-header">
            <div className="gp-round-badge">SÉRIE ACTUELLE</div>
            <div className="gp-score-badge">{score}</div>
          </div>

          <div className="hl-main-grid">
            <AnimatePresence mode="wait">
              <motion.div
                key={jobs[currentIndex]?.id}
                className="hl-job-item"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="hl-tag">DÉJÀ RÉVÉLÉ</span>
                <h2 className="hl-job-title">{jobs[currentIndex]?.title}</h2>
                <div className="gp-badgeGroup">
                  <span className="gp-badge">{jobs[currentIndex]?.company || "Confidentiel"}</span>
                  <span className="gp-badge">{jobs[currentIndex]?.location || "France"}</span>
                </div>
                <div className="hl-salary-display">{jobs[currentIndex]?.salary?.toLocaleString(undefined, { maximumFractionDigits: 0 })} €</div>
              </motion.div>
            </AnimatePresence>

            <div className="hl-vs-zone">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="hl-vs-btn up"
                onClick={() => handleGuess("higher")}
                disabled={showSalary}
              >
                PLUS
              </motion.button>
              <div className="hl-vs-text">VS</div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="hl-vs-btn down"
                onClick={() => handleGuess("lower")}
                disabled={showSalary}
              >
                MOINS
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={jobs[currentIndex + 1]?.id}
                className="hl-job-item"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="hl-tag">EST-CE PLUS OU MOINS ?</span>
                <h2 className="hl-job-title">{jobs[currentIndex + 1]?.title}</h2>
                <div className="gp-badgeGroup">
                  <span className="gp-badge">{jobs[currentIndex + 1]?.company || "Confidentiel"}</span>
                  <span className="gp-badge">{jobs[currentIndex + 1]?.location || "France"}</span>
                </div>
                <div className="hl-salary-display">
                  {showSalary ? (
                    <motion.span
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{ color: guessResult === "correct" ? "var(--accent-cyan)" : "#ff6b6b" }}
                    >
                      {jobs[currentIndex + 1]?.salary?.toLocaleString(undefined, { maximumFractionDigits: 0 })} €
                    </motion.span>
                  ) : (
                    <span className="hl-salary-placeholder">??? €</span>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}
    </motion.div>
  );
}