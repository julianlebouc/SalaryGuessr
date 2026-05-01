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
  const [minPlayers, setMinPlayers] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(10);
  
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
    });
    
    socketRef.current.on("joined", (data) => {
      console.log("📦 Rejoint la salle:", data);
      setPlayerId(data.player_id);
    });
    
    socketRef.current.on("room_state", (data) => {
      console.log("📊 État de la salle:", data);
      setPlayers(data.players);
      setGameState(data.game_state);
      setIsHost(data.host_name === playerName);
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
      setCurrentOffer(data.offer);
      setGameState("playing");
      setRound(1);
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
      setTimer(data.duration);
      setGameState("playing");
    });
    
    socketRef.current.on("timer_update", (data) => {
      setTimer(data.remaining);
    });
    
    socketRef.current.on("round_end", (data) => {
      console.log("📊 Fin du round:", data);
      setRoundResults(data);
      setGameState("round_end");
      setIsWaitingNextRound(true);
      
      const updatedPlayers = players.map(p => ({
        ...p,
        is_alive: p.id !== data.eliminated_id
      }));
      setPlayers(updatedPlayers);
    });
    
    socketRef.current.on("new_round", (data) => {
      console.log("🔄 Nouveau round:", data.round);
      setCurrentOffer(data.offer);
      setRound(data.round);
      setRoundResults(null);
      setHasGuessed(false);
      setIsWaitingNextRound(false);
      setGameState("playing");
    });
    
    socketRef.current.on("game_over", (data) => {
      console.log("🏆 Game over, vainqueur:", data.winner);
      setWinner(data.winner);
      setGameState("game_over");
      setIsWaitingNextRound(false);
    });
    
    socketRef.current.on("action_confirmed", (data) => {
      if (data.action === "submit_guess") {
        setHasGuessed(true);
        setGuess("");
      }
    });
    
    socketRef.current.on("error", (data) => {
      alert(data.message);
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [playerName]);

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
                  {p.name === "host" && <span className="br-crown">👑</span>}
                </div>
              ))}
            </div>
          </div>
          
          {isHost ? (
            readyToStart ? (
              <button onClick={startGame} className="br-btn-primary">
                🚀 LANCER LA PARTIE ({players.length} joueurs)
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
  const isEliminated = roundResults && roundResults.eliminated_id === playerId;
  const alivePlayersCount = players.filter(p => p.is_alive !== false).length;
  
  return (
    <div className="br-container">
      <div className="gp-bubble gp-bubble-1">⚔️</div>
      <div className="gp-bubble gp-bubble-2">🏆</div>
      <div className="gp-bubble gp-bubble-3">🎯</div>
      <div className="gp-float gp-float--one" />
      <div className="gp-float gp-float--two" />
      <div className="gp-float gp-float--three" />
      
      <button className="br-home-btn" onClick={() => navigate("/")}>
        <img src="/logo512.svg" alt="SalaryGuessr" className="br-home-logo" />
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
            <div className={`br-timer ${timer <= 10 && timer > 0 ? "urgent" : ""}`}>⏱️ {timer}s</div>
            <div className="br-round">Manche {roundResults?.round || round || 1}</div>
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
                💰 Salaire réel: <strong>{roundResults.real_salary?.toLocaleString()} €</strong>
              </div>
              
              <div className="br-eliminated-info">
                ❌ ÉLIMINÉ: <strong>{roundResults.eliminated_name}</strong>
              </div>
              
              <div className="br-rankings">
                <div className="br-ranking-header">
                  <span>#</span><span>JOUEUR</span><span>ESTIMATION</span><span>ÉCART</span>
                </div>
                {roundResults.results.map((r, idx) => (
                  <div 
                    key={r.player_id} 
                    className={`br-ranking-row ${
                      r.player_id === roundResults.eliminated_id ? "eliminated" : ""
                    } ${r.player_id === playerId ? "current" : ""}`}
                  >
                    <span>{idx + 1}</span>
                    <span>{r.name}</span>
                    <span>{r.guess?.toLocaleString() || "Pas de réponse"} €</span>
                    <span className={r.player_id === roundResults.eliminated_id ? "error-high" : "error-low"}>
                      {r.error === Infinity ? "∞" : `${Math.abs(r.error).toFixed(1)}%`}
                    </span>
                  </div>
                ))}
              </div>
              
              {isWaitingNextRound && !isEliminated && (
                <div className="br-waiting-next">
                  Prochaine manche dans quelques secondes...
                </div>
              )}
            </div>
          )}
          
          {/* ACTIVE ROUND - AFFICHAGE COMPLET COMME DANS HIGHLOWGAME */}
          {gameState === "playing" && currentOffer && !roundResults && !isEliminated && (
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
              
              {!hasGuessed ? (
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
          {isEliminated && !winner && (
            <div className="br-spectator-card">
              <div className="gp-cardGlow" />
              <div className="gp-cardShine"></div>
              <div className="br-spectator-content">
                <span>👀</span>
                <h3>Mode spectateur</h3>
                <p>Vous avez été éliminé à la manche {roundResults?.round || round}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}