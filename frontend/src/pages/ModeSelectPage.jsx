import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/ModeSelectPage.css";
import { useSound } from "../sound/SoundProvider";

/**
 * @module Pages/ModeSelectPage
 */

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
  ];

  const handleModeSelect = (route) => {
    play("click");
    navigate(route);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <motion.div
      className="page-wrapper mode-page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="tile-grid">
        <div className="tile span-12">
          <div className="tile-content mode-hero">
            <motion.h1 className="gp-titleMain" variants={itemVariants} style={{ marginBottom: '1rem' }}>Défis</motion.h1>
            <motion.p className="mode-intro" variants={itemVariants}>Choisissez votre arène</motion.p>
          </div>
        </div>

        {modes.map((mode, i) => (
          <div key={mode.id} className={`tile span-4 ${(i % 2 === 0) ? 'tile-grid-bg' : ''}`}>
            <motion.div
              className="tile-content mode-card-new"
              variants={itemVariants}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleModeSelect(mode.route)}
            >
              {mode.icon && <div className="mode-icon-wrap">{mode.icon}</div>}
              <h2 className="mode-card-title">{mode.title}</h2>
              <p className="mode-card-desc">{mode.description}</p>
              <div className="mode-footer-info">
                {mode.features.map((f, i) => <span key={i}>• {f}</span>)}
              </div>
              <button className="mode-enter-btn">Entrer</button>
            </motion.div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}