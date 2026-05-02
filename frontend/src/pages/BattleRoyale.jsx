import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "../styles/BattleRoyale.css";
import { useSound } from "../sound/SoundProvider";

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function BrNotice({ notice, onDismiss }) {
  if (!notice) return null;
  const variant = notice.variant || "error";
  return (
    <div className={`br-notice br-notice--${variant}`} role="alert">
      <span className="br-notice-text">{notice.message}</span>
      <button type="button" className="br-notice-dismiss" onClick={onDismiss} aria-label="Fermer">
        ×
      </button>
    </div>
  );
}

function IconCopy() {
  return (
    <svg className="br-room-code-svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
      />
    </svg>
  );
}

function IconEye() {
  return (
    <svg className="br-room-code-svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none">
      <path
        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg className="br-room-code-svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none">
      <path
        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a21.77 21.77 0 015.06-7.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a21.53 21.53 0 01-4.94 8M14.12 14.12a3 3 0 11-4.24-4.24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BrRoomCodeToolbar({ roomCode, revealed, onToggleReveal, onCopy, compact }) {
  if (!roomCode) return null;
  const chipClass =
    compact
      ? "br-room-code-chip br-room-code-chip--compact"
      : "br-room-code-chip";
  return (
    <div className={`br-room-code-toolbar${compact ? " br-room-code-toolbar--compact" : ""}`}>
      <button
        type="button"
        className="br-room-code-icon-btn"
        onClick={onCopy}
        aria-label="Copier le code de la salle"
        title="Copier le code"
      >
        <IconCopy />
      </button>
      <strong
        className={`${chipClass}${revealed ? "" : " br-room-code-chip--masked"}`}
        aria-label={revealed ? `Code ${roomCode}` : "Code masqué"}
      >
        {roomCode}
      </strong>
      <button
        type="button"
        className="br-room-code-icon-btn"
        onClick={onToggleReveal}
        aria-label={revealed ? "Masquer le code" : "Afficher le code"}
        title={revealed ? "Masquer le code" : "Afficher le code"}
      >
        {revealed ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  );
}

export default function BattleRoyale() {
  const navigate = useNavigate();
  const { play } = useSound();
  
  // UI State
  const [view, setView] = useState("join");
  const [activeTab, setActiveTab] = useState("create");
  
  // Room State
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [hostId, setHostId] = useState(null);
  const [hostName, setHostName] = useState("");
  const [minPlayers, setMinPlayers] = useState(5);
  const [maxPlayers, setMaxPlayers] = useState(50);
  
  // Game State
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
  const playRef = useRef(play);

  useEffect(() => {
    playerIdRef.current = playerId;
  }, [playerId]);

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  useEffect(() => {
    playRef.current = play;
  }, [play]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 8000);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connectée");
    });

    socket.on("room_created", (data) => {
      console.log("🏠 Salle créée:", data.code);
      setNotice(null);
      setRoomCodeRevealed(false);
      setRoomCode(data.code);
      setPlayerId(data.player_id);
      setHostId(data.player_id);
      setIsHost(true);
    });

    socket.on("joined", (data) => {
      console.log("📦 Rejoint la salle:", data);
      setNotice(null);
      setRoomCodeRevealed(false);
      setPlayerId(data.player_id);
    });

    socket.on("room_state", (data) => {
      console.log("📊 État de la salle:", data);
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
      console.log("👥 Joueur rejoint:", data.players);
      setPlayers(data.players);
    });

    socket.on("game_started", (data) => {
      console.log("🎮 Partie démarrée");
      setIsStartingGame(false);
      setCurrentOffer(data.offer);
      setGameState("playing");
      setRound(data.round || 1);
      setRoundResults(null);
      setHasGuessed(false);
      setWinner(null);
      setIsWaitingNextRound(false);
      setView("playing");
    });

    socket.on("round_start", (data) => {
      console.log("⏰ Round start, durée:", data.duration);
      setHasGuessed(false);
      setRoundResults(null);
      setIsWaitingNextRound(false);
      setNextRoundTimer(null);
      setTimer(data.duration);
      setRound(data.round || 1);
      if (data.offer) {
        setCurrentOffer(data.offer);
      }
      setGameState("playing");
    });

    socket.on("start_game_pending", () => {
      setIsStartingGame(true);
    });

    socket.on("start_game_failed", (data) => {
      setIsStartingGame(false);
      if (data?.message) {
        setNotice({ variant: "warning", message: data.message });
      }
    });

    socket.on("timer_update", (data) => {
      setTimer(data.remaining);
    });

    socket.on("round_end", (data) => {
      console.log("📊 Fin du round:", data);
      const eliminatedSet = new Set(
        data.eliminated_ids || (data.eliminated_id ? [data.eliminated_id] : [])
      );
      const pid = playerIdRef.current;
      const isCurrentPlayerEliminated = pid != null && eliminatedSet.has(pid);
      playRef.current(isCurrentPlayerEliminated ? "elimination" : "success");
      setRoundResults(data);
      setRound(data.round || 1);
      setGameState("round_end");
      setIsWaitingNextRound(true);
      setNextRoundTimer(data.pause_duration ?? null);
      setPlayers(prevPlayers =>
        prevPlayers.map(p => ({
          ...p,
          is_alive: p.is_alive !== false && !eliminatedSet.has(p.id)
        }))
      );
    });

    socket.on("between_round_update", (data) => {
      setNextRoundTimer(data.remaining);
    });

    socket.on("game_over", (data) => {
      console.log("🏆 Game over, vainqueur:", data.winner);
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
      const message =
        typeof data?.message === "string" && data.message.trim()
          ? data.message
          : "Une erreur est survenue.";
      setNotice({ variant: "error", message });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    setIsHost(Boolean(hostId && playerId && hostId === playerId));
  }, [hostId, playerId]);

  const dismissNotice = () => setNotice(null);

  const copyRoomCode = useCallback(async () => {
    if (!roomCode) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(roomCode);
      } else {
        const ta = document.createElement("textarea");
        ta.value = roomCode;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setNotice({ variant: "success", message: "Code copié dans le presse-papiers." });
    } catch {
      setNotice({ variant: "error", message: "Copie automatique impossible. Copie le code à la main." });
    }
  }, [roomCode]);

  const toggleRoomCodeReveal = () => setRoomCodeRevealed((v) => !v);

  const createRoom = () => {
    if (!playerName.trim()) {
      setNotice({ variant: "error", message: "Entrez un pseudo." });
      return;
    }
    if (!socketRef.current) return;
    socketRef.current.emit("create_room", { 
      game_type: "battle_royale", 
      name: playerName 
    });
  };

  const joinRoom = () => {
    if (!roomCode.trim() || !playerName.trim()) {
      setNotice({ variant: "error", message: "Entrez le code de la salle et votre pseudo." });
      return;
    }
    if (!socketRef.current) return;
    socketRef.current.emit("join_room", { 
      code: roomCode.toUpperCase(), 
      name: playerName 
    });
  };

  const startGame = () => {
    if (players.length < minPlayers) {
      setNotice({
        variant: "warning",
        message: `Minimum ${minPlayers} joueurs requis. Actuellement : ${players.length}.`,
      });
      return;
    }
    if (!socketRef.current) return;
    play("gamestart");
    setIsStartingGame(true);
    socketRef.current.emit("start_game", { code: roomCode });
  };

  const submitGuess = () => {
    if (!guess || hasGuessed) return;
    const val = parseInt(guess);
    if (isNaN(val) || val <= 0) {
      setNotice({ variant: "error", message: "Entrez un salaire valide (nombre positif)." });
      return;
    }
    if (!socketRef.current) return;
    socketRef.current.emit("game_action", {
      code: roomCode,
      action: "submit_guess",
      data: { guess: val }
    });
  };

  const startNextRoundNow = () => {
    if (!socketRef.current) return;
    socketRef.current.emit("start_next_round", { code: roomCode });
  };

  // ==========================================================
  // ÉCRAN DE CRÉATION / REJOINDRE
  // ==========================================================
  if (view === "join") {
    return (
      <div className="br-container">
        <div className="gp-bubble gp-bubble-1">⚔️</div>
        <div className="gp-bubble gp-bubble-2">🏆</div>
        <div className="gp-bubble gp-bubble-3">🎯</div>
        <div className="gp-float gp-float--one" />
        <div className="gp-float gp-float--two" />
        <div className="gp-float gp-float--three" />
        <button className="gp-homeBtn" onClick={() => navigate("/")}>
          <img src="/logo512.svg" alt="SalaryGuessr" className="gp-homeLogo" />
          <span>SalaryGuessr</span>
        </button>

        <BrNotice notice={notice} onDismiss={dismissNotice} />

        <div className="br-card">
          <div className="gp-cardGlow" />
          <div className="gp-cardShine"></div>
          
          <div className="br-header">
            <span className="br-icon">⚔️</span>
            <h1 className="br-title">BATTLE ROYALE</h1>
          </div>
          
          <div className="br-description">
            <p>Affronte d'autres joueurs dans une élimination à mort !</p>
            <p>Chaque round, tous estiment le même salaire.</p>
            <p>Celui qui s'en éloigne le plus est <strong>ÉLIMINÉ</strong>.</p>
            <p>Le dernier survivant remporte la partie !</p>
          </div>
          
          <div className="br-tabs">
            <button 
              className={`br-tab ${activeTab === "create" ? "active" : ""}`} 
              onClick={() => setActiveTab("create")}
            >
              🎮 CRÉER
            </button>
            <button 
              className={`br-tab ${activeTab === "join" ? "active" : ""}`} 
              onClick={() => setActiveTab("join")}
            >
              🚪 REJOINDRE
            </button>
          </div>
          
          <input
            type="text"
            placeholder="✏️ Ton pseudo"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="br-input"
            maxLength={20}
          />
          
          {activeTab === "create" ? (
            <button onClick={createRoom} className="br-btn-primary">
              🎮 CRÉER UNE PARTIE
            </button>
          ) : (
            <>
              <input
                type="text"
                placeholder="🔑 Code de la partie"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="br-input"
                maxLength={6}
              />
              <button onClick={joinRoom} className="br-btn-primary">
                🚪 REJOINDRE LA PARTIE
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ==========================================================
  // ÉCRAN D'ATTENTE EN SALLE
  // ==========================================================
  if (view === "waiting") {
    const readyToStart = isHost && players.length >= minPlayers;
    
    return (
      <div className="br-container">
        <div className="gp-bubble gp-bubble-1">⚔️</div>
        <div className="gp-bubble gp-bubble-2">🏆</div>
        <div className="gp-bubble gp-bubble-3">🎯</div>
        <div className="gp-float gp-float--one" />
        <div className="gp-float gp-float--two" />
        <div className="gp-float gp-float--three" />
        <button className="gp-homeBtn" onClick={() => navigate("/")}>
          <img src="/logo512.svg" alt="SalaryGuessr" className="gp-homeLogo" />
          <span>SalaryGuessr</span>
        </button>

        <BrNotice notice={notice} onDismiss={dismissNotice} />

        <div className="br-card">
          <div className="gp-cardGlow" />
          <div className="gp-cardShine"></div>
          
          <div className="br-room-code-display">
            <span>CODE DE LA SALLE</span>
            <BrRoomCodeToolbar
              roomCode={roomCode}
              revealed={roomCodeRevealed}
              onToggleReveal={toggleRoomCodeReveal}
              onCopy={copyRoomCode}
              compact={false}
            />
          </div>
          
          <div className="br-players-list">
            <h3>JOUEURS ({players.length} / {maxPlayers})</h3>
            <div className="br-players-grid">
              {players.map(p => (
                <div key={p.id} className="br-player-card">
                  <span>{p.name}</span>
                  {p.id === playerId && <span className="br-badge">TOI</span>}
                  {p.id === hostId && <span className="br-crown">👑</span>}
                </div>
              ))}
            </div>
          </div>
          
          {isHost ? (
            readyToStart ? (
              <button
                onClick={startGame}
                className="br-btn-primary"
                disabled={isStartingGame}
              >
                {isStartingGame ? "⏳ PRÉPARATION DE LA PARTIE..." : `🚀 LANCER LA PARTIE (${players.length} joueurs)`}
              </button>
            ) : (
              <div className="br-waiting-message">
                ⏳ Attends {minPlayers - players.length} joueur(s) supplémentaire(s)...
              </div>
            )
          ) : (
            <div className="br-waiting-message">
              ⏳ En attente que l'hôte lance la partie...
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================================
  // ÉCRAN DE JEU
  // ==========================================================
  const eliminatedIds = new Set(
    roundResults?.eliminated_ids ||
    (roundResults?.eliminated_id ? [roundResults.eliminated_id] : [])
  );
  const eliminatedNames = roundResults?.eliminated_names ||
    (roundResults?.eliminated_name ? [roundResults.eliminated_name] : []);
  const displayedRound = Math.max(
    roundResults?.round ?? 0,
    round ?? 0,
    1
  );
  const currentPlayer = players.find((p) => p.id === playerId);
  const isPlayerAlive = currentPlayer ? currentPlayer.is_alive !== false : true;
  const isEliminated = !isPlayerAlive || eliminatedIds.has(playerId);
  const alivePlayersCount = players.filter(p => p.is_alive !== false).length;
  
  return (
    <div className="br-container">
      <div className="gp-bubble gp-bubble-1">⚔️</div>
      <div className="gp-bubble gp-bubble-2">🏆</div>
      <div className="gp-bubble gp-bubble-3">🎯</div>
      <div className="gp-float gp-float--one" />
      <div className="gp-float gp-float--two" />
      <div className="gp-float gp-float--three" />
      
      <button className="gp-homeBtn" onClick={() => navigate("/")}>
        <img src="/logo512.svg" alt="SalaryGuessr" className="gp-homeLogo" />
        <span>SalaryGuessr</span>
      </button>

      <BrNotice notice={notice} onDismiss={dismissNotice} />

      <div className="br-game-layout">
        {/* Sidebar des joueurs */}
        <div className="br-sidebar">
          <div className="br-sidebar-header">🏆 JOUEURS</div>
          <div className="br-sidebar-players">
            <div className="br-sidebar-section">
              <div className="br-sidebar-title">En vie ({alivePlayersCount})</div>
              {players.filter(p => p.is_alive !== false).map(p => (
                <div key={p.id} className="br-sidebar-player alive">
                  <span className="br-dot green"></span>
                  <span>{p.name}</span>
                  {p.id === playerId && <span className="br-badge-small">toi</span>}
                </div>
              ))}
            </div>
            {players.filter(p => p.is_alive === false).length > 0 && (
              <div className="br-sidebar-section">
                <div className="br-sidebar-title">Éliminés 💀</div>
                {players.filter(p => p.is_alive === false).map(p => (
                  <div key={p.id} className="br-sidebar-player dead">
                    <span className="br-dot red"></span>
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Zone principale */}
        <div className="br-main">
          <div className="br-game-header">
            <div className="br-room-code-header-slot">
              <span className="br-room-code-header-label">Salle</span>
              <BrRoomCodeToolbar
                roomCode={roomCode}
                revealed={roomCodeRevealed}
                onToggleReveal={toggleRoomCodeReveal}
                onCopy={copyRoomCode}
                compact
              />
            </div>
            {gameState === "round_end" && isWaitingNextRound ? (
              <div className="br-next-round-timer">
                Début de la prochaine manche dans {nextRoundTimer ?? 0} s
              </div>
            ) : (
              <div className={`br-timer ${timer <= 10 && timer > 0 ? "urgent" : ""}`}>⏱️ {timer}s</div>
            )}
            <div className="br-round">Manche {displayedRound}</div>
          </div>
          
          {/* GAME OVER */}
          {gameState === "game_over" && winner && (
            <div className="br-winner-card">
              <div className="gp-cardGlow" />
              <div className="gp-cardShine"></div>
              <div className="br-trophy-icon">🏆</div>
              <h2>{winner} remporte la partie !</h2>
              <button onClick={() => navigate("/")} className="br-btn-primary">
                🏠 ACCUEIL
              </button>
            </div>
          )}
          
          {/* ROUND RESULTS */}
          {roundResults && !winner && (
            <div className="br-results-card">
              <div className="gp-cardGlow" />
              <div className="gp-cardShine"></div>
              
              <div className="br-results-header">
                📊 RÉSULTATS DE LA MANCHE {roundResults.round}
              </div>
              
              <div className="br-real-salary">
                💰 Salaire réel: 
                <span>
                  <strong> {roundResults.real_salary?.toLocaleString()} €</strong>
                </span>
              </div>
              
              <div className="br-eliminated-info">
                ❌ {eliminatedNames.length > 1 ? "ÉLIMINÉS " : "ÉLIMINÉ "}:{" "}
                <strong>{eliminatedNames.join(", ") || "Aucun"}</strong>
              </div>
              
              <div className="br-rankings">
                <div className="br-ranking-header">
                  <span>#</span><span>JOUEUR</span><span>ESTIMATION</span><span>ÉCART</span>
                </div>
                {roundResults.results.map((r, idx) => (
                  <div 
                    key={r.player_id} 
                    className={`br-ranking-row ${
                      eliminatedIds.has(r.player_id) ? "eliminated" : ""
                    } ${r.player_id === playerId ? "current" : ""}`}
                  >
                    <span>{idx + 1}</span>
                    <span>{r.name}</span>
                    <span>{r.guess != null ? `${r.guess.toLocaleString()} €` : "Pas de réponse"}</span>
                    <span className={eliminatedIds.has(r.player_id) ? "error-high" : "error-low"}>
                      {Number.isFinite(r.error) ? `${Math.abs(r.error).toFixed(1)}€` : "∞"}
                    </span>
                  </div>
                ))}
              </div>
              
              {isWaitingNextRound && isHost && !roundResults?.will_game_over && (
                <button className="br-btn-primary" onClick={startNextRoundNow}>
                  ⚡ Lancer la prochaine manche
                </button>
              )}
            </div>
          )}
          
          {/* ACTIVE ROUND - AFFICHAGE COMPLET COMME DANS HIGHLOWGAME */}
          {gameState === "playing" && currentOffer && !roundResults && (
            <div className="br-offer-card">
              <div className="gp-cardGlow" />
              <div className="gp-cardShine"></div>
              
              <div className="br-card-header">
                <span className="gp-badge">OFFRE À DEVINER</span>
                <span className="br-question-badge">❓ Salaire ?</span>
              </div>
              
              <h2 className="br-offer-title">{currentOffer.intitule || currentOffer.title}</h2>
              {currentOffer.appellationlibelle && currentOffer.appellationlibelle !== currentOffer.intitule && (
                <div className="br-offer-sub">{currentOffer.appellationlibelle}</div>
              )}
              
              {/* Badges complets comme dans HighLowGame */}
              <div className="badgesContainer">
                <div className="gp-badgeGroup gp-badgePrimary">
                  {currentOffer.entreprise?.nom && <span className="gp-badge gp-badgeCompany">🏢 {currentOffer.entreprise.nom}</span>}
                  <span className="gp-badge gp-badgeLocation">📍 {currentOffer.lieuTravail?.libelle || "Localisation inconnue"}</span>
                </div>
                
                <div className="gp-badgeGroup">
                  {currentOffer.typeContratLibelle && <span className="gp-badge">📄 {currentOffer.typeContratLibelle}</span>}
                  {currentOffer.dureeTravailLibelle && <span className="gp-badge">⏱️ {currentOffer.dureeTravailLibelle}</span>}
                  {currentOffer.dureeTravailLibelleConverti && <span className="gp-badge">💼 {currentOffer.dureeTravailLibelleConverti}</span>}
                  {currentOffer.experienceLibelle && <span className="gp-badge">🎓 {currentOffer.experienceLibelle}</span>}
                  {currentOffer.qualificationLibelle && <span className="gp-badge">📊 {currentOffer.qualificationLibelle}</span>}
                  {currentOffer.nombrePostes > 1 && <span className="gp-badge">👥 {currentOffer.nombrePostes} postes</span>}
                </div>
                
                <div className="gp-badgeGroup">
                  {currentOffer.deplacementLibelle && currentOffer.deplacementLibelle !== "Jamais" && <span className="gp-badge">🚗 {currentOffer.deplacementLibelle}</span>}
                  {currentOffer.permis && currentOffer.permis.length > 0 && (
                    <span className="gp-badge">🚗 Permis: {currentOffer.permis.map(p => p.libelle).join(", ")}</span>
                  )}
                  {currentOffer.alternance && <span className="gp-badge gp-badgeSpecial">🔄 Alternance</span>}
                  {currentOffer.accessibleTH && <span className="gp-badge gp-badgeSpecial">♿ Accessible TH</span>}
                  {currentOffer.employeurHandiEngage && <span className="gp-badge gp-badgeSpecial">🤝 Handi-Engagé</span>}
                </div>
                
                <div className="gp-badgeGroup">
                  {currentOffer.romeLibelle && (
                    <span className="gp-badge gp-badgeRome">
                      🏷️ {currentOffer.romeLibelle}
                      {currentOffer.romeCode && <span className="gp-romeCode"> · {currentOffer.romeCode}</span>}
                    </span>
                  )}
                  {currentOffer.secteurActiviteLibelle && !currentOffer.romeLibelle && <span className="gp-badge">🏭 {currentOffer.secteurActiviteLibelle}</span>}
                </div>
              </div>
              
              <div className="br-offer-desc">
                <div className="br-desc-header">📋 DESCRIPTION</div>
                <p>{currentOffer.description || "Aucune description disponible"}</p>
              </div>
              
              {isEliminated ? (
                <div className="br-eliminated-block">Vous êtes éliminé</div>
              ) : !hasGuessed ? (
                <div className="br-guess-area">
                  <input
                    type="number"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitGuess()}
                    placeholder="Estimation (€/mois)"
                    className="br-input"
                  />
                  <button onClick={submitGuess} className="br-validate-btn">
                    ✅ VALIDER
                  </button>
                </div>
              ) : (
                <div className="br-waiting">
                  ✅ En attente des autres joueurs...
                </div>
              )}
            </div>
          )}
          
          {/* SPECTATOR MODE */}
          {isEliminated && !winner && gameState !== "playing" && (
            <div className="br-spectator-card">
              <div className="gp-cardGlow" />
              <div className="gp-cardShine"></div>
              <div className="br-spectator-content">
                <span>👀</span>
                <h3>Mode spectateur</h3>
                <p>Vous avez été éliminé à la manche {displayedRound}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}