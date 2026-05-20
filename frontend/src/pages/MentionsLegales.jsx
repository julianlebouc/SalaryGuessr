import React from 'react';
import '../styles/MentionsLegales.css';

/**
 * @module Pages/MentionsLegales
 */

/**
 * Redesigned Mentions Légales page for SalaryGuessr.
 * Provides legal information with a modern aesthetic.
 * @component
 * @returns {JSX.Element}
 */
export default function MentionsLegales() {
  return (
    <div className="ml-container">
      <div className="tile-grid">
        {/* Header */}
        <div className="tile span-12 tile-animate" style={{ animationDelay: '0.04s' }}>
          <header className="tile-content ml-header">
            <h1 className="ml-title">Mentions Légales</h1>
            <p>Dernière mise à jour : 20 mai 2026</p>
          </header>
        </div>

        {/* Éditeur */}
        <div className="tile span-6 tile-animate" style={{ animationDelay: '0.08s' }}>
          <section className="tile-content ml-section">
            <h2>1. Éditeur du site</h2>
            <p>
              <strong>SalaryGuessr</strong> est un projet personnel édité par Julian Lebouc.
            </p>
            <p>
              <strong>Contact :</strong> Via Discord, Linkedin ou le dépôt GitHub du projet.
            </p>
          </section>
        </div>

        {/* Hébergement */}
        <div className="tile span-6 tile-animate" style={{ animationDelay: '0.12s' }}>
          <section className="tile-content ml-section">
            <h2>2. Hébergement</h2>
            <p>
              Serveur privé situé en <strong>France</strong>.
            </p>
            <p>
              Services <strong>Cloudflare</strong> (optimisation, sécurité). Cloudflare peut traiter 
              certaines données hors UE dans le cadre des clauses contractuelles types (CCT).
            </p>
          </section>
        </div>

        {/* Propriété intellectuelle */}
        <div className="tile span-6 tile-animate" style={{ animationDelay: '0.16s' }}>
          <section className="tile-content ml-section">
            <h2>3. Propriété intellectuelle</h2>
            <p>
              Code source sous licence <strong>GNU GPL v3</strong>.
            </p>
            <p>
              Nom, concept et éléments graphiques originaux : propriété de l'éditeur.
            </p>
          </section>
        </div>

        {/* Protection des données — section unifiée */}
        <div className="tile span-6 tile-animate" style={{ animationDelay: '0.2s' }}>
          <section className="tile-content ml-section">
            <h2>4. Protection des données personnelles</h2>
            
            <h3>Données collectées</h3>
            <ul>
              <li>
                <strong>Stockage local (localStorage) :</strong> préférences d'affichage et de jeu. 
                Ces données restent sur votre appareil et ne sont pas transmises au serveur.
              </li>
              <li>
                <strong>Journaux serveur :</strong> adresse IP (sécurité, prévention des abus).
              </li>
              <li>
                <strong>Scores :</strong> anonymisés avant traitement pour statistiques agrégées.
              </li>
            </ul>

            <h3>Base juridique</h3>
            <p>Intérêt légitime (sécurité du service et analyse statistique anonyme).</p>

            <h3>Conservation</h3>
            <ul>
              <li>Journaux IP et données analytiques : <strong>30 jours</strong>.</li>
              <li>Stockage local : jusqu'à suppression par l'utilisateur.</li>
            </ul>

            <h3>Sécurité</h3>
            <p>HTTPS, minimisation des données, anonymisation des scores.</p>
          </section>
        </div>

        {/* Droits des utilisateurs */}
        <div className="tile span-12 tile-animate" style={{ animationDelay: '0.24s' }}>
          <section className="tile-content ml-section">
            <h2>5. Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez d'un droit d'<strong>accès</strong>, de <strong>rectification</strong>, 
              d'<strong>effacement</strong>, d'<strong>opposition</strong>, de <strong>limitation</strong> du traitement 
              et de <strong>portabilité</strong> de vos données.
            </p>
            <p>
              Pour exercer ces droits : contactez l'éditeur à l'adresse indiquée ci-dessus.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="tile span-12 tile-animate" style={{ animationDelay: '0.28s' }}>
          <div className="tile-content ml-footer">
            © {new Date().getFullYear()} SalaryGuessr — Développé avec passion.
          </div>
        </div>
      </div>
    </div>
  );
}
