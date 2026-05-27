import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import "../styles/GamePage.css";
import {
  fetchJob, hasValidSalary, validateGuess,
  startSession, reportGameOver, submitLeaderboardScore,
} from "../utils/gameUtils";
import { useSound } from "../sound/SoundProvider";
import { useSettings } from "../context/SettingsContext";
import logger from "../utils/logger";

/**
 * @module Pages/GamePage
 */

const T = {
  fr: {
    configTitle: "Configuration",
    roundsLabel: "Nombre de manches :",
    startBtn: "Lancer la Partie",
    loading: "Préparation...",
    roundLabel: "MANCHE",
    pts: "PTS",
    estimateLabel: "ESTIMEZ LE SALAIRE",
    validateBtn: "Valider l'Estimation",
    calculating: "Calcul...",
    yourEstimate: "VOTRE ESTIMATION",
    realSalary: "SALAIRE RÉEL",
    pointsEarned: "POINTS GAGNÉS",
    nextRound: "Manche Suivante",
    finalScore: "Voir le Score Final",
    resultTitle: "Bilan de la Partie",
    finalScoreLabel: "Score Final",
    chartTitle: "Écart par Manche",
    chartEstimated: "Estimé",
    chartReal: "Réel",
    replay: "Rejouer",
    home: "Retour Accueil",
    newRecord: "Nouveau Record !",
    leaderboardDesc: "Vous êtes dans le Top 3 mondial. Saisissez votre pseudo pour entrer dans la légende :",
    pseudoPlaceholder: "Votre pseudo (max 15 chars)",
    save: "Enregistrer",
    saving: "Enregistrement...",
    saved: "Score enregistré avec succès !",
    errorJob: "Erreur lors du chargement des offres. Veuillez réessayer.",
    errorScore: "Erreur lors de l'enregistrement du score.",
    permis: "Permis:",
    alternance: "Alternance",
    accessible: "Accessible TH",
    handi: "Handi-Engagé",
  },
  en: {
    configTitle: "Settings",
    roundsLabel: "Number of rounds:",
    startBtn: "Start Game",
    loading: "Loading...",
    roundLabel: "ROUND",
    pts: "PTS",
    estimateLabel: "ESTIMATE THE SALARY",
    validateBtn: "Validate Guess",
    calculating: "Calculating...",
    yourEstimate: "YOUR ESTIMATE",
    realSalary: "ACTUAL SALARY",
    pointsEarned: "POINTS EARNED",
    nextRound: "Next Round",
    finalScore: "View Final Score",
    resultTitle: "Game Results",
    finalScoreLabel: "Final Score",
    chartTitle: "Error per Round",
    chartEstimated: "Estimated",
    chartReal: "Actual",
    replay: "Play Again",
    home: "Back to Home",
    newRecord: "New Record!",
    leaderboardDesc: "You're in the Top 3 worldwide. Enter your nickname to join the legend:",
    pseudoPlaceholder: "Your nickname (max 15 chars)",
    save: "Save",
    saving: "Saving...",
    saved: "Score saved successfully!",
    errorJob: "Error loading job offers. Please try again.",
    errorScore: "Error submitting score.",
    permis: "License:",
    alternance: "Apprenticeship",
    accessible: "Accessible",
    handi: "Disability Inclusive",
  },
};

