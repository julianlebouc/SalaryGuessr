import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/HighLowGame.css";
import {
  fetchJob, fetchMultipleJobs, validateGuess, validateComparison,
  startSession, reportGameOver, submitLeaderboardScore,
} from "../utils/gameUtils";
import { useSound } from "../sound/SoundProvider";
import { useSettings } from "../context/SettingsContext";
import logger from "../utils/logger";

/**
 * @module Pages/HighLowGame
 */

const T = {
  fr: {
    loading: "Chargement des offres...",
    alreadyRevealed: "DÉJÀ RÉVÉLÉ",
    guessLabel: "EST-CE PLUS OU MOINS ?",
    higher: "PLUS",
    lower: "MOINS",
    vs: "VS",
    currentStreak: "SÉRIE ACTUELLE",
    gameOver: "PARTIE TERMINÉE",
    streakLabel: "Série de victoires",
    newRecord: "Nouveau Record !",
    leaderboardDesc: "Vous êtes dans le Top 3 mondial. Saisissez votre pseudo :",
    pseudoPlaceholder: "Pseudo (max 15 chars)",
    save: "Enregistrer",
    saving: "Enregistrement...",
    saved: "Score enregistré !",
    replay: "Rejouer",
    home: "Retour Accueil",
    errorSubmit: "Erreur lors de l'enregistrement du score.",
    unknown: "Inconnu",
  },
  en: {
    loading: "Loading offers...",
    alreadyRevealed: "ALREADY REVEALED",
    guessLabel: "HIGHER OR LOWER?",
    higher: "HIGHER",
    lower: "LOWER",
    vs: "VS",
    currentStreak: "CURRENT STREAK",
    gameOver: "GAME OVER",
    streakLabel: "Win Streak",
    newRecord: "New Record!",
    leaderboardDesc: "You're in the Top 3 worldwide. Enter your nickname:",
    pseudoPlaceholder: "Nickname (max 15 chars)",
    save: "Save",
    saving: "Saving...",
    saved: "Score saved!",
    replay: "Play Again",
    home: "Back to Home",
    errorSubmit: "Error submitting score.",
    unknown: "Unknown",
  },
};

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
  const { convertFromBase, getSalaryLabel, language } = useSettings();
  const t = T[language] || T.fr;

  const [jobs, setJobs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSalary, setShowSalary] = useState(false);
  const [guessResult, setGuessResult] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const sessionTokenRef = useRef(null);
  const hasStartedRef = useRef(false);
  const [isTop3Eligible, setIsTop3Eligible] = useState(false);
  const [leaderboardSubmitted, setLeaderboardSubmitted] = useState(false);
  const [leaderboardPseudo, setLeaderboardPseudo] = useState("");
  const [leaderboardSubmitting, setLeaderboardSubmitting] = useState(false);

    /**
   * Initializes the game state and fetches the first set of jobs.
   * 
   * @async
   */
  const startGame = async () => {
    setLoading(true); setScore(0); setGameOver(false); setCurrentIndex(0);
    setShowSalary(false); setGuessResult(null); setIsWaiting(false);
    sessionTokenRef.current = null;
    setIsTop3Eligible(false); setLeaderboardSubmitted(false); setLeaderboardPseudo("");
    try {
      sessionTokenRef.current = await startSession("highlow", language);
      const newJobs = await fetchMultipleJobs(2, language);
      if (newJobs.length > 0) {
        const reveal = await validateGuess(newJobs[0].id, null, sessionTokenRef.current, language);
        newJobs[0].baseSalary = reveal.real_salary;
      }
      setJobs(newJobs);
      logger.info("High/Low game started");
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      startGame();
    }
  }, []);

  
  /**
   * Processes the user's guess (higher or lower).
   * 
   * @async
   * @param {"higher"|"lower"} guess - The user's comparison guess.
   */
  const handleGuess = async (guess) => {
    if (isWaiting || showSalary || !jobs[currentIndex] || !jobs[currentIndex + 1]) return;
    try {
      const response = await validateComparison(jobs[currentIndex + 1].id, jobs[currentIndex].id, guess, sessionTokenRef.current, language);
      const updatedJobs = [...jobs];
      updatedJobs[currentIndex + 1].baseSalary = response.real_salary;
      setJobs(updatedJobs);
      setShowSalary(true);
      if (response.correct) {
        play("success"); setGuessResult("correct"); setScore(s => s + 1); setIsWaiting(true);
        setTimeout(() => {
          if (gameOver) return;
          setCurrentIndex(c => c + 1); setShowSalary(false); setGuessResult(null); setIsWaiting(false);
          fetchJob(language).then(job => setJobs(prev => [...prev, job])).catch(() => {});
        }, 1500);
      } else {
        play("gameEnd"); setGuessResult("wrong");
        reportGameOver(sessionTokenRef.current).then(res => { if (res?.is_top_3) setIsTop3Eligible(true); });
        setTimeout(() => setGameOver(true), 1500);
      }
    } catch {}
  };

  const handleLeaderboardSubmit = async () => {
    if (!sessionTokenRef.current || !leaderboardPseudo.trim() || leaderboardSubmitting) return;
    setLeaderboardSubmitting(true);
    try {
      await submitLeaderboardScore(sessionTokenRef.current, leaderboardPseudo.trim());
      setLeaderboardSubmitted(true); play("success");
    } catch { alert(t.errorSubmit); } finally { setLeaderboardSubmitting(false); }
  };

  if (loading) return <div className="page-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>{t.loading}</div>;

  return (
    <div className="page-wrapper hl-page">
      <div className="tile-grid hl-main-grid">
        {gameOver ? (
          <div className="tile span-12 tile-animate" style={{ animationDelay: '0.04s' }}>
            <div className="tile-content hl-gameover-view">
              <div className="hl-gameover-inner">
                <h1>{t.gameOver}</h1>
                <div className="hl-final-score">{score}<span>{t.streakLabel}</span></div>
                {isTop3Eligible && (
                  <div className="leaderboard-prompt-box" style={{ marginBottom: "1.5rem" }}>
                    <h3 className="leaderboard-prompt-title">{t.newRecord}</h3>
                    <p className="leaderboard-prompt-desc">{t.leaderboardDesc}</p>
                    {!leaderboardSubmitted ? (
                      <div className="leaderboard-prompt-form">
                        <input type="text" value={leaderboardPseudo} onChange={(e) => setLeaderboardPseudo(e.target.value.slice(0, 15))} placeholder={t.pseudoPlaceholder} disabled={leaderboardSubmitting} className="leaderboard-pseudo-input" onKeyDown={(e) => { if (e.key === "Enter" && leaderboardPseudo.trim()) handleLeaderboardSubmit(); }} />
                        <button onClick={handleLeaderboardSubmit} disabled={leaderboardSubmitting || !leaderboardPseudo.trim()} className="hp-btn-primary leaderboard-submit-btn">{leaderboardSubmitting ? t.saving : t.save}</button>
                      </div>
                    ) : <div className="leaderboard-prompt-success">{t.saved}</div>}
                  </div>
                )}
                <div className="hl-result-actions">
                  <button className="hp-btn-primary" onClick={startGame}>{t.replay}</button>
                  <button className="hp-btn-secondary" onClick={() => navigate("/")}>{t.home}</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="tile span-12 tile-animate" style={{ animationDelay: '0.04s' }}>
              <div className="tile-content hl-game-header no-padding">
                <div className="gp-round-badge">{t.currentStreak}</div>
                <div className="gp-score-badge">{score}</div>
              </div>
            </div>

            <div className="tile span-5 tile-grid-bg tile-animate" style={{ animationDelay: '0.08s' }}>
              <div className="tile-content hl-job-item">
                <AnimatePresence mode="wait">
                  <motion.div key={jobs[currentIndex]?.id} initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }} style={{ textAlign: 'center' }}>
                    <span className="hl-tag">{t.alreadyRevealed}</span>
                    <h2 className="hl-job-title">{jobs[currentIndex]?.title}</h2>
                    <div className="gp-badgeGroup" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
                      <span className="gp-badge">{jobs[currentIndex]?.company || t.unknown}</span>
                      <span className="gp-badge">{jobs[currentIndex]?.location || (language === "en" ? "Unknown" : "France")}</span>
                      {jobs[currentIndex]?.contractType && <span className="gp-badge">{jobs[currentIndex].contractType}</span>}
                    </div>
                    <div className="hl-salary-display">{convertFromBase(jobs[currentIndex]?.baseSalary)?.toLocaleString(undefined, { maximumFractionDigits: 0 })} €</div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="tile span-2 tile-animate" style={{ animationDelay: '0.1s' }}>
              <div className="tile-content hl-vs-zone">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="hl-vs-btn up" onClick={() => handleGuess("higher")} disabled={isWaiting || showSalary}>{t.higher}</motion.button>
                <div className="hl-vs-text">{t.vs}</div>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="hl-vs-btn down" onClick={() => handleGuess("lower")} disabled={isWaiting || showSalary}>{t.lower}</motion.button>
              </div>
            </div>

            <div className="tile span-5 tile-grid-bg tile-animate" style={{ animationDelay: '0.12s' }}>
              <div className="tile-content hl-job-item">
                <AnimatePresence mode="wait">
                  <motion.div key={jobs[currentIndex + 1]?.id} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} style={{ textAlign: 'center' }}>
                    <span className="hl-tag">{t.guessLabel}</span>
                    <h2 className="hl-job-title">{jobs[currentIndex + 1]?.title}</h2>
                    <div className="gp-badgeGroup" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
                      <span className="gp-badge">{jobs[currentIndex + 1]?.company || t.unknown}</span>
                      <span className="gp-badge">{jobs[currentIndex + 1]?.location || (language === "en" ? "Unknown" : "France")}</span>
                      {jobs[currentIndex + 1]?.contractType && <span className="gp-badge">{jobs[currentIndex + 1].contractType}</span>}
                    </div>
                    <div className="hl-salary-display">
                      {showSalary ? (
                        <motion.span initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ color: guessResult === "correct" ? "var(--accent-cyan)" : "#ff6b6b" }}>
                          {convertFromBase(jobs[currentIndex + 1]?.baseSalary)?.toLocaleString(undefined, { maximumFractionDigits: 0 })} €
                        </motion.span>
                      ) : <span className="hl-salary-placeholder">??? €</span>}
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