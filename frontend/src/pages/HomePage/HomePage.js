import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

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

  const startGame = () => {
    setLoading(true);
    setTimeout(() => {
      navigate("/game");
    }, 800);
  };

  const contactDiscord = () => {
    navigator.clipboard.writeText(discordId);
    // Animation de feedback
    const btn = document.querySelector('.hp-discordButton');
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btn.style.transform = '';
    }, 200);
    window.open(`https://discord.com/users/${discordId}`, "_blank", "noopener,noreferrer");
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
            
            <p className="hp-subtitle">
              Teste ton instinct ! Deviens un pro de l'estimation salariale 🔥
            </p>

            <p className="hp-description">
              À chaque manche, découvre une offre d'emploi réelle. À toi de deviner 
              le salaire le plus précisément possible. Chaque point compte !
            </p>

            <div className="hp-statsRow">
              {[
                { value: "∞", label: "Offres uniques", icon: "📊", color: "#4f46e5" },
                { value: "5-50", label: "Manches", icon: "🎯", color: "#ec4899" },
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
              onClick={startGame}
              disabled={loading}
            >
              <span className="hp-playButton-text">
                {loading ? "⏳ CHARGEMENT..." : "🚀 LANCER LA PARTIE"}
              </span>
              {!loading && <span className="hp-playButton-arrow">→</span>}
            </button>

            <div className="hp-contactSection">
              <button className="hp-discordButton" onClick={contactDiscord}>
                <span className="hp-discordIcon">💬</span>
                Contacter sur Discord
                <span className="hp-discordCopy">📋</span>
              </button>
              <p className="hp-discordHint">ID: {discordId} (clique pour copier)</p>
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
                  <span className="hp-scoreIcon">🏆</span>
                  <span>SCORE: 86 pts</span>
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