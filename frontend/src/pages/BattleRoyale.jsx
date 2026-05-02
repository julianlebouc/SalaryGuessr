import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "../styles/BattleRoyale.css";

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function BattleRoyale() {
  const navigate = useNavigate();
  
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
  
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"]
    });
    
    socketRef.current.on("connect", () => {
      console.log("✅ Socket connectée");
    });
    
    socketRef.current.on("room_created", (data) => {
      console.log("🏠 Salle créée:", data.code);
      setRoomCode(data.code);
      setPlayerId(data.player_id);
      setHostId(data.player_id);
      setIsHost(true);
    });
    
    socketRef.current.on("joined", (data) => {
      console.log("📦 Rejoint la salle:", data);
      setPlayerId(data.player_id);
    });
    
    socketRef.current.on("room_state", (data) => {
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
    
    socketRef.current.on("player_joined", (data) => {
      console.log("👥 Joueur rejoint:", data.players);
      setPlayers(data.players);
    });
    
    socketRef.current.on("game_started", (data) => {
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
    
    socketRef.current.on("round_start", (data) => {
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

    socketRef.current.on("start_game_pending", () => {
      setIsStartingGame(true);
    });

    socketRef.current.on("start_game_failed", (data) => {
      setIsStartingGame(false);
      if (data?.message) {
        alert(data.message);
      }
    });
    
    socketRef.current.on("timer_update", (data) => {
      setTimer(data.remaining);
    });
    
    socketRef.current.on("round_end", (data) => {
      console.log("📊 Fin du round:", data);
      setRoundResults(data);
      setRound(data.round || 1);
      setGameState("round_end");
      setIsWaitingNextRound(true);
      setNextRoundTimer(data.pause_duration ?? null);

      const eliminatedSet = new Set(
        data.eliminated_ids || (data.eliminated_id ? [data.eliminated_id] : [])
      );
      setPlayers(prevPlayers =>
        prevPlayers.map(p => ({
          ...p,
          is_alive: p.is_alive !== false && !eliminatedSet.has(p.id)
        }))
      );
    });

    socketRef.current.on("between_round_update", (data) => {
      setNextRoundTimer(data.remaining);
    });
    
    socketRef.current.on("game_over", (data) => {
      console.log("🏆 Game over, vainqueur:", data.winner);
      setWinner(data.winner);
      setGameState("game_over");
      setIsWaitingNextRound(false);
      setNextRoundTimer(null);
    });
    
    socketRef.current.on("action_confirmed", (data) => {
      if (data.action === "submit_guess") {
        setHasGuessed(true);
        setGuess("");
      }
    });
    
    socketRef.current.on("error", (data) => {
      setIsStartingGame(false);
      alert(data.message);
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [playerName]);

  useEffect(() => {
    setIsHost(Boolean(hostId && playerId && hostId === playerId));
  }, [hostId, playerId]);

  const createRoom = () => {
    if (!playerName.trim()) {
      alert("Entrez un pseudo");
      return;
    }
    socketRef.current.emit("create_room", { 
      game_type: "battle_royale", 
      name: playerName 
    });
  };

  const joinRoom = () => {
    if (!roomCode.trim() || !playerName.trim()) {
      alert("Entrez le code et votre pseudo");
      return;
    }
    socketRef.current.emit("join_room", { 
      code: roomCode.toUpperCase(), 
      name: playerName 
    });
  };

  const startGame = () => {
    if (players.length < minPlayers) {
      alert(`Minimum ${minPlayers} joueurs requis. Actuellement: ${players.length}`);
      return;
    }
    setIsStartingGame(true);
    socketRef.current.emit("start_game", { code: roomCode });
  };

  const submitGuess = () => {
    if (!guess || hasGuessed) return;
    const val = parseInt(guess);
    if (isNaN(val) || val <= 0) {
      alert("Entrez un salaire valide");
      return;
    }
    socketRef.current.emit("game_action", {
      code: roomCode,
      action: "submit_guess",
      data: { guess: val }
    });
  };

  const startNextRoundNow = () => {
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
        
        <div className="br-card">
          <div className="gp-cardGlow" />
          <div className="gp-cardShine"></div>
          
          <div className="br-room-code-display">
            <span>CODE DE LA SALLE</span>
            <strong>{roomCode}</strong>
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
            <div className="br-room-code">Salle: {roomCode}</div>
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