const BUFFER_TARGET = 1;
const MAX_FETCH_ATTEMPTS = 30;
const PARALLEL_REQUESTS = 1;

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
  const { convertToBase, convertFromBase, getSalaryLabel, language } = useSettings();
  const t = T[language] || T.fr;

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
  const [isTop3Eligible, setIsTop3Eligible] = useState(false);
  const [leaderboardSubmitted, setLeaderboardSubmitted] = useState(false);
  const [leaderboardPseudo, setLeaderboardPseudo] = useState("");
  const [leaderboardSubmitting, setLeaderboardSubmitting] = useState(false);

  const jobBufferRef = useRef([]);
  const refillPromiseRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const sessionTokenRef = useRef(null);

  useEffect(() => { jobBufferRef.current = jobBuffer; }, [jobBuffer]);

    /**
   * Fetches a single job from the API and ensures it has a valid salary
   * and hasn't been seen in the current session.
   * 
   * @async
   * @returns {Promise<Object>} The fetched job object.
   * @throws {Error} If no valid job is found after MAX_FETCH_ATTEMPTS.
   */
  const fetchNormalizedJobWithSalary = async () => {
    for (let attempts = 0; attempts < MAX_FETCH_ATTEMPTS; attempts++) {
      try {
        const job = await fetchJob(language);
        if (hasValidSalary(job) && !seenIdsRef.current.has(job.id)) return job;
      } catch (error) { console.error("Fetch error, retrying...", error); }
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    throw new Error("Failed to fetch valid job");
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
      const currentBuf = [...jobBufferRef.current];
      while (currentBuf.length < targetSize) {
        const toFetch = Math.min(targetSize - currentBuf.length, PARALLEL_REQUESTS);
        try {
          const batch = await Promise.all(Array.from({ length: toFetch }, () => fetchNormalizedJobWithSalary()));
          for (const job of batch) {
            if (job && !seenIdsRef.current.has(job.id) && currentBuf.length < targetSize) {
              currentBuf.push(job);
              seenIdsRef.current.add(job.id);
            }
          }
          setJobBuffer([...currentBuf]);
          jobBufferRef.current = [...currentBuf];
        } catch { break; }
      }
      return currentBuf;
    })().finally(() => { refillPromiseRef.current = null; });
    return refillPromiseRef.current;
  }, [language]);

    /**
   * Resets the game state and starts a new session.
   * 
   * @async
   */
  const startGame = async () => {
    play("gamestart");
    setLoadingStart(true);
    setRound(0); setScore(0); setHistory([]);
    seenIdsRef.current.clear();
    sessionTokenRef.current = null;
    setIsTop3Eligible(false);
    setLeaderboardSubmitted(false);
    setLeaderboardPseudo("");
    setGuess(""); setResult(null); setShowResult(false);
    try {
      sessionTokenRef.current = await startSession("classic", language);
      const firstJob = await fetchNormalizedJobWithSalary();
      seenIdsRef.current.add(firstJob.id);
      setCurrentJob(firstJob);
      setPage("playing");
      logger.info("Classic game started");
    } catch {
      alert(t.errorJob);
    } finally { setLoadingStart(false); }
  };

    /**
   * Validates the current salary guess and updates the score and history.
   * 
   * @async
   */
  const validate = async () => {
    if (!currentJob || !guess || loadingJob) return;
    setLoadingJob(true);
    try {
      const response = await validateGuess(currentJob.id, convertToBase(Number(guess)), sessionTokenRef.current, language);
      const scoreValue = response.score;
      setScore(s => s + scoreValue);
      setHistory(h => [...h, { round: round + 1, title: currentJob.title, estimatedBase: convertToBase(Number(guess)), realBase: response.real_salary }]);
      setResult({ userBase: convertToBase(Number(guess)), realBase: response.real_salary, score: scoreValue });
      setShowResult(true);
      play(scoreValue < 33.33 ? "roundEnd1" : scoreValue < 66.66 ? "roundEnd2" : "roundEnd3");
      void refillBuffer(BUFFER_TARGET);
    } catch { play("error"); } finally { setLoadingJob(false); }
  };

  const handleLeaderboardSubmit = async () => {
    if (!sessionTokenRef.current || !leaderboardPseudo.trim() || leaderboardSubmitting) return;
    setLeaderboardSubmitting(true);
    try {
      await submitLeaderboardScore(sessionTokenRef.current, leaderboardPseudo.trim());
      setLeaderboardSubmitted(true);
      play("success");
    } catch { alert(t.errorScore); } finally { setLeaderboardSubmitting(false); }
  };

    /**
   * Moves to the next round or finishes the game if max rounds reached.
   * 
   * @async
   */
  const nextRound = async () => {
    setGuess(""); setResult(null); setShowResult(false);
    if (round + 1 >= maxRounds) {
      setPage("result");
      const avgScore = score / maxRounds;
      play(avgScore < 33.33 ? "gameEnd1" : avgScore < 66.66 ? "gameEnd2" : "gameEnd3");
      reportGameOver(sessionTokenRef.current).then(res => { if (res?.is_top_3) setIsTop3Eligible(true); });
      return;
    }
    setLoadingJob(true);
    setRound(round + 1);
    if (jobBuffer.length > 0) {
      const [next, ...rest] = jobBuffer;
      setCurrentJob(next);
      setJobBuffer(rest);
      jobBufferRef.current = rest;
      setLoadingJob(false);
    } else {
      try { setCurrentJob(await fetchNormalizedJobWithSalary()); } catch { setPage("result"); }
      setLoadingJob(false);
    }
  };

  return (
    <div className="page-wrapper gp-page">
      <AnimatePresence mode="wait">
        {page === "settings" && (
          <div className="tile-grid" key="settings-grid">
            <div className="tile span-12 tile-animate" style={{ animationDelay: '0.1s' }}>
              <div className="tile-content gp-settings-view">
                <h1 className="gp-titleMain">{t.configTitle}</h1>
                <div className="gp-config-box">
                  <label className="gp-config-label">{t.roundsLabel} <strong>{maxRounds}</strong></label>
                  <input type="range" min="5" max="50" step="5" value={maxRounds} onChange={e => setMaxRounds(Number(e.target.value))} className="gp-range-input" />
                  <button className="hp-btn-primary" onClick={startGame} disabled={loadingStart}>{loadingStart ? t.loading : t.startBtn}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {page === "playing" && (
          <div className="tile-grid gp-game-grid" key="playing-grid">
            <div className="tile span-12 tile-animate" style={{ animationDelay: '0.04s' }}>
              <div className="tile-content gp-game-header no-padding">
                <div className="gp-round-badge">{t.roundLabel} {round + 1} / {maxRounds}</div>
                <div className="gp-score-badge">{score.toFixed(0)} {t.pts}</div>
              </div>
            </div>
            <div className="tile span-12 no-padding tile-animate" style={{ height: '4px', animationDelay: '0.15s' }}>
              <div className="gp-progress-bar">
                <motion.div className="gp-progress-fill" initial={{ width: 0 }} animate={{ width: `${((round) / maxRounds) * 100}%` }} />
              </div>
            </div>
            <div className="tile span-8 tile-grid-bg tile-animate" style={{ animationDelay: '0.08s' }}>
              <div className="tile-content gp-job-side">
                <AnimatePresence mode="wait">
                  <motion.div key={currentJob?.id} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.3 }}>
                    <h2 className="gp-job-title">{currentJob?.title}</h2>
                    <div className="badgesContainer">
                      {currentJob?.company && <span className="gp-badge gp-badgeCompany">{currentJob.company}</span>}
                      <span className="gp-badge gp-badgeLocation">{currentJob?.location}</span>
                      {currentJob?.contractType && <span className="gp-badge">{currentJob.contractType}</span>}
                      {currentJob?.contractHours && <span className="gp-badge">{currentJob.contractHours}</span>}
                      {currentJob?.experience && <span className="gp-badge">{currentJob.experience}</span>}
                      {currentJob?.qualification && <span className="gp-badge">{currentJob.qualification}</span>}
                      {currentJob?.permis && <span className="gp-badge">{t.permis} {currentJob.permis}</span>}
                      {currentJob?.alternance && <span className="gp-badge gp-badgeSpecial">{t.alternance}</span>}
                      {currentJob?.accessibleTH && <span className="gp-badge gp-badgeSpecial">{t.accessible}</span>}
                      {currentJob?.employeurHandiEngage && <span className="gp-badge gp-badgeSpecial">{t.handi}</span>}
                    </div>
                    <div className="gp-job-desc">{currentJob?.description}</div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            <div className="tile span-4 tile-animate" style={{ animationDelay: '0.3s' }}>
              <div className="tile-content gp-action-side">
                {!showResult ? (
                  <div className="gp-input-area">
                    <span className="gp-input-label">{t.estimateLabel} {getSalaryLabel(language).toUpperCase()}</span>
                    <div className="gp-input-wrap">
                      <input type="number" value={guess} onChange={e => setGuess(e.target.value)} onKeyDown={e => e.key === "Enter" && validate()} placeholder={`Ex: ${getSalaryLabel(language).toLowerCase().includes("annual") || getSalaryLabel(language).toLowerCase().includes("annuel") ? "35000" : "3500"}`} />
                      <span className="gp-currency">€</span>
                    </div>
                    <button className="hp-btn-primary" onClick={validate} disabled={!guess || loadingJob}>{loadingJob ? t.calculating : t.validateBtn}</button>
                  </div>
                ) : (
                  <div className="gp-result-area">
                    <div className="gp-comparison">
                      <div className="gp-comp-item">
                        <span>{t.yourEstimate}</span>
                        <strong>{convertFromBase(result.userBase).toLocaleString(undefined, { maximumFractionDigits: 0 })} €</strong>
                      </div>
                      <div className="gp-comp-item highlight">
                        <span>{t.realSalary}</span>
                        <strong className="accent">{convertFromBase(result.realBase).toLocaleString(undefined, { maximumFractionDigits: 0 })} €</strong>
                      </div>
                    </div>
                    <div className="gp-points-wrap">
                      <div className="gp-points-label">{t.pointsEarned}</div>
                      <div className="gp-points-val">+{result.score.toFixed(1)}</div>
                    </div>
                    <button className="hp-btn-primary" onClick={nextRound}>{round + 1 >= maxRounds ? t.finalScore : t.nextRound}</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {page === "result" && (
          <div className="tile-grid" key="result-grid">
            <div className="tile span-12 tile-animate" style={{ animationDelay: '0.1s' }}>
              <div className="tile-content gp-result-view">
                <h1 className="gp-titleMain">{t.resultTitle}</h1>
                <div className="gp-final-box">
                  <div className="gp-final-score">{(score / maxRounds).toFixed(1)}<span className="gp-final-unit">/100</span></div>
                  <p className="gp-final-text">{t.finalScoreLabel}</p>
                </div>
                {isTop3Eligible && (
                  <div className="leaderboard-prompt-box">
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
                <div className="gp-chart-container">
                  <div className="gp-chart-header"><h3 className="gp-chart-title">{t.chartTitle}</h3></div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={history.map(h => ({ ...h, estimated: convertFromBase(h.estimatedBase), real: convertFromBase(h.realBase) }))}>
                      <XAxis dataKey="round" stroke="rgba(180,180,180,0.4)" />
                      <Tooltip contentStyle={{ background: "#1a103d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} itemStyle={{ color: "#aaa" }} formatter={(value) => [`${value.toLocaleString()} €`]} />
                      <Legend verticalAlign="top" align="left" iconType="circle" wrapperStyle={{ top: -20, left: 0, fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', paddingBottom: '10px' }} />
                      <Bar dataKey="estimated" name={t.chartEstimated} fill="rgba(150,150,255,0.5)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="real" name={t.chartReal} fill="var(--primary-purple)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="gp-result-actions">
                  <button className="hp-btn-primary" onClick={() => setPage("settings")}>{t.replay}</button>
                  <button className="hp-btn-secondary" onClick={() => navigate("/")}>{t.home}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}