import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ReactComponent as DiscordIcon } from '../assets/discord.svg';
import { ReactComponent as GithubIcon } from '../assets/github.svg';
import { ReactComponent as LinkedinIcon } from '../assets/linkedin.svg';
import "../styles/HomePage.css";

/**
 * Redesigned Home page for SalaryGuessr.
 * Seamless, full-page layout with logo and space-filling grid.
 */
export default function HomePage() {
  const navigate = useNavigate();

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

  return (
    <motion.div
      className="page-wrapper hp-page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="hp-grid">
        <div className="hp-hero">
          <motion.div className="hp-title-wrap" variants={itemVariants}>
            <img src="/logo512.svg" alt="SalaryGuessr Logo" className="hp-logo-img" />
            <h1 className="hp-title">
              Salary<br />Guessr
            </h1>
          </motion.div>

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

        <motion.div
          className="hp-preview"
          variants={itemVariants}
        >
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

        <div className="hp-stats-row">
          {[
            { label: "Offres Réelles", value: "∞" },
            { label: "Gratuit", value: "100%" },
            { label: "Modes de Jeu", value: "3" }
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="hp-stat-box"
              variants={itemVariants}
            >
              <span className="hp-stat-val">{stat.value}</span>
              <span className="hp-stat-lab">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="hp-footer-nav">
        <div className="hp-socials">
          <a href="https://github.com/julianlebouc/SalaryGuessr" target="_blank" rel="noopener noreferrer">
            <GithubIcon width="20" height="20" />
          </a>
          <a href="https://discordapp.com/users/321002968218337289" target="_blank" rel="noopener noreferrer">
            <DiscordIcon width="20" height="20" />
          </a>
          <a href="https://www.linkedin.com/in/julian-lebouc-851619134/" target="_blank" rel="noopener noreferrer">
            <LinkedinIcon width="20" height="20" />
          </a>
        </div>
        <a href="/mentions-legales" className="hp-legal" onClick={(e) => { e.preventDefault(); navigate('/mentions-legales'); }}>
          Mentions Légales • © 2026 SalaryGuessr
        </a>
      </div>
    </motion.div>
  );
}