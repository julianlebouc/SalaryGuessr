import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ModeSelectPage.css";
import { useSound } from "../sound/SoundProvider";

/**
 * @module Pages/ModeSelectPage
 */

/**
 * ModeSelectPage component.
 * Allows the user to choose between different game modes.
 * 
 * @component
 * @returns {JSX.Element} The rendered Mode selection page.
 */
export default function ModeSelectPage() {
  const navigate = useNavigate();
  const { play } = useSound();

  const handleMouseMove = (e) => {
    const grid = e.currentTarget;
    const rect = grid.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    grid.style.setProperty('--mouse-x', `${x}px`);
    grid.style.setProperty('--mouse-y', `${y}px`);
  };

  const renderCorners = () => (
    <>
      <div className="tile-corner top-left" />
      <div className="tile-corner top-right" />
      <div className="tile-corner bottom-left" />
      <div className="tile-corner bottom-right" />
    </>
  );

  const modes = [
    {
      id: "classic",
      title: "CLASSIQUE",
      icon: "",
      description: "Devine le salaire exact d'une offre d'emploi réelle.",
      features: ["Estimation précise", "Score sur 100 points"],
      route: "/game",
    },
    {
      id: "highlow",
      title: "HIGH / LOW",
      icon: "",
      description: "Compare deux offres et devine laquelle est la mieux payée.",
      features: ["Comparaison rapide", "Série de victoires"],
      route: "/highlow",
    },
    {
      id: "battleroyale",
      title: "BATTLE ROYALE",
      icon: "",
      description: "Affronte d'autres joueurs dans une élimination directe.",
      features: ["Multijoueur en ligne", "Dernier survivant"],
      route: "/battleroyale",
    },
    {
      id: "salaryorder",
      title: "SALARY ORDER",
      icon: "",
      description: "Range les offres de la moins payée à la mieux payée.",
      features: ["Difficulté évolutive", "Score = max offres classées"],
      route: "/salary-order",
    },
  ];

  const handleModeSelect = (route) => {
    play("click");
    navigate(route);
  };

  return (
    <div className="page-wrapper mode-page">
      <div className="tile-grid" onMouseMove={handleMouseMove}>
        <div className="tile span-12 tile-animate" style={{ animationDelay: '0.04s' }}>
          {renderCorners()}
          <div className="tile-content mode-hero">
            <h1 className="gp-titleMain" style={{ marginBottom: '1rem' }}>Défis</h1>
            <p className="mode-intro">Choisissez votre arène</p>
          </div>
        </div>

        {modes.map((mode, i) => (
          <div key={mode.id} className="tile mode-card-tile tile-grid-bg tile-animate" style={{ animationDelay: `${0.08 + (i * 0.04)}s` }}>
            {renderCorners()}
            <div
              className="tile-content mode-card-new"
              onClick={() => handleModeSelect(mode.route)}
            >
              {mode.icon && <div className="mode-icon-wrap">{mode.icon}</div>}
              <h2 className="mode-card-title">{mode.title}</h2>
              <p className="mode-card-desc">{mode.description}</p>
              <div className="mode-footer-info">
                {mode.features.map((f, idx) => <span key={idx}>• {f}</span>)}
              </div>
              <button className="mode-enter-btn">Entrer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}