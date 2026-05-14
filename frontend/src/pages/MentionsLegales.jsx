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
        <div className="tile span-12 tile-animate" style={{ animationDelay: '0.04s' }}>
          <header className="tile-content ml-header">
            <h1 className="ml-title">Mentions Légales</h1>
            <p>Dernière mise à jour : 12 mai 2026</p>
          </header>
        </div>

        <div className="tile span-6 tile-animate" style={{ animationDelay: '0.08s' }}>
          <section className="tile-content ml-section">
            <h2>1. Éditeur du site</h2>
            <p>
              Le site <strong>SalaryGuessr</strong> est un projet personnel édité par Julian Lebouc.<br />
              Contact : via Discord,GitHub ou LinkedIn.
            </p>
          </section>
        </div>

        <div className="tile span-6 tile-animate" style={{ animationDelay: '0.12s' }}>
          <section className="tile-content ml-section">
            <h2>2. Hébergement</h2>
            <p>
              Ce site est hébergé sur un serveur privé situé en France.
              Les services de <strong>Cloudflare</strong> sont utilisés pour l'optimisation et la sécurité du réseau.
            </p>
          </section>
        </div>

        <div className="tile span-12 tile-animate" style={{ animationDelay: '0.16s' }}>
          <section className="tile-content ml-section">
            <h2>3. Propriété intellectuelle</h2>
            <p>
              Le code source est disponible sous licence <strong>GNU GPL v3</strong>.
              Les éléments graphiques originaux, le nom et le concept sont la propriété de l'éditeur.
            </p>
          </section>
        </div>

        <div className="tile span-6 tile-animate" style={{ animationDelay: '0.2s' }}>
          <section className="tile-content ml-section">
            <h2>4. Protection des données</h2>
            <p>
              SalaryGuessr respecte votre vie privée :
            </p>
            <ul>
              <li><strong>Anonymat :</strong> Aucune inscription, aucun compte.</li>
              <li><strong>Cookies :</strong> Aucun cookie de pistage ou publicitaire.</li>
              <li><strong>Stockage local :</strong> Vos préférences et scores sont stockés uniquement sur votre appareil.</li>
            </ul>
          </section>
        </div>

        <div className="tile span-6 tile-animate" style={{ animationDelay: '0.24s' }}>
          <section className="tile-content ml-section">
            <h2>5. Données Techniques</h2>
            <p>
              Les adresses IP peuvent être collectées dans les journaux de sécurité du serveur pour prévenir les abus,
              conformément à l'intérêt légitime de l'éditeur pour assurer la sécurité du service.
            </p>
          </section>
        </div>

        <div className="tile span-12 tile-animate" style={{ animationDelay: '0.28s' }}>
          <div className="tile-content ml-footer">
            © {new Date().getFullYear()} SalaryGuessr — Développé avec passion.
          </div>
        </div>
      </div>
    </div>
  );
}
