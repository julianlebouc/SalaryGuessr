import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../context/SettingsContext";
import "./TutorialPopup.css";

/**
 * @module Components/TutorialPopup
 */

const T = {
  fr: {
    welcome: {
      title: "Bienvenue sur SalaryGuessr",
      desc1: "SalaryGuessr est un jeu où vous devez <strong>estimer les salaires</strong> d'offres d'emploi réelles.",
      desc2: "Testez votre connaissance du marché du travail, marquez des points et défiez vos amis !",
    },
    gamemodes: {
      title: "Les modes de jeu",
      classic: { name: "Classique", desc: "Devinez le salaire exact d'une offre d'emploi. Gagnez jusqu'à 100 points." },
      highlow: { name: "High / Low", desc: "Comparez deux offres et dites laquelle est la mieux payée. Enchaînez les victoires !" },
      br: { name: "Battle Royale", desc: "Affrontez d'autres joueurs en ligne. Le dernier survivant remporte la partie !" },
    },
    themes: {
      title: "Personnalisez votre expérience",
      desc: "Choisissez le thème visuel qui vous plaît. Vous pourrez le changer à tout moment.",
      classic: "Classique",
      retro: "Retro",
      pro: "Pro",
      language: "Langue / Language",
      french: "Français",
      english: "English",
      salaryType: "Type de salaire",
      brut: "Brut",
      net: "Net",
      period: "Période",
      monthly: "Mensuel",
      annual: "Annuel",
    },
    ready: {
      title: "Prêt à jouer ?",
      desc: "Vous pouvez à tout moment modifier vos réglages en cliquant sur le bouton <strong>Paramètres</strong> (icône d'engrenage en haut à droite).",
      hint: "Bonne chance, et que le meilleur Salary Guessr gagne !",
    },
    nav: { skip: "Passer", back: "Retour", next: "Suivant", start: "Commencer !" },
  },
  en: {
    welcome: {
      title: "Welcome to SalaryGuessr",
      desc1: "SalaryGuessr is a game where you <strong>estimate salaries</strong> from real job listings.",
      desc2: "Test your knowledge of the job market, score points, and challenge your friends!",
    },
    gamemodes: {
      title: "Game Modes",
      classic: { name: "Classic", desc: "Guess the exact salary of a job offer. Earn up to 100 points." },
      highlow: { name: "High / Low", desc: "Compare two offers and guess which one pays more. Chain your victories!" },
      br: { name: "Battle Royale", desc: "Face other players online. Last one standing wins the game!" },
    },
    themes: {
      title: "Customize your experience",
      desc: "Pick the visual theme you like. You can change it anytime.",
      classic: "Classic",
      retro: "Retro",
      pro: "Pro",
      language: "Language",
      french: "Français",
      english: "English",
      salaryType: "Salary Type",
      brut: "Gross",
      net: "Net",
      period: "Period",
      monthly: "Monthly",
      annual: "Annual",
    },
    ready: {
      title: "Ready to play?",
      desc: "You can change your settings anytime by clicking the <strong>Settings</strong> button (gear icon in the top right).",
      hint: "Good luck, and may the best Salary Guessr win!",
    },
    nav: { skip: "Skip", back: "Back", next: "Next", start: "Let's Go!" },
  },
};

const STEPS = [
  { id: "welcome", key: "welcome" },
  { id: "gamemodes", key: "gamemodes" },
  { id: "themes", key: "themes" },
  { id: "ready", key: "ready" },
];

