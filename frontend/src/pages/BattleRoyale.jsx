import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";
import "../styles/BattleRoyale.css";
import { useSound } from "../sound/SoundProvider";
import { useSettings } from "../context/SettingsContext";
import logger from "../utils/logger";

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

/**
 * @module Pages/BattleRoyale
 */

const T = {
  fr: {
    createTab: "CRÉER",
    joinTab: "REJOINDRE",
    pseudoPlaceholder: "Votre Pseudo",
    codePlaceholder: "Code Salle",
    createBtn: "Ouvrir l'Arène",
    joinBtn: "Entrer dans l'Arène",
    lobbyTag: "SALON D'ATTENTE",
    lobbyInfo: "Partagez ce code avec vos amis",
    startBtn: (cur, max) => `Lancer (${cur}/${max})`,
    starting: "Préparation...",
    waitingHost: "En attente de l'hôte...",
    copySuccess: "Code copié.",
    copyError: "Erreur lors de la copie.",
    minPlayers: (n) => `Min ${n} joueurs requis.`,
    enterPseudo: "Entrez un pseudo.",
    enterCodeAndPseudo: "Entrez le code et votre pseudo.",
    enterValidSalary: "Entrez un salaire valide.",
    emptySlot: "Vide",
    roundLabel: "MANCHE",
    alive: "VIVANTS",
    waitingOthers: "En attente des autres joueurs...",
    eliminated: "Vous êtes éliminé",
    spectator: "Spectateur de l'arène...",
    estimateLabel: "ESTIMATION",
    validateBtn: "VALIDER",
    resultsTitle: "Verdict",
    eliminatedMsg: "VOUS AVEZ ÉTÉ ÉLIMINÉ",
    survivedMsg: "VOUS AVEZ SURVÉCU",
    realSalaryLabel: "Salaire Réel",
    eliminatedRound: "ÉLIMINÉS CE TOUR",
    survivors: "SURVIVANTS",
    none: "Aucun",
    eliminatedTag: "ÉLIMINÉ",
    nextRoundIn: (s) => `Prochaine manche dans ${s}s`,
    errorGeneric: "Une erreur est survenue.",
    winnerTag: "VAINQUEUR",
    endTag: "FIN DE PARTIE",
    allEliminated: "Tout le monde a été éliminé !",
    youWon: "Vous avez gagné !",
    victoryOf: (w) => `Victoire de ${w}`,
    backHome: "Retour à l'Accueil",
    replay: "Rejouer",
    guessError: (v) => `${v}€ d'écart`,
    hostTag: "(H)",
    show: "Afficher",
    hide: "Masquer",
    copy: "Copier",
    permis: "Permis:",
    alternance: "Alternance",
    accessible: "Accessible TH",
    handi: "Handi-Engagé",
  },
  en: {
    createTab: "CREATE",
    joinTab: "JOIN",
    pseudoPlaceholder: "Your Nickname",
    codePlaceholder: "Room Code",
    createBtn: "Open the Arena",
    joinBtn: "Enter the Arena",
    lobbyTag: "WAITING LOBBY",
    lobbyInfo: "Share this code with your friends",
    startBtn: (cur, max) => `Start (${cur}/${max})`,
    starting: "Starting...",
    waitingHost: "Waiting for host...",
    copySuccess: "Code copied.",
    copyError: "Error copying.",
    minPlayers: (n) => `Min ${n} players required.`,
    enterPseudo: "Enter a nickname.",
    enterCodeAndPseudo: "Enter the code and your nickname.",
    enterValidSalary: "Enter a valid salary.",
    emptySlot: "Empty",
    roundLabel: "ROUND",
    alive: "ALIVE",
    waitingOthers: "Waiting for other players...",
    eliminated: "You have been eliminated",
    spectator: "Spectating the arena...",
    estimateLabel: "ESTIMATE",
    validateBtn: "SUBMIT",
    resultsTitle: "Verdict",
    eliminatedMsg: "YOU HAVE BEEN ELIMINATED",
    survivedMsg: "YOU HAVE SURVIVED",
    realSalaryLabel: "Actual Salary",
    eliminatedRound: "ELIMINATED THIS ROUND",
    survivors: "SURVIVORS",
    none: "None",
    eliminatedTag: "ELIMINATED",
    nextRoundIn: (s) => `Next round in ${s}s`,
    errorGeneric: "An error occurred.",
    winnerTag: "WINNER",
    endTag: "GAME OVER",
    allEliminated: "Everyone has been eliminated!",
    youWon: "You won!",
    victoryOf: (w) => `${w} wins!`,
    backHome: "Back to Home",
    replay: "Play Again",
    guessError: (v) => `${v}€ off`,
    hostTag: "(H)",
    show: "Show",
    hide: "Hide",
    copy: "Copy",
    permis: "License:",
    alternance: "Apprenticeship",
    accessible: "Accessible",
    handi: "Disability Inclusive",
  },
};

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
 * Toolbar for room code display and management.
 * 
 * @component
 * @param {Object} props
 * @param {string} props.roomCode - The room identification code.
 * @param {boolean} props.revealed - Whether the code is visible.
 * @param {function(): void} props.onToggleReveal - Toggle visibility.
 * @param {function(): void} props.onCopy - Copy code to clipboard.
 * @param {boolean} [props.compact] - Compact layout flag.
 */
