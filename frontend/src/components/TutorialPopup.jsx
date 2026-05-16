import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../context/SettingsContext";
import "./TutorialPopup.css";

/**
 * @module Components/TutorialPopup
 */

const STEPS = [
  {
    id: "welcome",
    title: "Bienvenue sur SalaryGuessr",
    subtitle: "Devinez les salaires, testez votre instinct",
  },
  {
    id: "gamemodes",
    title: "Les modes de jeu",
    subtitle: "Trois façons de jouer",
  },
  {
    id: "themes",
    title: "Personnalisez votre expérience",
    subtitle: "Choisissez le thème qui vous correspond",
  },
  {
    id: "ready",
    title: "Prêt à jouer ?",
    subtitle: "Vous pouvez modifier ces réglages à tout moment",
  },
];

/**
 * Tutorial popup shown on first visit.
 * Guides the user through the website, game modes, and theme selection.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onComplete
 * @returns {JSX.Element}
 */
export default function TutorialPopup({ isOpen, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const { 
    volume, setVolume, 
    salaryType, setSalaryType, 
    salaryPeriod, setSalaryPeriod,
    theme, setTheme
  } = useSettings();

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const isFirstStep = stepIndex === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="tutorial-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="tutorial-card"
          >
            {/* Progress bar */}
            <div className="tutorial-progress">
              {STEPS.map((s, i) => (
                <div
                  key={s.id}
                  className={`tutorial-progress-dot ${i <= stepIndex ? "active" : ""}`}
                />
              ))}
            </div>

            {/* Close / Skip */}
            <button
              className="tutorial-skip"
              onClick={handleSkip}
              aria-label="Passer le tutoriel"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Step 1: Welcome */}
            {step.id === "welcome" && (
              <div className="tutorial-content">
                <div className="tutorial-welcome-icon">
                  <img src="/logo512.svg" alt="SalaryGuessr Logo" className="tutorial-logo" />
                </div>
                <h2 className="tutorial-title">Bienvenue sur SalaryGuessr</h2>
                <p className="tutorial-desc">
                  SalaryGuessr est un jeu où vous devez <strong>estimer les salaires</strong> d'offres d'emploi réelles.
                </p>
                <p className="tutorial-desc">
                  Testez votre connaissance du marché du travail, marquez des points et
                  défiez vos amis !
                </p>
              </div>
            )}

            {/* Step 2: Game Modes */}
            {step.id === "gamemodes" && (
              <div className="tutorial-content">
                <h2 className="tutorial-title">Les modes de jeu</h2>
                <div className="tutorial-modes-list">
                  <div className="tutorial-mode-item">
                    <div className="tutorial-mode-icon tutorial-mode-icon--classic">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </div>
                    <div className="tutorial-mode-text">
                      <strong>Classique</strong>
                      <span>Devinez le salaire exact d'une offre d'emploi. Gagnez jusqu'à 100 points.</span>
                    </div>
                  </div>
                  <div className="tutorial-mode-item">
                    <div className="tutorial-mode-icon tutorial-mode-icon--highlow">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                      </svg>
                    </div>
                    <div className="tutorial-mode-text">
                      <strong>High / Low</strong>
                      <span>Comparez deux offres et dites laquelle est la mieux payée. Enchaînez les victoires !</span>
                    </div>
                  </div>
                  <div className="tutorial-mode-item">
                    <div className="tutorial-mode-icon tutorial-mode-icon--br">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <div className="tutorial-mode-text">
                      <strong>Battle Royale</strong>
                      <span>Affrontez d'autres joueurs en ligne. Le dernier survivant remporte la partie !</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Theme + Settings */}
            {step.id === "themes" && (
              <div className="tutorial-content">
                <h2 className="tutorial-title">Personnalisez votre expérience</h2>
                <p className="tutorial-desc tutorial-desc--small">
                  Choisissez le thème visuel qui vous plaît. Vous pourrez le changer à tout moment.
                </p>

                {/* Theme Preview Cards */}
                <div className="tutorial-themes-row">
                  <button
                    className={`tutorial-theme-card ${theme === "classic" ? "active" : ""}`}
                    onClick={() => setTheme("classic")}
                  >
                    <div className="tutorial-theme-preview tutorial-theme-preview--classic">
                      <span className="tutorial-theme-preview-text">Aa</span>
                    </div>
                    <span className="tutorial-theme-label">Classique</span>
                  </button>
                  <button
                    className={`tutorial-theme-card ${theme === "retro" ? "active" : ""}`}
                    onClick={() => setTheme("retro")}
                  >
                    <div className="tutorial-theme-preview tutorial-theme-preview--retro">
                      <span className="tutorial-theme-preview-text">Aa</span>
                    </div>
                    <span className="tutorial-theme-label">Retro</span>
                  </button>
                  <button
                    className={`tutorial-theme-card ${theme === "professional" ? "active" : ""}`}
                    onClick={() => setTheme("professional")}
                  >
                    <div className="tutorial-theme-preview tutorial-theme-preview--pro">
                      <span className="tutorial-theme-preview-text">Aa</span>
                    </div>
                    <span className="tutorial-theme-label">Pro</span>
                  </button>
                </div>

                {/* Salary Settings */}
                <div className="tutorial-settings-panel">
                  <div className="tutorial-settings-row">
                    <label>Type de salaire</label>
                    <div className="tutorial-settings-toggles">
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
                  </div>
                  <div className="tutorial-settings-row">
                    <label>Période</label>
                    <div className="tutorial-settings-toggles">
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
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Ready */}
            {step.id === "ready" && (
              <div className="tutorial-content">
                <div className="tutorial-ready-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h2 className="tutorial-title">Prêt à jouer ?</h2>
                <p className="tutorial-desc">
                  Vous pouvez à tout moment modifier vos réglages en cliquant sur le bouton
                  <strong> Paramètres</strong> (icône d'engrenage en haut à droite).
                </p>
                <p className="tutorial-desc tutorial-desc--hint">
                  Bonne chance, et que le meilleur Salary Guessr gagne !
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="tutorial-nav">
              <div className="tutorial-nav-left">
                {!isFirstStep && (
                  <button className="tutorial-btn tutorial-btn--back" onClick={handleBack}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Retour
                  </button>
                )}
              </div>
              <button className="tutorial-btn tutorial-btn--primary" onClick={handleNext}>
                {isLastStep ? "Commencer !" : "Suivant"}
                {!isLastStep && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}