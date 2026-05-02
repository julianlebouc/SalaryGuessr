import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [bounceAnimation, setBounceAnimation] = useState(false);

  const discordId = "321002968218337289";

  useEffect(() => {
    // Animation de bienvenue
    const timer = setTimeout(() => setBounceAnimation(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const goToModeSelect = () => {
    setLoading(true);
    setTimeout(() => {
      navigate("/mode-select");
    }, 1);
  };

  const contactDiscord = () => {
    navigator.clipboard.writeText(discordId);
    // Animation de feedback
    const btn = document.querySelector('.hp-discordButton');
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btn.style.transform = '';
    }, 200);
    window.open(`https://discordapp.com/users/${discordId}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="hp-container">
      {/* Bulles cartoon flottantes */}
      <div className="hp-bubble hp-bubble-1">💰</div>
      <div className="hp-bubble hp-bubble-2">🎯</div>
      <div className="hp-bubble hp-bubble-3">⚡</div>
      <div className="hp-bubble hp-bubble-4">🎮</div>
      <div className="hp-bubble hp-bubble-5">💵</div>
      
      {/* Orbes de fond */}
      <div className="hp-bgOrb hp-orb1" />
      <div className="hp-bgOrb hp-orb2" />
      <div className="hp-bgOrb hp-orb3" />

      {/* Personnage cartoon */}
      <div className="hp-character">
        <div className="hp-character-face">
          <div className="hp-eye hp-eye-left">
            <div className="hp-pupil"></div>
          </div>
          <div className="hp-eye hp-eye-right">
            <div className="hp-pupil"></div>
          </div>
          <div className={`hp-mouth ${bounceAnimation ? 'hp-mouth-smile' : ''}`}></div>
        </div>
        <div className="hp-character-body"></div>
        <div className="hp-character-arm hp-arm-left"></div>
        <div className="hp-character-arm hp-arm-right"></div>
      </div>

      <div className="hp-card hp-heroCard">
        <div className="hp-heroGrid">
          <div className="hp-heroContent">
            <div className="hp-titleWrapper">
              <h1 className="hp-title">
                <span className="hp-title-word">Salary</span>
                <span className="hp-title-word hp-title-guessr">Guessr</span>
                <img src="/logo512.svg" alt="SalaryGuessr" className="hp-title-emoji" />
              </h1>
            </div>
            
            <div className="hp-subtitles">
              <p className="hp-subtitle hp-subtitle-main">
                <span className="hp-subtitle-icon">🔥</span>
                Teste ton instinct ! Deviens un pro de l'estimation salariale
              </p>
              
              <p className="hp-subtitle hp-subtitle-secondary">
                <span className="hp-subtitle-icon">🎯</span>
                À chaque manche, découvre une offre d'emploi réelle. Devine le salaire 
                le plus précisément possible. Chaque point compte !
              </p>
            </div>

            <div className="hp-statsRow">
              {[
                { value: "∞", label: "Offres Réelles", icon: "📊", color: "#4f46e5" },
                { value: "3", label: "Modes de jeu", icon: "🎮", color: "#ec4899" },
                { value: "100%", label: "GRATUIT", icon: "🎁", color: "#10b981" }
              ].map((stat, idx) => (
                <div 
                  key={idx}
                  className={`hp-statCard ${hoveredStat === idx ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredStat(idx)}
                  onMouseLeave={() => setHoveredStat(null)}
                  style={{ '--stat-color': stat.color }}
                >
                  <div className="hp-statIcon">{stat.icon}</div>
                  <div className="hp-statValue">{stat.value}</div>
                  <div className="hp-statLabel">{stat.label}</div>
                  <div className="hp-statGlow"></div>
                </div>
              ))}
            </div>

            <button
              className={`hp-playButton ${loading ? "loading" : ""}`}
              onClick={goToModeSelect}
              disabled={loading}
            >
              <span className="hp-playButton-text">
                {loading ? "⏳ CHARGEMENT..." : "🚀 JOUER"}
              </span>
              {!loading && <span className="hp-playButton-arrow">→</span>}
            </button>

            <div className="hp-contactSection">
              <div className="hp-buttonsRow">
                <button className="hp-discordButton" onClick={contactDiscord}>
                  <svg className="hp-discordIcon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0c-.164-.386-.398-.875-.608-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.045-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.21 10.21 0 0 0 .382-.292a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.382.292a.077.077 0 0 1-.006.128a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.106c.352.699.764 1.364 1.226 1.994a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Discord
                </button>
                <button className="hp-githubButton" onClick={() => window.open('https://github.com/julianlebouc/SalaryGuessr', '_blank', 'noopener,noreferrer')}>
                  <svg className="hp-githubIcon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.26.82-.583 0-.288-.01-1.05-.015-2.06-3.338.726-4.042-1.61-4.042-1.61-.546-1.39-1.335-1.76-1.335-1.76-1.09-.746.082-.73.082-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.123-.3-.535-1.52.117-3.16 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.29-1.552 3.297-1.23 3.297-1.23.653 1.64.24 2.86.118 3.16.768.84 1.233 1.91 1.233 3.22 0 4.61-2.804 5.62-5.476 5.92.43.37.824 1.102.824 2.22 0 1.602-.015 2.894-.015 3.287 0 .325.216.7.83.58C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  GitHub
                </button>
              </div>
              <p className="hp-discordHint">Discord ID: {discordId}</p>
            </div>
          </div>

          <div className="hp-previewPanel">
            <div className="hp-previewHeader">
              <div className="hp-windowControls">
                <span className="hp-windowControl hp-control-red"></span>
                <span className="hp-windowControl hp-control-yellow"></span>
                <span className="hp-windowControl hp-control-green"></span>
              </div>
              <div className="hp-previewBadge">🎮 APERÇU</div>
            </div>

            <div className="hp-previewBody">
              <div className="hp-previewTag">
                <span className="hp-tagPulse"></span>
                MANCHE 1
              </div>
              <h3 className="hp-previewTitle">Senior Frontend Developer</h3>

              <div className="hp-previewMeta">
                <span className="hp-metaItem">
                  <span className="hp-metaIcon">🏢</span> TechNova
                </span>
                <span className="hp-metaItem">
                  <span className="hp-metaIcon">📍</span> Paris
                </span>
                <span className="hp-metaItem">
                  <span className="hp-metaIcon">📄</span> CDI
                </span>
              </div>

              <div className="hp-salarySection">
                <div className="hp-salaryLabel">
                  <span>📊 TA PROXIMITÉ</span>
                  <span className="hp-salaryPercent">0% → 100%</span>
                </div>
                <div className="hp-salaryBar">
                  <div className="hp-salaryBarFill">
                    <div className="hp-salaryBarGlow"></div>
                  </div>
                </div>
              </div>

              <div className="hp-previewSalary">
                <div className="hp-estimateBox">
                  <span className="hp-estimateLabel">💡 TON ESTIMATION</span>
                  <strong className="hp-estimateValue">4 200 €</strong>
                </div>
                <div className="hp-arrowIcon">↓</div>
                <div className="hp-realBox">
                  <span className="hp-realLabel">🎯 SALAIRE RÉEL</span>
                  <strong className="hp-realValue">4 850 €</strong>
                </div>
              </div>

              <div className="hp-previewReveal">
                <div className="hp-revealScore">
                  <span>🏆</span>
                  <span className="hp-subtitle">SCORE: 86 pts</span>
                </div>
                <div className="hp-revealBadge">+13% de précision</div>
              </div>
            </div>

            <div className="hp-previewFooter">
              <div className="hp-loadingDots">
                <span></span><span></span><span></span>
              </div>
              <span>Prochaine offre en préparation...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}