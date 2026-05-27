import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../context/SettingsContext";
import "./SettingsPopup.css";

/**
 * @module Components/SettingsPopup
 */

/**
 * Responsive settings popup for game preferences.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @returns {JSX.Element}
 */
export default function SettingsPopup({ isOpen, onClose }) {
  const { 
    volume, setVolume, 
    salaryType, setSalaryType, 
    salaryPeriod, setSalaryPeriod,
    theme, setTheme,
    language, setLanguage
  } = useSettings();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="sg-settings-overlay">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="sg-settings-card"
          >
            {/* Decorative Corner Accents */}
            <div className="tile-corner top-left"></div>
            <div className="tile-corner top-right"></div>
            <div className="tile-corner bottom-left"></div>
            <div className="tile-corner bottom-right"></div>

            <div className="sg-settings-header">
              <div className="sg-settings-title-group">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                <h3>Configuration</h3>
              </div>
              <button onClick={onClose} className="sg-settings-close" aria-label="Fermer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="sg-settings-body">
              {/* Volume Slider */}
              <div className="sg-settings-section">
                <div className="sg-section-header">
                  <label>Audio</label>
                  <span className="sg-section-val">{Math.round(volume * 100)}%</span>
                </div>
                <div className="sg-settings-volume-row">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path></svg>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(volume * 100)}
                    onChange={(e) => setVolume(Number(e.target.value) / 100)}
                    className="sg-sound-slider"
                    style={{
                      background: `linear-gradient(to right, var(--primary-purple) 0%, var(--primary-purple) ${Math.round(volume * 100)}%, rgba(255, 255, 255, 0.05) ${Math.round(volume * 100)}%)`
                    }}
                  />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                </div>
              </div>

              <div className="sg-settings-section">
                <label>Thème</label>
                <div className="sg-settings-switch-group sg-settings-switch-group--triple">
                  <button 
                    className={theme === "classic" ? "active" : ""} 
                    onClick={() => setTheme("classic")}
                  >
                    Classique
                  </button>
                  <button 
                    className={theme === "retro" ? "active" : ""} 
                    onClick={() => setTheme("retro")}
                  >
                    Retro
                  </button>
                  <button 
                    className={theme === "professional" ? "active" : ""} 
                    onClick={() => setTheme("professional")}
                  >
                    Pro
                  </button>
                </div>
              </div>

              {/* Language Switch */}
              <div className="sg-settings-section">
                <label>Langue / Language</label>
                <div className="sg-settings-switch-group">
                  <button 
                    className={language === "fr" ? "active" : ""} 
                    onClick={() => setLanguage("fr")}
                  >
                    Français
                  </button>
                  <button 
                    className={language === "en" ? "active" : ""} 
                    onClick={() => setLanguage("en")}
                  >
                    English
                  </button>
                </div>
              </div>

              <div className="sg-settings-divider" />

              <div className="sg-settings-grid">
                {/* Brut / Net Switch */}
                <div className="sg-settings-section">
                  <label>Type de salaire</label>
                  <div className="sg-settings-switch-group">
                    <button 
                      className={salaryType === "brut" ? "active" : ""} 
                      onClick={() => setSalaryType("brut")}
                    >
                      Brut
                    </button>
                    <button 
                      className={salaryType === "net" ? "active" : ""} 
                      onClick={() => setSalaryType("net")}
                    >
                      Net
                    </button>
                  </div>
                  <p className="sg-settings-desc">Net = Brut - 23%</p>
                </div>

                {/* Monthly / Annual Switch */}
                <div className="sg-settings-section">
                  <label>Période</label>
                  <div className="sg-settings-switch-group">
                    <button 
                      className={salaryPeriod === "monthly" ? "active" : ""} 
                      onClick={() => setSalaryPeriod("monthly")}
                    >
                      Mensuel
                    </button>
                    <button 
                      className={salaryPeriod === "annual" ? "active" : ""} 
                      onClick={() => setSalaryPeriod("annual")}
                    >
                      Annuel
                    </button>
                  </div>
                  <p className="sg-settings-desc">Annuel = Mensuel x 12</p>
                </div>
              </div>
            </div>

          <div className="sg-settings-footer">
            <button className="hp-btn-primary no-margin" onClick={onClose}>
              Terminer
            </button>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="sg-settings-backdrop" 
          onClick={onClose} 
        />
      </div>
      )}
    </AnimatePresence>
  );
}
