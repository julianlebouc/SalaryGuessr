import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import "../styles/GamePage.css";
import {
  fetchJob,
  hasValidSalary,
  validateGuess
} from "../utils/gameUtils";
import { useSound } from "../sound/SoundProvider";
import logger from "../utils/logger";

/**
 * @module Pages/GamePage
 */

const BUFFER_TARGET = 5;
const MAX_FETCH_ATTEMPTS = 30;
const PARALLEL_REQUESTS = 4;

/**
 * Formats an ISO date string into a localized French long date.
 * 
 * @param {string} dateStr - The date string to format.
 * @returns {string} The formatted date (e.g., "12 mai 2026").
 */
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

/**
 * GamePage component (Classic Mode).
 * Manages the core gameplay loop: settings, playing rounds, and result display.
 * Includes job buffering and pre-fetching logic for smooth transitions.
 * 
 * @component
 * @returns {JSX.Element} The rendered Classic game page.
 */
export default function GamePage() {
  const navigate = useNavigate();
  const { play } = useSound();

  const [page, setPage] = useState("settings");
  const [maxRounds, setMaxRounds] = useState(10);
  const [round, setRound] = useState(0);

  const [currentJob, setCurrentJob] = useState(null);
  const [jobBuffer, setJobBuffer] = useState([]);

  const [guess, setGuess] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  const [score, setScore] = useState(0);
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);

  const [history, setHistory] = useState([]);

  const jobBufferRef = useRef([]);
  const refillPromiseRef = useRef(null);
  const seenIdsRef = useRef(new Set());

  /**
   * Fetches a single job from the API and ensures it has a valid salary
   * and hasn't been seen in the current session.
   * 
   * @async
   * @returns {Promise<Object>} The fetched job object.
   * @throws {Error} If no valid job is found after MAX_FETCH_ATTEMPTS.
   */
  const fetchNormalizedJobWithSalary = async () => {
    let attempts = 0;
    while (attempts < MAX_FETCH_ATTEMPTS) {
      try {
        const job = await fetchJob();
        if (hasValidSalary(job) && !seenIdsRef.current.has(job.id)) {
          return job;
        }
      } catch (error) {
        console.error("Fetch error, retrying...", error);
      }
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    throw new Error("Failed to fetch valid job after many attempts");
  };

  /**
   * Refills the internal job buffer to ensure no delays between rounds.
   * Uses parallel fetching to speed up the process.
   * 
   * @async
   * @param {number} [targetSize=BUFFER_TARGET] - The desired buffer size.
   * @returns {Promise<Object[]>} The updated buffer.
   */
  const refillBuffer = useCallback(async (targetSize = BUFFER_TARGET) => {
    if (refillPromiseRef.current) return refillPromiseRef.current;

    refillPromiseRef.current = (async () => {
      let currentBuf = [...jobBufferRef.current];
      while (currentBuf.length < targetSize) {
        try {
          const promises = Array.from({ length: PARALLEL_REQUESTS }, () => fetchNormalizedJobWithSalary());
          const batch = await Promise.all(promises);
          for (const job of batch) {
            if (!seenIdsRef.current.has(job.id) && currentBuf.length < targetSize) {
              currentBuf.push(job);
              seenIdsRef.current.add(job.id);
            }
          }
          setJobBuffer([...currentBuf]);
          jobBufferRef.current = [...currentBuf];
        } catch (err) {
          console.error("Buffer refill batch failed", err);
          break;
        }
      }
      return currentBuf;
    })().finally(() => { refillPromiseRef.current = null; });

    return refillPromiseRef.current;
  }, []);

  useEffect(() => {
    jobBufferRef.current = jobBuffer;
  }, [jobBuffer]);

  /**
   * Resets the game state and starts a new session.
   * 
   * @async
   */
  const startGame = async () => {
    play("gamestart");
    logger.info("Classic game started");
    setLoadingStart(true);
    setRound(0);
    setScore(0);
    setHistory([]);
    seenIdsRef.current.clear();

    setGuess("");
    setResult(null);
    setShowResult(false);

    try {
      const firstJob = await fetchNormalizedJobWithSalary();
      seenIdsRef.current.add(firstJob.id);
      setCurrentJob(firstJob);
      setPage("playing");
      setLoadingStart(false);
      void refillBuffer(BUFFER_TARGET);
    } catch (err) {
      setLoadingStart(false);
      alert("Erreur lors du chargement des offres. Veuillez réessayer.");
    }
  };

  /**
   * Validates the user's numeric salary estimation against the server.
   * 
   * @async
   */
  const validate = async () => {
    if (!currentJob || !guess || loadingJob) return;
    const user = Number(guess);
    setLoadingJob(true);
    try {
      const response = await validateGuess(currentJob.id, user);
      setScore(s => s + response.score);
      setHistory(h => [...h, {
        round: round + 1,
        title: currentJob.title,
        estimated: user,
        real: response.real_salary
      }]);
      setResult({ user, real: response.real_salary, score: response.score });
      setShowResult(true);
      play("roundEnd2");
    } catch (err) {
      play("error");
    } finally {
      setLoadingJob(false);
    }
  };

  /**
   * Moves to the next round or finishes the game if max rounds reached.
   * 
   * @async
   */
  const nextRound = async () => {
    setGuess("");
    setResult(null);
    setShowResult(false);

    if (round + 1 >= maxRounds) {
      setPage("result");
      play("gameEnd3");
      logger.info("Classic game finished", { score: score / maxRounds });
      return;
    }

    setLoadingJob(true);
    const nextRoundIndex = round + 1;
    setRound(nextRoundIndex);
    setGuess("");
    setShowResult(false);

    if (jobBuffer.length > 0) {
      const next = jobBuffer[0];
      const rest = jobBuffer.slice(1);
      setCurrentJob(next);
      setJobBuffer(rest);
      jobBufferRef.current = rest;
      setLoadingJob(false);
      void refillBuffer(BUFFER_TARGET);
    } else {
      try {
        const newJob = await fetchNormalizedJobWithSalary();
        setCurrentJob(newJob);
        setLoadingJob(false);
        void refillBuffer(BUFFER_TARGET);
      } catch (err) {
        setPage("result");
      }
    }
  };

  return (
    <motion.div className="page-wrapper gp-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <AnimatePresence mode="wait">
        {page === "settings" && (
          <div className="tile-grid">
            <div className="tile span-12">
              <motion.div key="settings" className="tile-content gp-settings-view animate-fade-in">
                <h1 className="gp-titleMain">Configuration</h1>
                <div className="gp-config-box">
                  <label className="gp-config-label">Nombre de manches : <strong>{maxRounds}</strong></label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={maxRounds}
                    onChange={e => setMaxRounds(Number(e.target.value))}
                    className="gp-range-input"
                  />
                  <button className="hp-btn-primary" onClick={startGame} disabled={loadingStart}>
                    {loadingStart ? "Préparation..." : "Lancer la Partie"}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {page === "playing" && (
          <div className="tile-grid gp-game-grid">
            <div className="tile span-12">
              <div className="tile-content gp-game-header no-padding">
                <div className="gp-round-badge">MANCHE {round + 1} / {maxRounds}</div>
                <div className="gp-score-badge">{score.toFixed(0)} PTS</div>
              </div>
            </div>

            <div className="tile span-12 no-padding" style={{ height: '4px' }}>
              <div className="gp-progress-bar">
                <motion.div
                  className="gp-progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${((round) / maxRounds) * 100}%` }}
                />
              </div>
            </div>

            <div className="tile span-8 tile-grid-bg">
              <div className="tile-content gp-job-side">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentJob?.id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="gp-job-title">{currentJob?.title}</h2>

                    <div className="badgesContainer">
                      {currentJob?.company && <span className="gp-badge gp-badgeCompany">{currentJob.company}</span>}
                      <span className="gp-badge gp-badgeLocation">{currentJob?.location}</span>
                      {currentJob?.postalCode && <span className="gp-badge">{currentJob.postalCode}</span>}
                      {currentJob?.contractType && <span className="gp-badge">{currentJob.contractType}</span>}
                      {currentJob?.contractHours && <span className="gp-badge">{currentJob.contractHours}</span>}
                      {currentJob?.travailType && <span className="gp-badge">{currentJob.travailType}</span>}
                      {currentJob?.experience && <span className="gp-badge">{currentJob.experience}</span>}
                      {currentJob?.qualification && <span className="gp-badge">{currentJob.qualification}</span>}
                      {currentJob?.nombrePostes > 1 && <span className="gp-badge">{currentJob.nombrePostes} postes</span>}
                      {currentJob?.deplacement && currentJob.deplacement !== "Jamais" && <span className="gp-badge">{currentJob.deplacement}</span>}
                      {currentJob?.permis && <span className="gp-badge">Permis: {currentJob.permis}</span>}
                      {currentJob?.alternance && <span className="gp-badge gp-badgeSpecial">Alternance</span>}
                      {currentJob?.accessibleTH && <span className="gp-badge gp-badgeSpecial">Accessible TH</span>}
                      {currentJob?.employeurHandiEngage && <span className="gp-badge gp-badgeSpecial">Handi-Engagé</span>}
                      {currentJob?.sector && !currentJob.romeLabel && <span className="gp-badge">{currentJob.sector}</span>}
                      {currentJob?.created && (
                        <span className="gp-badge gp-badgeDate">
                          {formatDate(currentJob.created)}
                        </span>
                      )}
                    </div>

                    <div className="gp-job-desc">{currentJob?.description}</div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="tile span-4">
              <div className="tile-content gp-action-side">
                {!showResult ? (
                  <div className="gp-input-area">
                    <span className="gp-input-label">ESTIMEZ LE SALAIRE MENSUEL BRUT</span>
                    <div className="gp-input-wrap">
                      <input
                        type="number"
                        value={guess}
                        onChange={e => setGuess(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && validate()}
                        placeholder="Ex: 3500"
                      />
                      <span className="gp-currency">€</span>
                    </div>
                    <button className="hp-btn-primary" onClick={validate} disabled={!guess || loadingJob}>
                      {loadingJob ? "Calcul..." : "Valider l'Estimation"}
                    </button>
                  </div>
                ) : (
                  <motion.div
                    className="gp-result-area"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <div className="gp-comparison">
                      <div className="gp-comp-item">
                        <span>VOTRE ESTIMATION</span>
                        <strong>{result.user.toLocaleString(undefined, { maximumFractionDigits: 0 })} €</strong>
                      </div>
                      <div className="gp-comp-item highlight">
                        <span>SALAIRE RÉEL</span>
                        <strong className="accent">{result.real.toLocaleString(undefined, { maximumFractionDigits: 0 })} €</strong>
                      </div>
                    </div>
                    <div className="gp-points-wrap">
                      <div className="gp-points-label">POINTS GAGNÉS</div>
                      <div className="gp-points-val">+{result.score.toFixed(1)}</div>
                    </div>
                    <button className="hp-btn-primary" onClick={nextRound}>
                      {round + 1 >= maxRounds ? "Voir le Score Final" : "Manche Suivante"}
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        )}

        {page === "result" && (
          <div className="tile-grid">
            <div className="tile span-12">
              <motion.div key="result" className="tile-content gp-result-view animate-fade-in">
                <h1 className="gp-titleMain">Bilan de la Partie</h1>
                <div className="gp-final-box">
                  <div className="gp-final-score">
                    {(score / maxRounds).toFixed(1)}
                    <span className="gp-final-unit">/100</span>
                  </div>
                  <p className="gp-final-text">Score Final</p>
                </div>

                <div className="gp-chart-container">
                  <div className="gp-chart-header">
                    <h3 className="gp-chart-title">Écart par Manche</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={history}>
                      <XAxis dataKey="round" stroke="rgba(255,255,255,0.3)" />
                      <Tooltip
                        contentStyle={{ background: "#1a103d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                        itemStyle={{ color: "#fff" }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="left"
                        iconType="circle"
                        wrapperStyle={{ top: -20, left: 0, fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', paddingBottom: '10px' }}
                      />
                      <Bar dataKey="real" name="Réel" fill="var(--primary-purple)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="estimated" name="Estimé" fill="rgba(255,255,255,0.15)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="gp-result-actions">
                  <button className="hp-btn-primary" onClick={() => setPage("settings")}>Rejouer</button>
                  <button className="hp-btn-secondary" onClick={() => navigate("/")}>Retour Accueil</button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}