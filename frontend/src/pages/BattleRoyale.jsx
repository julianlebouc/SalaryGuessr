import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";
import "../styles/BattleRoyale.css";
import { useSound } from "../sound/SoundProvider";
import logger from "../utils/logger";

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

/**
 * Display a notice banner.
 */
function BrNotice({ notice, onDismiss }) {
  if (!notice) return null;
  const variant = notice.variant || "error";
  return (
    <div className={`br-notice br-notice--${variant}`}>
      <span className="br-notice-text">{notice.message}</span>
      <button onClick={onDismiss} className="br-notice-dismiss">×</button>
    </div>
  );
}

/**
 * Toolbar for room code.
 */
function BrRoomCodeToolbar({ roomCode, revealed, onToggleReveal, onCopy, compact }) {
  if (!roomCode) return null;
  return (
    <div className={`br-room-code-toolbar ${compact ? "compact" : ""}`}>
      <button onClick={onCopy} className="br-icon-btn" title="Copier">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      </button>
      <span className={`br-code-text ${!revealed ? "masked" : ""}`}>
        {roomCode}
      </span>
      <button onClick={onToggleReveal} className="br-icon-btn" title={revealed ? "Masquer" : "Afficher"}>
        {revealed ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        )}
      </button>
    </div>
  );
}

/**
 * Main Battle Royale Component
 */
