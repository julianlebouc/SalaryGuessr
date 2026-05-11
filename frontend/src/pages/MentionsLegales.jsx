import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MentionsLegales.css';

/**
 * @module Pages/MentionsLegales
 */

/**
 * Mentions Légales page for SalaryGuessr.
 * Provides legal information and GDPR compliance details.
 * Matches the site's graphical chart.
 * @component
 * @returns {JSX.Element}
 */
export default function MentionsLegales() {
  const navigate = useNavigate();

  return (
    <div className="ml-container">
      {/* Visual elements matching the site's theme */}
      <div className="ml-bubble" style={{ top: '10%', left: '5%', animationDelay: '0s' }}>⚖️</div>
      <div className="ml-bubble" style={{ top: '20%', right: '8%', animationDelay: '1.5s' }}>📜</div>
      <div className="ml-bubble" style={{ bottom: '15%', left: '12%', animationDelay: '0.8s' }}>🛡️</div>
      <div className="ml-bubble" style={{ bottom: '25%', right: '15%', animationDelay: '2.2s' }}>🔒</div>

      <div className="ml-orb" style={{ width: '300px', height: '300px', background: '#ff6b6b', top: '5%', left: '-5%' }} />
      <div className="ml-orb" style={{ width: '400px', height: '400px', background: '#4ecdc4', right: '-10%', bottom: '10%' }} />

      <button className="ml-back-btn" onClick={() => navigate('/')}>
        <img src="/logo192.svg" alt="Home" style={{ width: '24px', height: '24px' }} />
        <span>Accueil</span>
      </button>

      <div className="ml-content">
        <header className="ml-header">
          <h1 className="ml-title">Mentions Légales</h1>
          <p>Dernière mise à jour : 11 mai 2026</p>
        </header>

        <section className="ml-section">
          <h2>1. Éditeur du site</h2>
          <p>
            Le site <strong>SalaryGuessr</strong> est un projet personnel édité par Julian Lebouc.<br />
            Contact : via Discord, LinkedIn ou via le dépôt GitHub du projet.
          </p>
        </section>

        <section className="ml-section">
          <h2>2. Hébergement</h2>
          <p>
            Ce site est hébergé sur un serveur personnel situé en France.
            La gestion du nom de domaine et la protection du réseau sont assurées par les services de <strong>Cloudflare</strong>.
          </p>
        </section>

        <section className="ml-section">
          <h2>3. Propriété intellectuelle</h2>
          <p>
            Le code source de SalaryGuessr est distribué sous la licence <strong>GNU GPL v3</strong>.
            Les textes, logos et éléments graphiques originaux restent la propriété de l'éditeur.
            Toute utilisation commerciale non autorisée du contenu ou de la marque est interdite.
          </p>
        </section>

        <section className="ml-section">
          <h2>4. Protection des données (RGPD)</h2>
          <p>
            SalaryGuessr a été conçu dans le respect total de votre vie privée :
          </p>
          <ul>
            <li><strong>Zéro compte :</strong> Aucune inscription n'est requise pour jouer.</li>
            <li><strong>Données techniques :</strong> Seule votre adresse IP est enregistrée dans les journaux techniques du serveur pour des raisons de sécurité et de maintenance (intérêt légitime), sans aucune association avec votre identité.</li>
            <li><strong>Anonymat complet :</strong> Les scores et statistiques de jeu sont traités de manière totalement anonyme.</li>
          </ul>
        </section>

        <section className="ml-section">
          <h2>5. Cookies et Stockage</h2>
          <p>
            Nous n'utilisons aucun cookie publicitaire ou de pistage.
            Le stockage local de votre navigateur (LocalStorage) est utilisé uniquement pour sauvegarder vos préférences de jeu (volume sonore, records personnels) sur votre propre appareil.
          </p>
        </section>

        <section className="ml-section">
          <h2>6. Responsabilité</h2>
          <p>
            Les offres d'emploi affichées proviennent de sources tierces réelles. Bien que nous nous efforcions de garantir la cohérence des données,
            l'éditeur ne peut être tenu responsable d'éventuelles erreurs de saisie ou de données obsolètes.
          </p>
        </section>

        <footer className="ml-footer">
          © {new Date().getFullYear()} SalaryGuessr — Testez votre instinct.
        </footer>
      </div>
    </div>
  );
}