function BrRoomCodeToolbar({ roomCode, revealed, onToggleReveal, onCopy, compact, language }) {
  const t = T[language] || T.fr;
  if (!roomCode) return null;
  return (
    <div className={`br-room-code-toolbar ${compact ? "compact" : ""}`}>
      <button onClick={onCopy} className="br-icon-btn" title={t.copy}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
      </button>
      <span className={`br-code-text ${!revealed ? "masked" : ""}`}>{roomCode}</span>
      <button onClick={onToggleReveal} className="br-icon-btn" title={revealed ? t.hide : t.show}>
        {revealed ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
        )}
      </button>
    </div>
  );
}

/**
 * Main Battle Royale Component.
 * Handles socket connections, room creation/joining, and real-time multiplayer gameplay.
 * 
 * @component
 * @returns {JSX.Element} The rendered Battle Royale page.
 */
export default function BattleRoyale() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { convertToBase, convertFromBase, getSalaryLabel, language } = useSettings();
  const t = T[language] || T.fr;

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
  const playRef = useRef(play);

  useEffect(() => { playerIdRef.current = playerId; }, [playerId]);
  useEffect(() => { playerNameRef.current = playerName; }, [playerName]);
  useEffect(() => { playRef.current = play; }, [play]);
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 8000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("room_created", (data) => {
      setNotice(null); setRoomCodeRevealed(false); setRoomCode(data.code);
      setPlayerId(data.player_id); setHostId(data.player_id); setIsHost(true); setView("waiting");
    });
    socket.on("joined", (data) => {
      setNotice(null); setRoomCodeRevealed(false);
      setPlayerId(data.player_id); setRoomCode(data.code); setView("waiting");
    });
    socket.on("room_state", (data) => {
      setPlayers(data.players); setGameState(data.game_state); setHostId(data.host_id || null);
      setHostName(data.host_name || ""); setRoomCode(data.code);
      setMinPlayers(data.min_players); setMaxPlayers(data.max_players); setRound(data.round || 0);
      if (data.game_state === "playing") { setView("playing"); setCurrentOffer(data.current_offer); }
      else if (data.game_state === "waiting") setView("waiting");
    });
    socket.on("player_joined", (data) => setPlayers(data.players));
    socket.on("game_started", (data) => {
      setIsStartingGame(false); setCurrentOffer(data.offer); setGameState("playing");
      setRound(data.round || 1); setRoundResults(null); setHasGuessed(false); setWinner(null);
      setIsWaitingNextRound(false); setView("playing"); logger.info("Battle Royale game started");
      playRef.current("gamestart");
    });
    socket.on("round_start", (data) => {
      setHasGuessed(false); setRoundResults(null); setIsWaitingNextRound(false); setNextRoundTimer(null);
      setTimer(data.duration); setRound(data.round || 1);
      if (data.offer) setCurrentOffer(data.offer); setGameState("playing");
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
      setRoundResults(data); setRound(data.round || 1); setGameState("round_end");
      setIsWaitingNextRound(true); setNextRoundTimer(data.pause_duration ?? null);
      setPlayers(prev => prev.map(p => ({ ...p, is_alive: p.is_alive !== false && !eliminatedSet.has(p.id) })));
    });
    socket.on("between_round_update", (data) => setNextRoundTimer(data.remaining));
    socket.on("game_over", (data) => {
      const normalizedWinner = String(data.winner || "").trim().toLowerCase();
      const normalizedPlayer = String(playerNameRef.current || "").trim().toLowerCase();
      playRef.current(normalizedWinner && normalizedWinner === normalizedPlayer ? "victory" : "elimination");
      setWinner(data.winner); setGameState("game_over"); setIsWaitingNextRound(false); setNextRoundTimer(null);
    });
    socket.on("action_confirmed", (data) => { if (data.action === "submit_guess") { setHasGuessed(true); setGuess(""); } });
    socket.on("error", (data) => { setIsStartingGame(false); setNotice({ variant: "error", message: data?.message || t.errorGeneric }); });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, []);

    /**
   * Emits a 'create_room' event to the server.
   */
  const createRoom = () => {
    if (!playerName.trim()) return setNotice({ variant: "error", message: t.enterPseudo });
    socketRef.current.emit("create_room", { game_type: "battle_royale", name: playerName });
  };

    /**
   * Emits a 'join_room' event to the server with the entered code.
   */
  const joinRoom = () => {
    if (!roomCode.trim() || !playerName.trim()) return setNotice({ variant: "error", message: t.enterCodeAndPseudo });
    socketRef.current.emit("join_room", { code: roomCode.toUpperCase(), name: playerName });
  };

    /**
   * Starts the game for all players in the room (Host only).
   */
  const startGame = () => {
    if (players.length < minPlayers) return setNotice({ variant: "warning", message: t.minPlayers(minPlayers) });
    setIsStartingGame(true);
    socketRef.current.emit("start_game", { code: roomCode });
  };

    /**
   * Submits a salary guess for the current round.
   */
  const submitGuess = () => {
    if (!guess || hasGuessed) return;
    const displayVal = parseInt(guess);
    if (isNaN(displayVal) || displayVal <= 0) return setNotice({ variant: "error", message: t.enterValidSalary });
    const baseVal = convertToBase(displayVal);
    socketRef.current.emit("game_action", { code: roomCode, action: "submit_guess", data: { guess: baseVal } });
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setNotice({ variant: "success", message: t.copySuccess });
    } catch { setNotice({ variant: "error", message: t.copyError }); }
  };

  const renderSetup = () => (
    <div className="tile-grid">
      <div className="tile span-12 tile-animate" style={{ animationDelay: '0.04s' }}>
        <div key="setup" className="tile-content br-setup-view">
          <h1 className="gp-titleMain">Battle Royale</h1>
          <div className="br-setup-form">
            <div className="br-tabs">
              <button className={activeTab === "create" ? "active" : ""} onClick={() => setActiveTab("create")}>
                {t.createTab}
                {activeTab === "create" && <motion.div layoutId="br-tab-bg" className="br-tab-indicator" />}
              </button>
              <button className={activeTab === "join" ? "active" : ""} onClick={() => setActiveTab("join")}>
                {t.joinTab}
                {activeTab === "join" && <motion.div layoutId="br-tab-bg" className="br-tab-indicator" />}
              </button>
            </div>
            <input className="br-input-field" placeholder={t.pseudoPlaceholder} value={playerName} onChange={e => setPlayerName(e.target.value)} maxLength={20} />
            <div className="br-tab-content-wrap">
              <AnimatePresence mode="popLayout">
                {activeTab === "join" ? (
                  <motion.div key="join-input" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} style={{ width: '100%' }}>
                    <input className="br-input-field" placeholder={t.codePlaceholder} value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} maxLength={6} />
                  </motion.div>
                ) : (
                  <motion.div key="create-spacer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="br-tab-spacer" />
                )}
              </AnimatePresence>
            </div>
            <button className="hp-btn-primary" onClick={activeTab === "create" ? createRoom : joinRoom} disabled={!playerName || (activeTab === "join" && !roomCode)}>
              {activeTab === "create" ? t.createBtn : t.joinBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLobby = () => {
    const totalSlots = Math.max(players.length, minPlayers);
    const slots = Array.from({ length: totalSlots });
    return (
      <div className="tile-grid">
        <div className="tile span-12 tile-animate" style={{ animationDelay: '0.04s' }}>
          <div key="lobby-header" className="tile-content br-lobby-header-tile">
            <div className="br-lobby-header">
              <span className="br-lobby-tag">{t.lobbyTag}</span>
              <BrRoomCodeToolbar roomCode={roomCode} revealed={roomCodeRevealed} onToggleReveal={() => setRoomCodeRevealed(!roomCodeRevealed)} onCopy={copyRoomCode} language={language} />
              <p className="br-lobby-info">{t.lobbyInfo}</p>
            </div>
            <div className="br-lobby-actions">
              {isHost ? (
                <button className="hp-btn-primary" onClick={startGame} disabled={players.length < minPlayers || isStartingGame}>
                  {isStartingGame ? t.starting : t.startBtn(players.length, maxPlayers)}
                </button>
              ) : <div className="br-waiting-host">{t.waitingHost}</div>}
            </div>
          </div>
        </div>
        {slots.map((_, i) => {
          const p = players[i];
          return (
            <div key={i} className={`tile span-2 ${!p ? "tile-empty-slot" : ""} ${p?.id === playerId ? "me" : ""} tile-animate`} style={{ animationDelay: `${0.08 + (i * 0.04)}s` }}>
              <div className="tile-content br-player-tile">
                {p ? <span className="br-player-name">{p.name} {p.id === hostId && t.hostTag}</span> : <span className="br-player-empty">{t.emptySlot}</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
      <div className="tile-grid">
        <div className="tile span-12 tile-animate" style={{ animationDelay: '0.04s' }}>
          <div className="tile-content br-top-bar no-padding">
            <div className="br-round-badge">{t.roundLabel} {round}</div>
            <div className="br-timer-badge urgent"><span className="br-timer-big">{timer}</span>s</div>
            <div className="br-alive-badge">{aliveCount} {t.alive}</div>
          </div>
        </div>

        {gameState === "game_over" ? (
          <div className="tile span-12 tile-animate" style={{ animationDelay: '0.08s' }}>
            <div className="tile-content br-victory-screen">
              <div className="br-winner-podium">
                <span className="br-winner-tag">{winner ? t.winnerTag : t.endTag}</span>
                <h1 className="gp-titleMain">
                  {!winner ? t.allEliminated
                    : playerName && winner.trim().toLowerCase() === playerName.trim().toLowerCase() ? t.youWon
                    : t.victoryOf(winner)}
                </h1>
              </div>
              <div className="br-victory-actions">
                <button className="hp-btn-primary" onClick={() => navigate("/")}>{t.backHome}</button>
                <button className="hp-btn-secondary" onClick={() => window.location.reload()}>{t.replay}</button>
              </div>
            </div>
          </div>
        ) : gameState === "round_end" && roundResults ? (
          <div className="tile span-12 tile-animate" style={{ animationDelay: '0.08s' }}>
            <div className="tile-content br-results-screen">
              <h2 className="br-results-title">{t.resultsTitle}</h2>
              {isEliminated && eliminatedIds.has(playerId)
                ? <div className="br-status-msg eliminated">{t.eliminatedMsg}</div>
                : <div className="br-status-msg survived">{t.survivedMsg}</div>}
              <div className="br-real-salary">
                {convertFromBase(roundResults.real_salary)?.toLocaleString(undefined, { maximumFractionDigits: 0 })} €
                <span className="br-real-label">{t.realSalaryLabel} ({getSalaryLabel()})</span>
              </div>
              <div className="br-round-summary">
                <div className="br-summary-box eliminated">
                  <span className="label">{t.eliminatedRound}</span>
                  <div className="names">
                    {elimNames.length > 0 ? elimNames.join(", ") : (
                      rankings.filter(r => eliminatedIds.has(String(r.player_id || r.id))).map(r => r.name).join(", ") || t.none
                    )}
                  </div>
                </div>
                <div className="br-summary-box alive">
                  <span className="label">{t.survivors}</span>
                  <div className="count">{aliveCount}</div>
                </div>
              </div>
              <div className="br-ranking-list">
                {[...rankings].sort((a, b) => Math.abs(a.error || 0) - Math.abs(b.error || 0)).map((r, i) => {
                  const rId = r.player_id || r.id;
                  const isPlayerElim = eliminatedIds.has(String(rId));
                  return (
                    <div key={rId} className={`br-rank-item ${isPlayerElim ? "eliminated" : ""} ${String(rId) === String(playerId) ? "me" : ""}`}>
                      <span className="br-rank-pos">#{i + 1}</span>
                      <span className="br-rank-name">{r.name}</span>
                      <div className="br-rank-data">
                        <span className="br-rank-guess">{convertFromBase(r.guess)?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "???"} €</span>
                        <span className="br-rank-error">{t.guessError(convertFromBase(Math.abs(r.error || 0)).toFixed(0))}</span>
                      </div>
                      {isPlayerElim && <span className="br-elim-tag">{t.eliminatedTag}</span>}
                    </div>
                  );
                })}
              </div>
              {nextRoundTimer && <div className="br-next-timer">{t.nextRoundIn(nextRoundTimer)}</div>}
            </div>
          </div>
        ) : (
          <>
            <div className="tile span-8 row-span-2 tile-animate" style={{ animationDelay: '0.08s' }}>
              <div className="tile-content gp-job-side">
                <h2 className="gp-job-title">{currentOffer?.title}</h2>
                <div className="badgesContainer">
                  {currentOffer?.company && <span className="gp-badge gp-badgeCompany">{currentOffer.company}</span>}
                  <span className="gp-badge gp-badgeLocation">{currentOffer?.location}</span>
                  {currentOffer?.contractType && <span className="gp-badge">{currentOffer.contractType}</span>}
                  {currentOffer?.contractHours && <span className="gp-badge">{currentOffer.contractHours}</span>}
                  {currentOffer?.experience && <span className="gp-badge">{currentOffer.experience}</span>}
                  {currentOffer?.qualification && <span className="gp-badge">{currentOffer.qualification}</span>}
                  {currentOffer?.permis && <span className="gp-badge">{t.permis} {currentOffer.permis}</span>}
                  {currentOffer?.alternance && <span className="gp-badge gp-badgeSpecial">{t.alternance}</span>}
                  {currentOffer?.accessibleTH && <span className="gp-badge gp-badgeSpecial">{t.accessible}</span>}
                  {currentOffer?.employeurHandiEngage && <span className="gp-badge gp-badgeSpecial">{t.handi}</span>}
                </div>
                <div className="gp-job-desc">{currentOffer?.description}</div>
              </div>
            </div>
            <div className="tile span-4 row-span-2 tile-animate" style={{ animationDelay: '0.12s' }}>
              <div className="tile-content gp-action-side">
                {isEliminated ? (
                  <div className="br-waiting-card"><h3>{t.eliminated}</h3><p>{t.spectator}</p></div>
                ) : !hasGuessed ? (
                  <div className="gp-input-area">
                    <span className="gp-input-label">{t.estimateLabel} {getSalaryLabel().toUpperCase()}</span>
                    <div className="gp-input-wrap">
                      <input type="number" placeholder={`Ex: ${getSalaryLabel().toLowerCase().includes("annual") || getSalaryLabel().toLowerCase().includes("annuel") ? "35000" : "3500"}`} value={guess} onChange={e => setGuess(e.target.value)} onKeyDown={e => e.key === "Enter" && submitGuess()} />
                      <span className="gp-currency">€</span>
                    </div>
                    <button className="hp-btn-primary" onClick={submitGuess} disabled={!guess}>{t.validateBtn}</button>
                  </div>
                ) : (
                  <div className="br-waiting-card"><div className="br-loader-dots">{t.waitingOthers}</div></div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="page-wrapper br-page">
      <BrNotice notice={notice} onDismiss={() => setNotice(null)} />
      {view === "join" ? renderSetup() : view === "waiting" ? renderLobby() : renderPlaying()}
    </div>
  );
}