export default function BattleRoyale() {
  const navigate = useNavigate();
  const { play } = useSound();

  const [view, setView] = useState("join");
  const [activeTab, setActiveTab] = useState("create");

  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [hostId, setHostId] = useState(null);
  const [hostName, setHostName] = useState("");
  const [minPlayers, setMinPlayers] = useState(5);
  const [maxPlayers, setMaxPlayers] = useState(50);

  const [gameState, setGameState] = useState("waiting");
  const [currentOffer, setCurrentOffer] = useState(null);
  const [timer, setTimer] = useState(0);
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState("");
  const [hasGuessed, setHasGuessed] = useState(false);
  const [roundResults, setRoundResults] = useState(null);
  const [winner, setWinner] = useState(null);
  const [isWaitingNextRound, setIsWaitingNextRound] = useState(false);
  const [nextRoundTimer, setNextRoundTimer] = useState(null);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [notice, setNotice] = useState(null);
  const [roomCodeRevealed, setRoomCodeRevealed] = useState(false);

  const socketRef = useRef(null);
  const playerIdRef = useRef(null);
  const playerNameRef = useRef("");
  const roomCodeRef = useRef("");
  const gameIdRef = useRef(null);
  const playRef = useRef(play);

  useEffect(() => { playerIdRef.current = playerId; }, [playerId]);
  useEffect(() => { playerNameRef.current = playerName; }, [playerName]);
  useEffect(() => { playRef.current = play; }, [play]);
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 8000);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("room_created", (data) => {
      setNotice(null);
      setRoomCodeRevealed(false);
      setRoomCode(data.code);
      setPlayerId(data.player_id);
      setHostId(data.player_id);
      setIsHost(true);
      setView("waiting");
    });

    socket.on("joined", (data) => {
      setNotice(null);
      setRoomCodeRevealed(false);
      setPlayerId(data.player_id);
      setRoomCode(data.code);
      setView("waiting");
    });

    socket.on("room_state", (data) => {
      setPlayers(data.players);
      setGameState(data.game_state);
      setHostId(data.host_id || null);
      setHostName(data.host_name || "");
      setRoomCode(data.code);
      setMinPlayers(data.min_players);
      setMaxPlayers(data.max_players);
      setRound(data.round || 0);

      if (data.game_state === "playing") {
        setView("playing");
        setCurrentOffer(data.current_offer);
      } else if (data.game_state === "waiting") {
        setView("waiting");
      }
    });

    socket.on("player_joined", (data) => {
      setPlayers(data.players);
    });

    socket.on("game_started", (data) => {
      setIsStartingGame(false);
      setCurrentOffer(data.offer);
      setGameState("playing");
      setRound(data.round || 1);
      setRoundResults(null);
      setHasGuessed(false);
      setWinner(null);
      setIsWaitingNextRound(false);
      setView("playing");
      logger.info("Battle Royale game started");
      playRef.current("gamestart");
    });

    socket.on("round_start", (data) => {
      setHasGuessed(false);
      setRoundResults(null);
      setIsWaitingNextRound(false);
      setNextRoundTimer(null);
      setTimer(data.duration);
      setRound(data.round || 1);
      if (data.offer) setCurrentOffer(data.offer);
      setGameState("playing");
    });

    socket.on("start_game_pending", () => setIsStartingGame(true));

    socket.on("start_game_failed", (data) => {
      setIsStartingGame(false);
      if (data?.message) setNotice({ variant: "warning", message: data.message });
    });

    socket.on("timer_update", (data) => setTimer(data.remaining));

    socket.on("round_end", (data) => {
      const eliminatedSet = new Set(data.eliminated_ids || (data.eliminated_id ? [data.eliminated_id] : []));
      const pid = playerIdRef.current;
      const isCurrentPlayerEliminated = pid != null && eliminatedSet.has(pid);
      playRef.current(isCurrentPlayerEliminated ? "elimination" : "success");
      setRoundResults(data);
      setRound(data.round || 1);
      setGameState("round_end");
      setIsWaitingNextRound(true);
      setNextRoundTimer(data.pause_duration ?? null);
      setPlayers(prev => prev.map(p => ({
        ...p,
        is_alive: p.is_alive !== false && !eliminatedSet.has(p.id)
      })));
    });

    socket.on("between_round_update", (data) => setNextRoundTimer(data.remaining));

    socket.on("game_over", (data) => {
      const normalizedWinner = String(data.winner || "").trim().toLowerCase();
      const normalizedPlayer = String(playerNameRef.current || "").trim().toLowerCase();
      playRef.current(normalizedWinner && normalizedWinner === normalizedPlayer ? "victory" : "elimination");
      setWinner(data.winner);
      setGameState("game_over");
      setIsWaitingNextRound(false);
      setNextRoundTimer(null);
    });

    socket.on("action_confirmed", (data) => {
      if (data.action === "submit_guess") {
        setHasGuessed(true);
        setGuess("");
      }
    });

    socket.on("error", (data) => {
      setIsStartingGame(false);
      setNotice({ variant: "error", message: data?.message || "Une erreur est survenue." });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const createRoom = () => {
    if (!playerName.trim()) return setNotice({ variant: "error", message: "Entrez un pseudo." });
    socketRef.current.emit("create_room", { game_type: "battle_royale", name: playerName });
  };

  const joinRoom = () => {
    if (!roomCode.trim() || !playerName.trim()) return setNotice({ variant: "error", message: "Entrez le code et votre pseudo." });
    socketRef.current.emit("join_room", { code: roomCode.toUpperCase(), name: playerName });
  };

  const startGame = () => {
    if (players.length < minPlayers) return setNotice({ variant: "warning", message: `Min ${minPlayers} joueurs requis.` });
    setIsStartingGame(true);
    socketRef.current.emit("start_game", { code: roomCode });
  };

  const submitGuess = () => {
    if (!guess || hasGuessed) return;
    const val = parseInt(guess);
    if (isNaN(val) || val <= 0) return setNotice({ variant: "error", message: "Entrez un salaire valide." });
    socketRef.current.emit("game_action", { code: roomCode, action: "submit_guess", data: { guess: val } });
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setNotice({ variant: "success", message: "Code copié." });
    } catch {
      setNotice({ variant: "error", message: "Erreur lors de la copie." });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  // UI RENDERERS
  const renderSetup = () => (
    <motion.div key="setup" className="br-setup-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <h1 className="gp-titleMain">Battle Royale</h1>
      <div className="br-setup-form">
        <div className="br-tabs">
          <button
            className={activeTab === "create" ? "active" : ""}
            onClick={() => setActiveTab("create")}
          >
            CRÉER
            {activeTab === "create" && (
              <motion.div layoutId="br-tab-bg" className="br-tab-indicator" />
            )}
          </button>
          <button
            className={activeTab === "join" ? "active" : ""}
            onClick={() => setActiveTab("join")}
          >
            REJOINDRE
            {activeTab === "join" && (
              <motion.div layoutId="br-tab-bg" className="br-tab-indicator" />
            )}
          </button>
        </div>

        <input
          className="br-input-field"
          placeholder="Votre Pseudo"
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          maxLength={20}
        />

        <div className="br-tab-content-wrap">
          <AnimatePresence>
            {activeTab === "join" ? (
              <motion.div
                key="join-input"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{ width: '100%' }}
              >
                <input
                  className="br-input-field"
                  placeholder="Code Salle"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </motion.div>
            ) : (
              <motion.div
                key="create-spacer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="br-tab-spacer"
              />
            )}
          </AnimatePresence>
        </div>

        <button
          className="hp-btn-primary"
          onClick={activeTab === "create" ? createRoom : joinRoom}
          disabled={!playerName || (activeTab === "join" && !roomCode)}
        >
          {activeTab === "create" ? "Ouvrir l'Arène" : "Entrer dans l'Arène"}
        </button>
      </div>
    </motion.div>
  );

  const renderLobby = () => (
    <motion.div key="lobby" className="br-lobby-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="br-lobby-header">
        <span className="br-lobby-tag">SALON D'ATTENTE</span>
        <BrRoomCodeToolbar roomCode={roomCode} revealed={roomCodeRevealed} onToggleReveal={() => setRoomCodeRevealed(!roomCodeRevealed)} onCopy={copyRoomCode} />
        <p className="br-lobby-info">Partagez ce code avec vos amis</p>
      </div>

      <div className="br-player-grid">
        {players.map(p => (
          <div key={p.id} className={`br-player-card ${p.id === playerId ? "me" : ""}`}>
            <span className="br-player-name">{p.name} {p.id === hostId && "(Hôte)"}</span>
          </div>
        ))}
      </div>

      {isHost ? (
        <button className="hp-btn-primary" onClick={startGame} disabled={players.length < minPlayers || isStartingGame}>
          {isStartingGame ? "Préparation..." : `Lancer (${players.length}/${maxPlayers})`}
        </button>
      ) : (
        <div className="br-waiting-host">En attente de l'hôte...</div>
      )}
    </motion.div>
  );

  const renderPlaying = () => {
    const elimArray = roundResults?.eliminated_ids || (roundResults?.eliminated_id ? [roundResults.eliminated_id] : []);
    const eliminatedIds = new Set(elimArray.map(id => String(id)));

    const elimNames = roundResults?.eliminated_names || (roundResults?.eliminated_name ? [roundResults.eliminated_name] : []);
    const rankings = roundResults?.results || roundResults?.rankings || [];

    const currentPlayer = players.find(p => String(p.id) === String(playerId));
    const isAlive = currentPlayer ? currentPlayer.is_alive !== false : true;
    const isEliminated = !isAlive || eliminatedIds.has(String(playerId));
    const aliveCount = players.filter(p => p.is_alive !== false).length;

    return (
      <motion.div key="playing" className="br-playing-view">
        <div className="br-top-bar">
          <div className="br-round-badge">MANCHE {round}</div>
          <div className="br-timer-badge urgent"><span className="br-timer-big">{timer}</span>s</div>
          <div className="br-alive-badge">{aliveCount} VIVANTS</div>
        </div>

        {gameState === "game_over" ? (
          <div className="br-victory-screen">
            <div className="br-winner-podium">
              <span className="br-winner-tag">VAINQUEUR</span>
              <h1 className="gp-titleMain">Victoire de {winner}</h1>
            </div>
            <div className="br-victory-actions">
              <button className="hp-btn-primary" onClick={() => navigate("/")}>Retour à l'Accueil</button>
              <button className="hp-btn-secondary" onClick={() => window.location.reload()}>Rejouer</button>
            </div>
          </div>
        ) : gameState === "round_end" && roundResults ? (
          <div className="br-results-screen">
            <h2 className="br-results-title">Verdict</h2>

            {isEliminated && eliminatedIds.has(playerId) ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="br-status-msg eliminated">
                VOUS AVEZ ÉTÉ ÉLIMINÉ
              </motion.div>
            ) : (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="br-status-msg survived">
                VOUS AVEZ SURVÉCU
              </motion.div>
            )}

            <div className="br-real-salary">
              {roundResults.real_salary?.toLocaleString(undefined, { maximumFractionDigits: 0 })} €
              <span className="br-real-label">Salaire Réel</span>
            </div>

            <div className="br-round-summary">
              <div className="br-summary-box eliminated">
                <span className="label">ÉLIMINÉS CE TOUR</span>
                <div className="names">
                  {elimNames.length > 0 ? elimNames.join(", ") : (
                    rankings.filter(r => eliminatedIds.has(String(r.player_id || r.id))).map(r => r.name).join(", ") || "Aucun"
                  )}
                </div>
              </div>
              <div className="br-summary-box alive">
                <span className="label">SURVIVANTS</span>
                <div className="count">{aliveCount}</div>
              </div>
            </div>

            <div className="br-ranking-list">
              {[...rankings]
                .sort((a, b) => {
                  const aErr = Math.abs(a.error || 0);
                  const bErr = Math.abs(b.error || 0);
                  return aErr - bErr;
                })
                .map((r, i) => {
                  const rId = r.player_id || r.id;
                  const isPlayerElim = eliminatedIds.has(String(rId));
                  return (
                    <div key={rId} className={`br-rank-item ${isPlayerElim ? "eliminated" : ""} ${String(rId) === String(playerId) ? "me" : ""}`}>
                      <span className="br-rank-pos">#{i + 1}</span>
                      <span className="br-rank-name">{r.name}</span>
                      <div className="br-rank-data">
                        <span className="br-rank-guess">{r.guess?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "???"} €</span>
                        <span className="br-rank-error">{Math.abs(r.error || 0).toFixed(0)}€ d'écart</span>
                      </div>
                      {isPlayerElim && <span className="br-elim-tag">ÉLIMINÉ</span>}
                    </div>
                  );
                })}
            </div>
            {nextRoundTimer && <div className="br-next-timer">Prochaine manche dans <strong>{nextRoundTimer}s</strong></div>}
          </div>
        ) : (
          <div className="gp-game-grid">
            <div className="gp-job-side">
              <h2 className="gp-job-title">{currentOffer?.intitule || currentOffer?.title}</h2>
              <div className="badgesContainer">
                {currentOffer?.entreprise?.nom && <span className="gp-badge gp-badgeCompany">{currentOffer.entreprise.nom}</span>}
                <span className="gp-badge gp-badgeLocation">{currentOffer?.lieuTravail?.libelle || currentOffer?.location}</span>
                {currentOffer?.typeContratLibelle && <span className="gp-badge">{currentOffer.typeContratLibelle}</span>}
                {currentOffer?.dureeTravailLibelle && <span className="gp-badge">{currentOffer.dureeTravailLibelle}</span>}
                {currentOffer?.experienceLibelle && <span className="gp-badge">{currentOffer.experienceLibelle}</span>}
              </div>
              <div className="gp-job-desc">{currentOffer?.description}</div>
            </div>

            <div className="gp-action-side">
              {isEliminated ? (
                <div className="br-waiting-card"><h3>Vous êtes éliminé</h3><p>Spectateur de l'arène...</p></div>
              ) : !hasGuessed ? (
                <div className="gp-input-area">
                  <span className="gp-input-label">VOTRE ESTIMATION BRUTE</span>
                  <div className="gp-input-wrap">
                    <input type="number" placeholder="Ex: 3500" value={guess} onChange={e => setGuess(e.target.value)} onKeyDown={e => e.key === "Enter" && submitGuess()} autoFocus />
                    <span className="gp-currency">€</span>
                  </div>
                  <button className="hp-btn-primary" onClick={submitGuess} disabled={!guess}>VALIDER</button>
                </div>
              ) : (
                <div className="br-waiting-card"><div className="br-loader-dots">En attente des autres joueurs...</div></div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="page-wrapper br-page">
      <BrNotice notice={notice} onDismiss={() => setNotice(null)} />
      <AnimatePresence mode="wait">
        {view === "join" ? renderSetup() : view === "waiting" ? renderLobby() : renderPlaying()}
      </AnimatePresence>
    </div>
  );
}