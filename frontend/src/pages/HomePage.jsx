import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ReactComponent as DiscordIcon } from '../assets/discord.svg';
import { ReactComponent as GithubIcon } from '../assets/github.svg';
import { ReactComponent as LinkedinIcon } from '../assets/linkedin.svg';
import logger from "../utils/logger";
import "../styles/HomePage.css";

/**
 * HomePage component for SalaryGuessr.
 * Displays the hero section, quick preview, and statistics summary.
 * 
 * @component
 * @returns {JSX.Element} The rendered Home page.
 */
export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    logger.info("Landing page visit");
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const renderCorners = () => (
    <>
      <div className="tile-corner top-left" />
      <div className="tile-corner top-right" />
      <div className="tile-corner bottom-left" />
      <div className="tile-corner bottom-right" />
    </>
  );

  const handleMouseMove = (e) => {
    const grid = e.currentTarget;
    const rect = grid.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    grid.style.setProperty('--mouse-x', `${x}px`);
    grid.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <motion.div
      className="page-wrapper hp-page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="tile-grid" onMouseMove={handleMouseMove}>
        {/* HERO TILE */}
        <div className="tile span-8 row-span-2">
          {renderCorners()}
          <div className="tile-content hp-hero">
            <div className="hp-hero-left">
              <motion.div className="hp-title-wrap" variants={itemVariants}>
                <img src="/logo512.svg" alt="SalaryGuessr Logo" className="hp-logo-img" />
                <h1 className="hp-title">
                  Salary<br />Guessr
                </h1>
              </motion.div>
            </div>

            <div className="hp-hero-right">
              <motion.p className="hp-subtitle" variants={itemVariants}>
                Testez votre instinct sur le marché du travail.
                Estimez les salaires d'offres réelles et grimpez au sommet du classement.
              </motion.p>

              <motion.div className="hp-actions" variants={itemVariants}>
                <button className="hp-btn-primary" onClick={() => navigate("/mode-select")}>
                  Jouer Maintenant
                </button>
                <button className="hp-btn-secondary" onClick={() => navigate("/stats")}>
                  Statistiques
                </button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* PREVIEW TILE */}
        <div className="tile span-4 row-span-2 tile-grid-bg">
          {renderCorners()}
          <motion.div className="tile-content hp-preview" variants={itemVariants}>
            <div className="hp-preview-header">
              <span className="hp-preview-tag">MANCHE 1</span>
              <h3 className="hp-preview-title">Product Designer (H/F)</h3>
            </div>

            <div className="hp-preview-meta">
              <span className="gp-badge">Tech Studio</span>
              <span className="gp-badge">Remote</span>
              <span className="gp-badge">CDI</span>
            </div>

            <div className="hp-preview-bar">
              <motion.div
                className="hp-preview-fill"
                initial={{ width: 0 }}
                animate={{ width: "75%" }}
                transition={{ duration: 1.5, delay: 1 }}
              />
            </div>

            <div className="hp-preview-result">
              <div className="hp-preview-stat">
                <span className="hp-label">VOTRE ESTIMATION</span>
                <span className="hp-val">45k €</span>
              </div>
              <div className="hp-preview-stat right">
                <span className="hp-label">SALAIRE RÉEL</span>
                <span className="hp-val accent">52k €</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* STATS TILES */}
        {[
          { label: "Offres Réelles", value: "∞" },
          { label: "Gratuit", value: "100%" },
          { label: "Modes de Jeu", value: "3" }
        ].map((stat, i) => (
          <div key={i} className={'tile span-4'}>
            {renderCorners()}
            <motion.div className="tile-content hp-stat-box" variants={itemVariants}>
              <span className="hp-stat-val">{stat.value}</span>
              <span className="hp-stat-lab">{stat.label}</span>
            </motion.div>
          </div>
        ))}

        {/* SOCIALS TILE */}
        <div className="tile span-6">
          {renderCorners()}
          <div className="tile-content no-padding">
            <div className="hp-social-links">
              <a href="https://github.com/julianlebouc/SalaryGuessr" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <GithubIcon />
              </a>
              <a href="https://discordapp.com/users/321002968218337289" target="_blank" rel="noopener noreferrer" aria-label="Discord">
                <DiscordIcon />
              </a>
              <a href="https://www.linkedin.com/in/julian-lebouc-851619134/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <LinkedinIcon />
              </a>
            </div>
          </div>
        </div>

        {/* LEGAL TILE */}
        <div className="tile span-6 tile-grid-bg">
          {renderCorners()}
          <div className="tile-content" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <a href="/mentions-legales" className="hp-legal" onClick={(e) => { e.preventDefault(); navigate('/mentions-legales'); }}>
              Mentions Légales • © 2026 SalaryGuessr
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}