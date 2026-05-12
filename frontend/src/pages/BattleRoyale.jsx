import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";
import "../styles/BattleRoyale.css";
import { useSound } from "../sound/SoundProvider";

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

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
  const [gameState, setGameState] = useState("waiting");
  const [currentOffer, setCurrentOffer] = useState(null);
  const [timer, setTimer] = useState(0);
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState("");
  const [hasGuessed, setHasGuessed] = useState(false);
  const [roundResults, setRoundResults] = useState(null);
  const [winner, setWinner] = useState(null);
  const [nextRoundTimer, setNextRoundTimer] = useState(null);

  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("room_created", (data) => {
      setRoomCode(data.code);
      setPlayerId(data.player_id);
      setHostId(data.player_id);
      setIsHost(true);
      setView("waiting");
    });

    socket.on("joined", (data) => {
      setPlayerId(data.player_id);
      setRoomCode(data.code);
      setView("waiting");
    });

    socket.on("room_state", (data) => {
      setPlayers(data.players);
      setGameState(data.game_state);
      setHostId(data.host_id);
      if (data.game_state === "playing") {
        setView("playing");
        setCurrentOffer(data.current_offer);
      }
    });

    socket.on("game_started", (data) => {
      setCurrentOffer(data.offer);
      setGameState("playing");
      setRound(data.round || 1);
      setView("playing");
      play("gamestart");
    });

    socket.on("round_start", (data) => {
      setHasGuessed(false);
      setRoundResults(null);
      setTimer(data.duration);
      setRound(data.round || 1);
      setCurrentOffer(data.offer);
      setGameState("playing");
    });

    socket.on("timer_update", (data) => {
      setTimer(data.remaining);
    });

    socket.on("round_end", (data) => {
      setRoundResults(data);
      setGameState("round_end");
      setNextRoundTimer(data.pause_duration);
      play("roundEnd2");
    });

    socket.on("between_round_update", (data) => {
      setNextRoundTimer(data.remaining);
    });

    socket.on("game_over", (data) => {
      setWinner(data.winner);
      setGameState("game_over");
      play("victory");
    });

    socket.on("action_confirmed", (data) => {
      if (data.action === "submit_guess") {
        setHasGuessed(true);
      }
    });

    socket.on("player_joined", (data) => {
        // Explicitly handle player joined if room_state isn't enough
        setPlayers(data.players);
    });

    return () => {
      socket.disconnect();
    };
  }, [play]);

  const createRoom = () => {
    if (playerName.trim()) {
      socketRef.current.emit("create_room", { 
        game_type: "battle_royale", 
        name: playerName 
      });
    }
  };

  const joinRoom = () => {
    if (roomCode.trim() && playerName.trim()) {
      socketRef.current.emit("join_room", { 
        code: roomCode.toUpperCase(), 
        name: playerName 
      });
    }
  };

  const startGame = () => {
    socketRef.current.emit("start_game", { code: roomCode });
  };

  const submitGuess = () => {
    if (guess && !hasGuessed) {
      socketRef.current.emit("game_action", { 
        code: roomCode, 
        action: "submit_guess", 
        data: { guess: parseInt(guess) } 
      });
      setGuess("");
    }
  };

  return (
    <motion.div className="page-wrapper br-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <AnimatePresence mode="wait">
        {view === "join" && (
          <motion.div key="join" className="br-setup-view">
            <h1 className="gp-titleMain">Battle Royale</h1>
            <div className="br-setup-form">
              <div className="br-tabs">
                <button 
                  className={activeTab === "create" ? "active" : ""} 
                  onClick={() => setActiveTab("create")}
                >
                  Créer un Salon
                </button>
                <button 
                  className={activeTab === "join" ? "active" : ""} 
                  onClick={() => setActiveTab("join")}
                >
                  Rejoindre
                </button>
              </div>
              <input 
                className="br-input-field" 
                placeholder="Votre Pseudo" 
                value={playerName} 
                onChange={e => setPlayerName(e.target.value)} 
              />
              {activeTab === "join" && (
                <input 
                  className="br-input-field" 
                  placeholder="CODE" 
                  value={roomCode} 
                  onChange={e => setRoomCode(e.target.value.toUpperCase())} 
                />
              )}
              <button 
                className="hp-btn-primary" 
                onClick={activeTab === "create" ? createRoom : joinRoom}
                disabled={!playerName || (activeTab === "join" && !roomCode)}
              >
                {activeTab === "create" ? "Ouvrir l'Arène" : "Entrer dans l'Arène"}
              </button>
            </div>
          </motion.div>
        )}

        {view === "waiting" && (
          <motion.div key="waiting" className="br-lobby-view">
            <div className="br-lobby-header">
              <span className="br-lobby-tag">SALON D'ATTENTE</span>
              <div className="br-room-code">{roomCode}</div>
              <p className="br-lobby-info">Partagez ce code avec vos amis</p>
            </div>

            <div className="br-player-grid">
              {players.map(p => (
                <motion.div 
                  key={p.id} 
                  className={`br-player-card ${p.id === playerId ? "me" : ""}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="br-player-avatar">👤</div>
                  <div className="br-player-name">
                    {p.name} {p.id === hostId && <span className="br-host-icon">👑</span>}
                  </div>
                </motion.div>
              ))}
              {players.length < 2 && (
                <div className="br-player-card placeholder">
                  <div className="br-player-avatar">?</div>
                  <div className="br-player-name">En attente...</div>
                </div>
              )}
            </div>

            {isHost ? (
              <button 
                className="hp-btn-primary" 
                onClick={startGame}
                disabled={players.length < 1} // Should be 2 for real BR but 1 for testing
              >
                Lancer le Combat
              </button>
            ) : (
              <div className="br-waiting-host">En attente du chef de salon...</div>
            )}
          </motion.div>
        )}

        {view === "playing" && (
          <motion.div key="playing" className="br-playing-view">
            <div className="br-top-bar">
              <div className="br-timer-badge">⏱️ {timer}s</div>
              <div className="br-round-badge">MANCHE {round}</div>
              <div className="br-alive-badge">👥 {players.filter(p => p.is_alive !== false).length} VIVANTS</div>
            </div>

            {gameState === "game_over" ? (
              <div className="br-victory-screen">
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <span className="br-victory-crown">👑</span>
                  <h1 className="gp-titleMain">VICTOIRE</h1>
                  <div className="br-winner-name">{winner}</div>
                  <button className="hp-btn-primary" onClick={() => window.location.reload()}>Rejouer</button>
                </motion.div>
              </div>
            ) : gameState === "round_end" && roundResults ? (
              <div className="br-results-screen">
                <h2 className="br-results-title">Verdict</h2>
                <div className="br-real-salary">
                  {roundResults.real_salary.toLocaleString()} €
                  <span className="br-real-label">Salaire Brut Réel</span>
                </div>
                
                <div className="br-ranking-list">
                  {roundResults.rankings.map((r, idx) => (
                    <motion.div 
                      key={r.id} 
                      className={`br-rank-item ${roundResults.eliminated_ids?.includes(r.id) ? "eliminated" : ""} ${r.id === playerId ? "me" : ""}`}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <span className="br-rank-pos">#{idx + 1}</span>
                      <span className="br-rank-name">{r.name}</span>
                      <span className="br-rank-guess">{r.guess.toLocaleString()} €</span>
                      <span className="br-rank-error">{r.error}% d'écart</span>
                      {roundResults.eliminated_ids?.includes(r.id) && <span className="br-elim-tag">ÉLIMINÉ</span>}
                    </motion.div>
                  ))}
                </div>
                <div className="br-next-timer">
                  Prochaine manche dans <strong>{nextRoundTimer}s</strong>
                </div>
              </div>
            ) : (
              <div className="br-game-grid">
                <div className="br-offer-info">
                  <h2 className="br-offer-title">{currentOffer?.title}</h2>
                  <div className="gp-badgeGroup">
                    <span className="gp-badge">🏢 {currentOffer?.company}</span>
                    <span className="gp-badge">📍 {currentOffer?.location}</span>
                  </div>
                  <div className="br-description">{currentOffer?.description}</div>
                </div>

                <div className="br-guess-area">
                  {!hasGuessed ? (
                    <div className="gp-input-area">
                      <span className="gp-input-label">VOTRE ESTIMATION</span>
                      <div className="gp-input-wrap">
                        <input 
                          type="number" 
                          placeholder="Ex: 4200" 
                          value={guess} 
                          onChange={e => setGuess(e.target.value)} 
                          onKeyDown={e => e.key === "Enter" && submitGuess()} 
                          autoFocus
                        />
                        <span className="gp-currency">€</span>
                      </div>
                      <button className="hp-btn-primary" onClick={submitGuess} disabled={!guess}>
                        Valider l'Estimation
                      </button>
                    </div>
                  ) : (
                    <div className="br-waiting-text">
                      <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        Estimation envoyée. En attente des autres joueurs...
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}