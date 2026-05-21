import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ReactComponent as DiscordIcon } from '../assets/discord.svg';
import { ReactComponent as GithubIcon } from '../assets/github.svg';
import { ReactComponent as LinkedinIcon } from '../assets/linkedin.svg';
import logger from "../utils/logger";
import packageJson from "../../package.json";
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

  return (
    <div className="page-wrapper hp-page">
      <div className="tile-grid" onMouseMove={handleMouseMove}>
        {/* HERO TILE */}
        <div className="tile span-8 row-span-2 tile-animate" style={{ animationDelay: '0.04s' }}>
          {renderCorners()}
          <div className="tile-content hp-hero">
            <div className="hp-hero-left">
              <div className="hp-title-wrap">
                <img src="/logo512.svg" alt="SalaryGuessr Logo" className="hp-logo-img" />
                <h1 className="hp-title">
                  Salary<br />Guessr
                </h1>
              </div>
            </div>

            <div className="hp-hero-right">
              <h2 style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: '0' }}>
                SalaryGuessr, Salary Guesser, SalaryGuesser, Salary Guess - Devinez les salaires
              </h2>
              <p className="hp-subtitle">
                Testez votre instinct sur le marché du travail avec Salary Guessr.
                Estimez les salaires d'offres réelles et grimpez au sommet du classement. Le meilleur Salary Guesser en ligne.
              </p>

              <div className="hp-actions">
                <button className="hp-btn-primary" onClick={() => navigate("/mode-select")}>
                  Jouer Maintenant
                </button>
                <button className="hp-btn-secondary" onClick={() => navigate("/stats")}>
                  Statistiques
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PREVIEW TILE */}
        <div className="tile span-4 row-span-2 tile-grid-bg tile-animate" style={{ animationDelay: '0.08s' }}>
          {renderCorners()}
          <div className="tile-content hp-preview">
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
              <div
                className="hp-preview-fill"
                style={{ width: '75%', transition: 'width 1.5s ease-out 1s' }}
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
          </div>
        </div>

        {/* STATS TILES */}
        {[
          { label: "Offres Réelles", value: "∞" },
          { label: "Gratuit", value: "100%" },
          { label: "Modes de Jeu", value: "3" }
        ].map((stat, i) => (
          <div key={i} className="tile span-4 tile-animate" style={{ animationDelay: `${0.12 + i * 0.04}s` }}>
            {renderCorners()}
            <div className="tile-content hp-stat-box">
              <span className="hp-stat-val">{stat.value}</span>
              <span className="hp-stat-lab">{stat.label}</span>
            </div>
          </div>
        ))}

        {/* SOCIALS TILE */}
        <div className="tile span-6 tile-animate" style={{ animationDelay: '0.24s' }}>
          {renderCorners()}
          <div className="tile-content no-padding">
            <div className="hp-social-links">
              <a href="https://github.com/julianlebouc/SalaryGuessr" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <GithubIcon />
              </a>
              <a href="https://discord.gg/RYPb3VC7aQ" target="_blank" rel="noopener noreferrer" aria-label="Discord">
                <DiscordIcon />
              </a>
              <a href="https://www.linkedin.com/in/julian-lebouc-851619134/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <LinkedinIcon />
              </a>
            </div>
          </div>
        </div>

        {/* LEGAL TILE */}
        <div className="tile span-6 tile-grid-bg tile-animate" style={{ animationDelay: '0.28s' }}>
          {renderCorners()}
          <div className="tile-content hp-legal" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }} href="/mentions-legales" onClick={(e) => { e.preventDefault(); navigate('/mentions-legales'); }}>
              <span>Mentions Légales • © 2026 SalaryGuessr</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>v{packageJson.version}</span>
          </div>
        </div>
      </div>
    </div>
  );
}