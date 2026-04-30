import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "../styles/GamePage.css";
import { 
  fetchJob, 
  fetchMultipleJobs,
  hasValidSalary, 
  formatDate, 
  calculateScore 
} from "../utils/gameUtils";

const BUFFER_TARGET = 3;
const REFILL_THRESHOLD = 1;
const MAX_FETCH_ATTEMPTS = 20;
const PARALLEL_REQUESTS = 4;

export default function GamePage() {
  const navigate = useNavigate();

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
  const [shakeAnimation, setShakeAnimation] = useState(false);

  const jobBufferRef = useRef([]);
  const currentJobRef = useRef(null);
  const refillPromiseRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const lastJobIdRef = useRef(null);

  const fetchNormalizedJobWithSalary = async () => {
    while (true) {
      try {
        const job = await fetchJob();
        if (hasValidSalary(job) && job.id !== lastJobIdRef.current) {
          return job;
        }
      } catch (error) {
        console.error("Erreur réseau, nouvelle tentative...", error);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const fetchJobsParallel = async (count) => {
    const promises = Array.from({ length: count }, () =>
      fetchNormalizedJobWithSalary().catch(() => null)
    );
    const results = await Promise.all(promises);
    return results.filter(Boolean);
  };

  const dedupeJobs = (jobs) => {
    const seen = new Set();
    return jobs.filter((job) => {
      if (!job?.id) return false;
      if (seen.has(job.id)) return false;
      seen.add(job.id);
      return true;
    });
  };

  useEffect(() => { jobBufferRef.current = jobBuffer; }, [jobBuffer]);
  useEffect(() => { currentJobRef.current = currentJob; }, [currentJob]);

  const refillBuffer = useCallback(async (targetSize = BUFFER_TARGET) => {
    if (refillPromiseRef.current) return refillPromiseRef.current;

    refillPromiseRef.current = (async () => {
      const existing = [...jobBufferRef.current];
      const currentSeen = new Set(seenIdsRef.current);

      let attempts = 0;
      while (existing.length < targetSize && attempts < MAX_FETCH_ATTEMPTS) {
        const batch = await fetchJobsParallel(PARALLEL_REQUESTS);
        attempts += 1;

        for (const job of batch) {
          if (!job?.id) continue;
          if (currentSeen.has(job.id)) continue;
          if (job.id === lastJobIdRef.current) continue;
          
          currentSeen.add(job.id);
          existing.push(job);
          if (existing.length >= targetSize) break;
        }
      }

      const merged = dedupeJobs(existing);
      setJobBuffer(merged);
      merged.forEach(job => seenIdsRef.current.add(job.id));
      return merged;
    })().finally(() => { refillPromiseRef.current = null; });

    return refillPromiseRef.current;
  }, []);

  useEffect(() => {
    if (page !== "playing") return;
    if (!currentJob) return;
    if (jobBuffer.length > REFILL_THRESHOLD) return;
    void refillBuffer(Math.min(maxRounds - round - 1, BUFFER_TARGET));
  }, [page, currentJob, jobBuffer.length, refillBuffer, maxRounds, round]);

  const resetGameState = () => {
    setRound(0);
    setScore(0);
    setHistory([]);
    setGuess("");
    setShowResult(false);
    setResult(null);
    setCurrentJob(null);
    setJobBuffer([]);
    setLoadingJob(false);
    seenIdsRef.current = new Set();
    lastJobIdRef.current = null;
  };

  const startGame = async () => {
    setLoadingStart(true);
    resetGameState();

    const firstJob = await fetchNormalizedJobWithSalary();
    lastJobIdRef.current = firstJob.id;
    seenIdsRef.current.add(firstJob.id);

    setCurrentJob(firstJob);
    setJobBuffer([]);
    setPage("playing");
    setLoadingStart(false);
    
    void refillBuffer(Math.min(maxRounds - 1, BUFFER_TARGET));
  };

  const validate = () => {
    if (!currentJob) return;

    const real = Number(currentJob.salary);
    const user = Number(guess);

    if (!Number.isFinite(real) || real <= 0 || !Number.isFinite(user) || user <= 0) {
      setShakeAnimation(true);
      setTimeout(() => setShakeAnimation(false), 500);
      return;
    }

    const { score: roundScore, error } = calculateScore(user, real);

    setScore((prev) => prev + roundScore);

    setHistory((prev) => [
      ...prev,
      {
        round: round + 1,
        title: currentJob.title,
        estimated: user,
        real,
      },
    ]);

    setResult({
      user,
      real,
      error: error.toFixed(1),
      roundScore: roundScore.toFixed(1),
    });

    setShowResult(true);

    void refillBuffer(BUFFER_TARGET);
  };

  const nextRound = async () => {
    const nextIndex = round + 1;

    if (nextIndex >= maxRounds) {
      setPage("result");
      return;
    }

    const bufferSnapshot = jobBufferRef.current;

    setRound(nextIndex);
    setGuess("");
    setShowResult(false);
    setResult(null);

    if (bufferSnapshot.length > 0) {
      const [nextJob, ...rest] = bufferSnapshot;
      lastJobIdRef.current = nextJob.id;
      setCurrentJob(nextJob);
      setJobBuffer(rest);
      if (rest.length <= REFILL_THRESHOLD) void refillBuffer(BUFFER_TARGET);
      return;
    }

    setLoadingJob(true);
    try {
      const newJob = await fetchNormalizedJobWithSalary();
      lastJobIdRef.current = newJob.id;
      seenIdsRef.current.add(newJob.id);
      setCurrentJob(newJob);
      
      const remaining = maxRounds - nextIndex - 1;
      if (remaining > 0) {
        const toPrefetch = Math.min(remaining, BUFFER_TARGET);
        void refillBuffer(toPrefetch);
      }
    } catch (error) {
      console.error("Erreur chargement offre suivante:", error);
    } finally {
      setLoadingJob(false);
    }
  };

  const goHome = () => navigate("/");

  // SETTINGS PAGE
  if (page === "settings") {
    return (
      <div className="gp-container gp-container--settings">
        <div className="gp-bubble gp-bubble-1">🎮</div>
        <div className="gp-bubble gp-bubble-2">💰</div>
        <div className="gp-bubble gp-bubble-3">⚡</div>
        
        <div className="gp-float gp-float--one" />
        <div className="gp-float gp-float--two" />
        <div className="gp-float gp-float--three" />

        <button className="gp-homeBtn" onClick={goHome}>
          <img src="/logo512.svg" alt="SalaryGuessr" className="gp-homeLogo" />
          <span>SalaryGuessr</span>
        </button>

        <div className="gp-character gp-character-settings">
          <div className="gp-character-face">
            <div className="gp-eye gp-eye-left"><div className="gp-pupil"></div></div>
            <div className="gp-eye gp-eye-right"><div className="gp-pupil"></div></div>
            <div className="gp-mouth gp-mouth-smile"></div>
          </div>
        </div>

        <div className="gp-card gp-settingsCard">
          <div className="gp-cardGlow" />
          <div className="gp-cardShine"></div>
          
          <div className="gp-settingsHeader">
            <span className="gp-settingsIcon">⚙️</span>
            <h1 className="gp-titleMain">SalaryGuessr</h1>
          </div>
          
          <p className="gp-subtitle">
            <span className="gp-subtitleIcon">🎲</span>
            Teste ton instinct et devine les salaires !
          </p>

          <div className="gp-rangeWrap">
            <div className="gp-rangeLabel">
              <span>📊 NOMBRE DE MANCHES</span>
              <span className="gp-rangeValue">{maxRounds}</span>
            </div>
            <input
              className="gp-range"
              type="range"
              min="5"
              max="50"
              step="5"
              value={maxRounds}
              onChange={(e) => setMaxRounds(Number(e.target.value))}
            />
            <div className="gp-rangeMarks">
              <span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span><span>35</span><span>40</span><span>45</span><span>50</span>
            </div>
          </div>

          <div className="gp-statsPreview">
            <div className="gp-statPreviewItem">
              <span className="gp-statPreviewIcon">🎯</span>
              <span>{maxRounds} manches</span>
            </div>
            <div className="gp-statPreviewItem">
              <span className="gp-statPreviewIcon">🏆</span>
              <span>Score max: {maxRounds * 100}</span>
            </div>
          </div>

          <button
            className={`gp-playButton ${loadingStart ? "loading" : ""}`}
            onClick={startGame}
            disabled={loadingStart}
          >
            <span className="gp-playButton-text">
              {loadingStart ? "⏳ RECHERCHE..." : "🚀 COMMENCER"}
            </span>
            {!loadingStart && <span className="gp-playButton-arrow">→</span>}
          </button>
        </div>
      </div>
    );
  }

  // RESULT PAGE
  if (page === "result") {
    const totalScore = (score / (maxRounds * 100)) * 100;
    const performanceLevel = 
      totalScore >= 80 ? "🌟 LÉGENDAIRE !" :
      totalScore >= 60 ? "🎉 EXCELLENT !" :
      totalScore >= 40 ? "👍 PAS MAL !" :
      totalScore >= 20 ? "📈 PEUX MIEUX FAIRE" :
      "💪 ENCORE UN EFFORT";

    return (
      <div className="gp-container gp-container--result">
        <div className="gp-bubble gp-bubble-1">🏆</div>
        <div className="gp-bubble gp-bubble-2">⭐</div>
        
        <div className="gp-float gp-float--one" />
        <div className="gp-float gp-float--two" />
        <div className="gp-float gp-float--three" />

        <button className="gp-homeBtn" onClick={goHome}>
          <img src="/logo512.svg" alt="SalaryGuessr" className="gp-homeLogo" />
          <span>SalaryGuessr</span>
        </button>

        <div className="gp-card gp-resultFinal">
          <div className="gp-cardGlow" />
          <div className="gp-resultConfetti">🎉 🎊 🎉</div>
          
          <div className="gp-resultHeader">
            <span className="gp-resultTrophy">🏁</span>
            <h1 className="gp-resultTitle">PARTIE TERMINÉE</h1>
          </div>

          <div className="gp-scoreCard">
            <div className="gp-scoreValue">{score.toFixed(0)}</div>
            <div className="gp-scoreMax">/ {maxRounds * 100}</div>
            <div className="gp-scoreBadge">{performanceLevel}</div>
          </div>

          <div className="gp-progressBar">
            <div className="gp-progressFill" style={{ width: `${totalScore}%` }}>
              <div className="gp-progressGlow"></div>
            </div>
          </div>

          <div className="gp-statsGrid">
            <div className="gp-statCard">
              <div className="gp-statIcon">🎯</div>
              <div className="gp-statInfo">
                <div className="gp-statLabel">Précision moyenne</div>
                <div className="gp-statValue">{(totalScore).toFixed(1)}%</div>
              </div>
            </div>
            <div className="gp-statCard">
              <div className="gp-statIcon">📊</div>
              <div className="gp-statInfo">
                <div className="gp-statLabel">Manches jouées</div>
                <div className="gp-statValue">{maxRounds}</div>
              </div>
            </div>
          </div>

          <div className="gp-chartWrap">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={history}>
                <XAxis dataKey="round" stroke="#fff" tick={{ fill: "#fff" }} />
                <YAxis stroke="#fff" tick={{ fill: "#fff" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(20, 16, 40, 0.95)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                    borderRadius: "14px",
                  }}
                />
                <Legend />
                <Bar dataKey="estimated" name="Votre estimation" fill="#60a5fa" radius={[10, 10, 0, 0]} />
                <Bar dataKey="real" name="Salaire réel" fill="#34d399" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="gp-historyList">
            {history.map((h, i) => (
              <div key={i} className="gp-historyItem">
                <span className="gp-historyRound">#{h.round}</span>
                <span className="gp-historyTitle">{h.title.slice(0, 30)}</span>
                <span className="gp-historyVal">💡 {h.estimated.toLocaleString("fr-FR")} €</span>
                <span className="gp-historyVal">💰 {h.real.toLocaleString("fr-FR")} €</span>
              </div>
            ))}
          </div>

          <div className="gp-resultActions">
            <button
              className="gp-replayButton"
              onClick={() => { resetGameState(); setPage("settings"); }}
            >
              🔁 REJOUER
            </button>
            <button className="gp-homeButton" onClick={goHome}>🏠 ACCUEIL</button>
          </div>
        </div>
      </div>
    );
  }

  // LOADING STATE
  if (page === "playing" && (loadingJob || !currentJob)) {
    return (
      <div className="gp-container gp-container--playing">
        <div className="gp-bubble gp-bubble-1">⏳</div>
        <div className="gp-bubble gp-bubble-2">🔍</div>
        
        <div className="gp-float gp-float--one" />
        <div className="gp-float gp-float--two" />
        <div className="gp-float gp-float--three" />

        <button className="gp-homeBtn" onClick={goHome}>
          <img src="/logo512.svg" alt="SalaryGuessr" className="gp-homeLogo" />
          <span>SalaryGuessr</span>
        </button>

        <div className="gp-card gp-loadingCard">
          <div className="gp-cardGlow" />
          <div className="gp-loader">
            <span></span><span></span><span></span>
          </div>
          <div className="gp-loadingAnimation">
            <div className="gp-loadingPulse"></div>
          </div>
          <h2 className="gp-loadingTitle">🔎 Recherche d'une offre avec salaire...</h2>
          <p className="gp-loadingText">Préparation du prochain défi</p>
        </div>
      </div>
    );
  }

  // PLAYING PAGE
  const job = currentJob;
  const totalProgress = ((round) / maxRounds) * 100;
  const inputShake = shakeAnimation ? "gp-input-shake" : "";

  return (
    <div className="gp-container gp-container--playing">
      <div className="gp-bubble gp-bubble-1">🎯</div>
      <div className="gp-bubble gp-bubble-2">💪</div>
      <div className="gp-bubble gp-bubble-3">⚡</div>
      
      <div className="gp-float gp-float--one" />
      <div className="gp-float gp-float--two" />
      <div className="gp-float gp-float--three" />

      <button className="gp-homeBtn" onClick={goHome}>
        <img src="/logo512.svg" alt="SalaryGuessr" className="gp-homeLogo" />
        <span>SalaryGuessr</span>
      </button>

      <div className="gp-card gp-gameCard">
        <div className="gp-cardGlow" />
        <div className="gp-cardShine"></div>

        <div className="gp-progressSection">
          <div className="gp-roundInfo">
            <div className="gp-roundBadge">
              <span className="gp-roundIcon">🎮</span>
              <span>MANCHE {round + 1}</span>
            </div>
            <div className="gp-scoreBadge">
              <span className="gp-scoreIcon">⭐</span>
              <span>{score.toFixed(0)} pts</span>
            </div>
          </div>
          <div className="gp-progressTrack">
            <div className="gp-progressFillGame" style={{ width: `${totalProgress}%` }}>
              <div className="gp-progressGlowGame"></div>
            </div>
          </div>
          <div className="gp-progressText">{round + 1} / {maxRounds}</div>
        </div>

        {!showResult && (
          <div className="gp-jobHero" key={job?.id || round}>
            <div className="gp-jobHeader">
              <h1 className="gp-jobTitle">{job.title}</h1>
              {job.appellation && job.appellation !== job.title && (
                <p className="gp-appellation">{job.appellation}</p>
              )}
            </div>

            <div className="gp-badgesContainer">
              <div className="gp-badgeGroup gp-badgePrimary">
                {job.company && <span className="gp-badge gp-badgeCompany">🏢 {job.company}</span>}
                <span className="gp-badge gp-badgeLocation">📍 {job.location}</span>
              </div>
              <div className="gp-badgeGroup">
                {job.contractType && <span className="gp-badge">📄 {job.contractType}</span>}
                {job.experience && <span className="gp-badge">🎓 {job.experience}</span>}
                {job.nombrePostes > 1 && <span className="gp-badge">👥 {job.nombrePostes} postes</span>}
                {job.alternance && <span className="gp-badge gp-badgeSpecial">🔄 Alternance</span>}
                {job.accessibleTH && <span className="gp-badge gp-badgeSpecial">♿ Accessible TH</span>}
                {job.employeurHandiEngage && <span className="gp-badge gp-badgeSpecial">🤝 Handi-Engagé</span>}
              </div>
              <div className="gp-badgeGroup">
                {job.romeLabel && (
                  <span className="gp-badge gp-badgeRome">
                    🏷️ {job.romeLabel}
                    {job.romeCode && <span className="gp-romeCode"> · {job.romeCode}</span>}
                  </span>
                )}
                {job.sector && !job.romeLabel && <span className="gp-badge">🏭 {job.sector}</span>}
              </div>
            </div>

            <div className="gp-dateInfo">
              {job.created && <span className="gp-dateText">📅 Publié le {formatDate(job.created)}</span>}
            </div>

            <div className="gp-descriptionBox">
              <div className="gp-descriptionHeader">
                <span className="gp-descriptionIcon">📋</span>
                <span>DESCRIPTION DU POSTE</span>
              </div>
              <div className="gp-descriptionContent">{job.description}</div>
            </div>

            {!job.company && job.companyDescription && (
              <div className="gp-companyBlurb">
                <span className="gp-companyIcon">🏢</span>
                <div>
                  <strong>À propos de l'entreprise :</strong> {job.companyDescription.slice(0, 200)}
                  {job.companyDescription.length > 200 ? "…" : ""}
                </div>
              </div>
            )}
          </div>
        )}

        {!showResult && (
          <div className="gp-inputWrapper">
            <div className="gp-inputContainer">
              <span className="gp-inputIcon">💶</span>
              <input
                type="number"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && validate()}
                className={`gp-input ${inputShake}`}
                placeholder="Estimation du salaire mensuel (€/mois)"
              />
            </div>
            <button onClick={validate} className="gp-validateBtn">
              <span>✅ VALIDER</span>
              <span className="gp-btnArrow">→</span>
            </button>
          </div>
        )}

        {showResult && result && (
          <div className="gp-resultBox">
            <div className="gp-resultHeader">
              <span className="gp-resultIcon">📊</span>
              <span>RÉSULTAT</span>
            </div>
            <div className="gp-resultContent">
              <div className="gp-resultGuess">
                <span className="gp-resultLabel">💡 Votre estimation</span>
                <strong className="gp-resultValue">{Number(result.user).toLocaleString("fr-FR")} €</strong>
              </div>
              <div className="gp-resultVs">VS</div>
              <div className="gp-resultReal">
                <span className="gp-resultLabel">🎯 Salaire réel</span>
                <strong className="gp-resultValue gp-realSalary">{Number(result.real).toLocaleString("fr-FR")} €</strong>
              </div>
            </div>

            <div className="gp-resultStats">
              <div className="gp-resultStat">
                <span className="gp-statLabel">📉 Écart </span>
                <strong className="gp-statValue">{result.error}%</strong>
              </div>
              <div className="gp-resultStat">
                <span className="gp-statLabel">🏆 Score </span>
                <strong className="gp-statValue">{result.roundScore} pts</strong>
              </div>
            </div>
            {job.salary_text && (
              <div className="gp-salaryRaw">
                <span>📋</span>
                <em>Libellé original : {job.salary_text}</em>
              </div>
            )}
            {job.offerUrl && (
              <a className="gp-offerLink" href={job.offerUrl} target="_blank" rel="noopener noreferrer">
                🔗 Voir l'offre originale →
              </a>
            )}
            <button onClick={nextRound} className="gp-nextBtn">
              <span>➡️ MANCHE SUIVANTE</span>
              <span className="gp-btnArrow">→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}