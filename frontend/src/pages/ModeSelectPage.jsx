import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ModeSelectPage.css";
import { useSound } from "../sound/SoundProvider";
import { useSettings } from "../context/SettingsContext";

/**
 * @module Pages/ModeSelectPage
 */

const T = {
  fr: {
    title: "Défis",
    intro: "Choisissez votre arène",
    enter: "Entrer",
    modes: [
      {
        title: "CLASSIQUE",
        description: "Devine le salaire exact d'une offre d'emploi réelle.",
        features: ["Estimation précise", "Score sur 100 points"],
      },
      {
        title: "HIGH / LOW",
        description: "Compare deux offres et devine laquelle est la mieux payée.",
        features: ["Comparaison rapide", "Série de victoires"],
      },
      {
        title: "BATTLE ROYALE",
        description: "Affronte d'autres joueurs dans une élimination directe.",
        features: ["Multijoueur en ligne", "Dernier survivant"],
      },
    ],
  },
  en: {
    title: "Challenges",
    intro: "Choose your arena",
    enter: "Enter",
    modes: [
      {
        title: "CLASSIC",
        description: "Guess the exact salary of a real job offer.",
        features: ["Precise estimation", "Score out of 100"],
      },
      {
        title: "HIGH / LOW",
        description: "Compare two offers and guess which one pays more.",
        features: ["Quick comparison", "Win streak"],
      },
      {
        title: "BATTLE ROYALE",
        description: "Face other players in a direct elimination.",
        features: ["Online multiplayer", "Last one standing"],
      },
    ],
  },
};

/**
 * ModeSelectPage component.
 * Allows the user to choose between different game modes: Classic, High/Low, or Battle Royale.
 * 
 * @component
 * @returns {JSX.Element} The rendered Mode selection page.
 */
export default function ModeSelectPage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { language } = useSettings();
  const t = T[language] || T.fr;

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
    { id: "classic", route: "/game" },
    { id: "highlow", route: "/highlow" },
    { id: "battleroyale", route: "/battleroyale" },
  ];

  const handleModeSelect = (route) => { play("click"); navigate(route); };

  return (
    <div className="page-wrapper mode-page">
      <div className="tile-grid" onMouseMove={handleMouseMove}>
        <div className="tile span-12 tile-animate" style={{ animationDelay: '0.04s' }}>
          {renderCorners()}
          <div className="tile-content mode-hero">
            <h1 className="gp-titleMain" style={{ marginBottom: '1rem' }}>{t.title}</h1>
            <p className="mode-intro">{t.intro}</p>
          </div>
        </div>

        {modes.map((mode, i) => (
          <div key={mode.id} className="tile span-4 tile-grid-bg tile-animate" style={{ animationDelay: `${0.08 + i * 0.04}s` }}>
            {renderCorners()}
            <div className="tile-content mode-card-new" onClick={() => handleModeSelect(mode.route)}>
              <h2 className="mode-card-title">{t.modes[i].title}</h2>
              <p className="mode-card-desc">{t.modes[i].description}</p>
              <div className="mode-footer-info">
                {t.modes[i].features.map((f, idx) => <span key={idx}>• {f}</span>)}
              </div>
              <button className="mode-enter-btn">{t.enter}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}