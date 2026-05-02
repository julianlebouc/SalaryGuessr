import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ModeSelectPage.css";

export default function ModeSelectPage() {
  const navigate = useNavigate();
  const [hoveredMode, setHoveredMode] = useState(null);

  const modes = [
    {
      id: "classic",
      title: "CLASSIQUE",
      icon: "🎯",
      description: "Devine le salaire exact d'une offre d'emploi",
      features: ["Estimation précise", "Score sur 100 points", "5 à 50 manches"],
      color: "#4f46e5",
      route: "/game",
    },
    {
      id: "highlow",
      title: "HIGH / LOW",
      icon: "⬆️⬇️",
      description: "Compare deux offres et devine laquelle est la mieux payée",
      features: ["Comparaison rapide", "Score infini", "Challenge de mémoire"],
      color: "#ec4899",
      route: "/highlow",
    },
    {
      id: "battleroyale",
      title: "BATTLE ROYALE",
      icon: "⚔️",
      description: "Affronte d'autres joueurs dans une élimination à mort",
      features: ["Multijoueur", "Élimination", "Dernier survivant"],
      color: "#f59e0b",
      route: "/battleroyale",
    },
  ];

  return (
    <div className="mode-container">
      <div className="gp-bubble gp-bubble-1">🎮</div>
      <div className="gp-bubble gp-bubble-2">💰</div>
      <div className="gp-bubble gp-bubble-3">⚡</div>
      <div className="gp-bubble gp-bubble-4">🎯</div>
      
      <div className="gp-float gp-float--one" />
      <div className="gp-float gp-float--two" />
      <div className="gp-float gp-float--three" />

      <button className="mode-home-btn" onClick={() => navigate("/")}>
        <img src="/logo512.svg" alt="SalaryGuessr" className="mode-home-logo" />
        <span>SalaryGuessr</span>
      </button>

      <div className="mode-card">
        <div className="gp-cardGlow" />
        <div className="gp-cardShine"></div>
        
        <div className="mode-header">
          <div className="mode-header-icon">🎲</div>
          <h1 className="mode-title">Choisis ton mode de jeu</h1>
        </div>

        <div className="mode-grid">
          {modes.map((mode) => (
            <div
              key={mode.id}
              className={`mode-item ${hoveredMode === mode.id ? "hovered" : ""}`}
              onMouseEnter={() => setHoveredMode(mode.id)}
              onMouseLeave={() => setHoveredMode(null)}
              onClick={() => navigate(mode.route)}
              style={{ '--mode-color': mode.color }}
            >
              <div className="mode-item-glow"></div>
              <div className="mode-item-header">
                <span className="mode-item-icon">{mode.icon}</span>
                <span className="mode-item-badge">NOUVEAU</span>
              </div>
              <h2 className="mode-item-title">{mode.title}</h2>
              <p className="mode-item-desc">{mode.description}</p>
              <ul className="mode-item-features">
                {mode.features.map((feature, idx) => (
                  <li key={idx}>
                    <span className="mode-feature-check">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="mode-play-btn">
                <span>JOUER</span>
                <span className="mode-play-arrow">→</span>
              </button>
            </div>
          ))}
        </div>

        <div className="mode-footer">
          <p>D'autres modes de jeu arrivent bientôt ! 🚀</p>
        </div>
      </div>
    </div>
  );
}