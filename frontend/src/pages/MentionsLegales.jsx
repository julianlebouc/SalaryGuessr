import React from 'react';
import { useSettings } from "../context/SettingsContext";
import '../styles/MentionsLegales.css';

/**
 * @module Pages/MentionsLegales
 */

const T = {
  fr: {
    title: "Mentions Légales",
    lastUpdate: "Dernière mise à jour : 20 mai 2026",
    sections: [
      {
        title: "1. Éditeur du site",
        lines: [
          "<strong>SalaryGuessr</strong> est un projet personnel édité par Julian Lebouc.",
          "<strong>Contact :</strong> Via Discord, Linkedin ou le dépôt GitHub du projet.",
        ],
      },
      {
        title: "2. Hébergement",
        lines: [
          "Serveur privé situé en <strong>France</strong>.",
          "Services <strong>Cloudflare</strong> (optimisation, sécurité). Cloudflare peut traiter certaines données hors UE dans le cadre des clauses contractuelles types (CCT).",
        ],
      },
      {
        title: "3. Propriété intellectuelle",
        lines: [
          "Code source sous licence <strong>GNU GPL v3</strong>.",
          "Nom, concept et éléments graphiques originaux : propriété de l'éditeur.",
        ],
      },
      {
        title: "4. Protection des données personnelles",
        subsections: [
          {
            heading: "Données collectées",
            items: [
              "<strong>Stockage local (localStorage) :</strong> préférences d'affichage et de jeu. Ces données restent sur votre appareil et ne sont pas transmises au serveur.",
              "<strong>Journaux serveur :</strong> adresse IP (sécurité, prévention des abus).",
              "<strong>Scores :</strong> anonymisés avant traitement pour statistiques agrégées.",
            ],
          },
          { heading: "Base juridique", text: "Intérêt légitime (sécurité du service et analyse statistique anonyme)." },
          { heading: "Conservation", items: [
            "Journaux IP et données analytiques : <strong>30 jours</strong>.",
            "Stockage local : jusqu'à suppression par l'utilisateur.",
          ]},
          { heading: "Sécurité", text: "HTTPS, minimisation des données, anonymisation des scores." },
        ],
      },
      {
        title: "5. Vos droits",
        lines: [
          "Conformément au RGPD, vous disposez d'un droit d'<strong>accès</strong>, de <strong>rectification</strong>, d'<strong>effacement</strong>, d'<strong>opposition</strong>, de <strong>limitation</strong> du traitement et de <strong>portabilité</strong> de vos données.",
          "Pour exercer ces droits : contactez l'éditeur à l'adresse indiquée ci-dessus.",
        ],
      },
    ],
    footer: "Développé avec passion.",
  },
  en: {
    title: "Legal Notice",
    lastUpdate: "Last updated: May 20, 2026",
    sections: [
      {
        title: "1. Publisher",
        lines: [
          "<strong>SalaryGuessr</strong> is a personal project published by Julian Lebouc.",
          "<strong>Contact:</strong> Via Discord, LinkedIn, or the project's GitHub repository.",
        ],
      },
      {
        title: "2. Hosting",
        lines: [
          "Private server located in <strong>France</strong>.",
          "<strong>Cloudflare</strong> services (optimization, security). Cloudflare may process some data outside the EU under standard contractual clauses (SCC).",
        ],
      },
      {
        title: "3. Intellectual Property",
        lines: [
          "Source code under <strong>GNU GPL v3</strong> license.",
          "Name, concept and original graphic elements: property of the publisher.",
        ],
      },
      {
        title: "4. Personal Data Protection",
        subsections: [
          {
            heading: "Data collected",
            items: [
              "<strong>Local storage (localStorage):</strong> display and game preferences. This data stays on your device and is not sent to the server.",
              "<strong>Server logs:</strong> IP address (security, abuse prevention).",
              "<strong>Scores:</strong> anonymized before processing for aggregated statistics.",
            ],
          },
          { heading: "Legal basis", text: "Legitimate interest (service security and anonymous statistical analysis)." },
          { heading: "Retention", items: [
            "IP logs and analytics data: <strong>30 days</strong>.",
            "Local storage: until deleted by the user.",
          ]},
          { heading: "Security", text: "HTTPS, data minimization, score anonymization." },
        ],
      },
      {
        title: "5. Your Rights",
        lines: [
          "Under GDPR, you have the right to <strong>access</strong>, <strong>rectify</strong>, <strong>erase</strong>, <strong>object</strong>, <strong>restrict</strong> processing, and <strong>port</strong> your data.",
          "To exercise these rights: contact the publisher at the address above.",
        ],
      },
    ],
    footer: "Built with passion.",
  },
};

/**
 * Redesigned Mentions Légales page for SalaryGuessr.
 * Provides legal information with a modern aesthetic.
 * @component
 * @returns {JSX.Element}
 */
export default function MentionsLegales() {
  const { language } = useSettings();
  const t = T[language] || T.fr;

  return (
    <div className="ml-container">
      <div className="tile-grid">
        <div className="tile span-12 tile-animate" style={{ animationDelay: '0.04s' }}>
          <header className="tile-content ml-header">
            <h1 className="ml-title">{t.title}</h1>
            <p>{t.lastUpdate}</p>
          </header>
        </div>

        {t.sections.map((section, idx) => (
          <div key={idx} className={`tile ${section.subsections ? "span-6" : section.lines ? "span-6" : "span-12"} tile-animate`} style={{ animationDelay: `${0.08 + idx * 0.04}s` }}>
            <section className="tile-content ml-section">
              <h2>{section.title}</h2>
              {section.lines && section.lines.map((line, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: line }} />
              ))}
              {section.subsections && section.subsections.map((sub, i) => (
                <div key={i}>
                  <h3>{sub.heading}</h3>
                  {sub.text && <p dangerouslySetInnerHTML={{ __html: sub.text }} />}
                  {sub.items && (
                    <ul>
                      {sub.items.map((item, j) => (
                        <li key={j} dangerouslySetInnerHTML={{ __html: item }} />
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          </div>
        ))}

        <div className="tile span-12 tile-animate" style={{ animationDelay: '0.28s' }}>
          <div className="tile-content ml-footer">
            © {new Date().getFullYear()} SalaryGuessr — {t.footer}
          </div>
        </div>
      </div>
    </div>
  );
}