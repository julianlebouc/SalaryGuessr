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
import { useSettings } from "../context/SettingsContext";
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
  const { convertFromBase, getSalaryLabel } = useSettings();

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
    setLoading(true);
    setScore(0);
    setGameOver(false);
    setCurrentIndex(0);
    setShowSalary(false);
    setGuessResult(null);
    setIsWaiting(false);

    try {
      const newJobs = await fetchMultipleJobs(2);
      if (newJobs.length > 0) {
        const reveal = await validateGuess(newJobs[0].id);
        newJobs[0].baseSalary = reveal.real_salary;
      }
      setJobs(newJobs);
      logger.info("High/Low game started");
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
      updatedJobs[currentIndex + 1].baseSalary = response.real_salary;
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

  const hasStarted = useRef(false);
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    startGame();
  }, []);

  if (loading) return <div className="page-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>Chargement des offres...</div>;

  return (
    <div className="page-wrapper hl-page">
      <div className="tile-grid hl-main-grid">
        {gameOver ? (
          <div className="tile span-12 tile-animate" style={{ animationDelay: '0.04s' }}>
            <div className="tile-content hl-gameover-view">
              <div className="hl-gameover-inner">
                <h1>PARTIE TERMINÉE</h1>
                <div className="hl-final-score">
                  {score}
                  <span>Série de victoires</span>
                </div>
                <div className="hl-result-actions">
                  <button className="hp-btn-primary" onClick={startGame}>Rejouer</button>
                  <button className="hp-btn-secondary" onClick={() => navigate("/")}>Retour Accueil</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="tile span-12 tile-animate" style={{ animationDelay: '0.04s' }}>
              <div className="tile-content hl-game-header no-padding">
                <div className="gp-round-badge">SÉRIE ACTUELLE</div>
                <div className="gp-score-badge">{score}</div>
              </div>
            </div>

            <div className="tile span-5 tile-grid-bg tile-animate" style={{ animationDelay: '0.08s' }}>
              <div className="tile-content hl-job-item">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={jobs[currentIndex]?.id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 50, opacity: 0 }}
                    style={{ textAlign: 'center' }}
                  >
                    <span className="hl-tag">DÉJÀ RÉVÉLÉ</span>
                    <h2 className="hl-job-title">{jobs[currentIndex]?.title}</h2>
                    <div className="gp-badgeGroup" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                      <span className="gp-badge">{jobs[currentIndex]?.company || "Confidentiel"}</span>
                      <span className="gp-badge">{jobs[currentIndex]?.location || "France"}</span>
                      {jobs[currentIndex]?.contractType && <span className="gp-badge">{jobs[currentIndex].contractType}</span>}
                      {jobs[currentIndex]?.contractHours && <span className="gp-badge">{jobs[currentIndex].contractHours}</span>}
                    </div>
                    <div className="hl-salary-display">{convertFromBase(jobs[currentIndex]?.baseSalary)?.toLocaleString(undefined, { maximumFractionDigits: 0 })} €</div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="tile span-2 tile-animate" style={{ animationDelay: '0.1s' }}>
              <div className="tile-content hl-vs-zone">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="hl-vs-btn up"
                  onClick={() => handleGuess("higher")}
                  disabled={isWaiting || showSalary}
                >
                  PLUS
                </motion.button>
                <div className="hl-vs-text">VS</div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="hl-vs-btn down"
                  onClick={() => handleGuess("lower")}
                  disabled={isWaiting || showSalary}
                >
                  MOINS
                </motion.button>
              </div>
            </div>

            <div className="tile span-5 tile-grid-bg tile-animate" style={{ animationDelay: '0.12s' }}>
              <div className="tile-content hl-job-item">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={jobs[currentIndex + 1]?.id}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -50, opacity: 0 }}
                    style={{ textAlign: 'center' }}
                  >
                    <span className="hl-tag">EST-CE PLUS OU MOINS ?</span>
                    <h2 className="hl-job-title">{jobs[currentIndex + 1]?.title}</h2>
                    <div className="gp-badgeGroup" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                      <span className="gp-badge">{jobs[currentIndex + 1]?.company || "Confidentiel"}</span>
                      <span className="gp-badge">{jobs[currentIndex + 1]?.location || "France"}</span>
                      {jobs[currentIndex + 1]?.contractType && <span className="gp-badge">{jobs[currentIndex + 1].contractType}</span>}
                      {jobs[currentIndex + 1]?.contractHours && <span className="gp-badge">{jobs[currentIndex + 1].contractHours}</span>}
                    </div>
                    <div className="hl-salary-display">
                      {showSalary ? (
                        <motion.span
                          initial={{ scale: 1.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          style={{ color: guessResult === "correct" ? "var(--accent-cyan)" : "#ff6b6b" }}
                        >
                          {convertFromBase(jobs[currentIndex + 1]?.baseSalary)?.toLocaleString(undefined, { maximumFractionDigits: 0 })} €
                        </motion.span>
                      ) : (
                        <span className="hl-salary-placeholder">??? €</span>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}