export default function TutorialPopup({ isOpen, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const {
    salaryType, setSalaryType,
    salaryPeriod, setSalaryPeriod,
    theme, setTheme,
    language, setLanguage,
  } = useSettings();

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const isFirstStep = stepIndex === 0;
  const t = T[language] || T.fr;

  const handleNext = () => {
    if (isLastStep) { onComplete(); }
    else { setStepIndex((prev) => prev + 1); }
  };

  const handleBack = () => { if (!isFirstStep) setStepIndex((prev) => prev - 1); };
  const handleSkip = () => { onComplete(); };

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
            <div className="tutorial-progress">
              {STEPS.map((s, i) => (
                <div key={s.id} className={`tutorial-progress-dot ${i <= stepIndex ? "active" : ""}`} />
              ))}
            </div>

            <button className="tutorial-skip" onClick={handleSkip} aria-label={t.nav.skip}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {step.id === "welcome" && (
              <div className="tutorial-content">
                <div className="tutorial-welcome-icon">
                  <img src="/logo512.svg" alt="SalaryGuessr Logo" className="tutorial-logo" />
                </div>
                <h2 className="tutorial-title">{t.welcome.title}</h2>
                <p className="tutorial-desc" dangerouslySetInnerHTML={{ __html: t.welcome.desc1 }} />
                <p className="tutorial-desc">{t.welcome.desc2}</p>
              </div>
            )}

            {step.id === "gamemodes" && (
              <div className="tutorial-content">
                <h2 className="tutorial-title">{t.gamemodes.title}</h2>
                <div className="tutorial-modes-list">
                  {["classic", "highlow", "br"].map((mode) => {
                    const m = t.gamemodes[mode];
                    const icon = mode === "classic" ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                    ) : mode === "highlow" ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    );
                    return (
                      <div key={mode} className="tutorial-mode-item">
                        <div className={`tutorial-mode-icon tutorial-mode-icon--${mode === "br" ? "br" : mode}`}>{icon}</div>
                        <div className="tutorial-mode-text">
                          <strong>{m.name}</strong>
                          <span>{m.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step.id === "themes" && (
              <div className="tutorial-content">
                <h2 className="tutorial-title">{t.themes.title}</h2>
                <p className="tutorial-desc tutorial-desc--small">{t.themes.desc}</p>

                <div className="tutorial-themes-row">
                  {["classic", "retro", "professional"].map((th) => (
                    <button
                      key={th}
                      className={`tutorial-theme-card ${theme === th ? "active" : ""}`}
                      onClick={() => setTheme(th)}
                    >
                      <div className={`tutorial-theme-preview tutorial-theme-preview--${th === "professional" ? "pro" : th}`}>
                        <span className="tutorial-theme-preview-text">Aa</span>
                      </div>
                      <span className="tutorial-theme-label">{t.themes[th === "professional" ? "pro" : th]}</span>
                    </button>
                  ))}
                </div>

                <div className="tutorial-settings-panel">
                  <div className="tutorial-settings-row">
                    <label>{t.themes.language}</label>
                    <div className="tutorial-settings-toggles">
                      <button className={language === "fr" ? "active" : ""} onClick={() => setLanguage("fr")}>{t.themes.french}</button>
                      <button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>{t.themes.english}</button>
                    </div>
                  </div>
                </div>

                <div className="tutorial-settings-panel">
                  <div className="tutorial-settings-row">
                    <label>{t.themes.salaryType}</label>
                    <div className="tutorial-settings-toggles">
                      <button className={salaryType === "brut" ? "active" : ""} onClick={() => setSalaryType("brut")}>{t.themes.brut}</button>
                      <button className={salaryType === "net" ? "active" : ""} onClick={() => setSalaryType("net")}>{t.themes.net}</button>
                    </div>
                  </div>
                  <div className="tutorial-settings-row">
                    <label>{t.themes.period}</label>
                    <div className="tutorial-settings-toggles">
                      <button className={salaryPeriod === "monthly" ? "active" : ""} onClick={() => setSalaryPeriod("monthly")}>{t.themes.monthly}</button>
                      <button className={salaryPeriod === "annual" ? "active" : ""} onClick={() => setSalaryPeriod("annual")}>{t.themes.annual}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step.id === "ready" && (
              <div className="tutorial-content">
                <div className="tutorial-ready-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h2 className="tutorial-title">{t.ready.title}</h2>
                <p className="tutorial-desc" dangerouslySetInnerHTML={{ __html: t.ready.desc }} />
                <p className="tutorial-desc tutorial-desc--hint">{t.ready.hint}</p>
              </div>
            )}

            <div className="tutorial-nav">
              <div className="tutorial-nav-left">
                {!isFirstStep && (
                  <button className="tutorial-btn tutorial-btn--back" onClick={handleBack}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    {t.nav.back}
                  </button>
                )}
              </div>
              <button className="tutorial-btn tutorial-btn--primary" onClick={handleNext}>
                {isLastStep ? t.nav.start : t.nav.next}
                {!isLastStep && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}