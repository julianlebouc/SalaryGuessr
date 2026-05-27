import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import "../styles/StatsPage.css";
import { fetchLeaderboard } from "../utils/gameUtils";
import { useSettings } from "../context/SettingsContext";

const API_URL = process.env.REACT_APP_API_URL || "";

/**
 * @module Pages/StatsPage
 */

const T = {
  fr: {
    title: "Records",
    classicTitle: "Records - Classique",
    highlowTitle: "Records - High / Low",
    noScore: "Aucun score enregistré",
    statsTitle: "Statistiques",
    statsIntro: 'Aperçu de l\'activité lors des <span style="font-weight: bold">30 derniers jours</span>',
    visitors: "VISITEURS",
    gamesPlayed: "PARTIES JOUÉES",
    dailyActivity: "Activité Quotidienne",
    performances: "Performances",
    classic: "Classique",
    highlow: "High / Low",
    avg: "MOY.",
    rec: "REC.",
    chartLabel: "Parties",
    loading: "Chargement...",
  },
  en: {
    title: "Records",
    classicTitle: "Records - Classic",
    highlowTitle: "Records - High / Low",
    noScore: "No scores recorded",
    statsTitle: "Statistics",
    statsIntro: 'Activity overview for the last <span style="font-weight: bold">30 days</span>',
    visitors: "VISITORS",
    gamesPlayed: "GAMES PLAYED",
    dailyActivity: "Daily Activity",
    performances: "Performance",
    classic: "Classic",
    highlow: "High / Low",
    avg: "AVG.",
    rec: "BEST",
    chartLabel: "Games",
    loading: "Loading...",
  },
};

/**
 * Formats a date string into a French localized short date.
 * 
 * @param {string} dateStr - The date string to format.
 * @returns {string} The formatted date (e.g., "12 mai").
 */
const formatDate = (dateStr, locale = 'fr-FR') => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
};

/**
 * StatsPage component.
 * Fetches and displays global game statistics using charts and metrics.
 * 
 * @component
 * @returns {JSX.Element} The rendered Statistics page.
 */
export default function StatsPage() {
  const { language } = useSettings();
  const t = T[language] || T.fr;
  const locale = language === "en" ? "en-US" : "fr-FR";

  const [data, setData] = useState(null);
  const [leaderboard, setLeaderboard] = useState({ classic: [], highlow: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, lbRes] = await Promise.all([
          fetch(`${API_URL}/api/stats/global`).then(r => r.json()),
          fetchLeaderboard(language)
        ]);
        if (statsRes) setData(statsRes);
        if (lbRes) setLeaderboard(lbRes);
      } catch {} finally { setLoading(false); }
    };
    fetchStats();
  }, [language]);

  if (loading) return <div className="page-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>{t.loading}</div>;

  return (
    <div className="page-wrapper stats-page">
      <div className="tile-grid">
        <div className="tile span-12 tile-animate" style={{ animationDelay: '0.04s' }}>
          <header className="tile-content stats-header">
            <h1 className="gp-titleMain" style={{ marginBottom: '1rem' }}>{t.title}</h1>
          </header>
        </div>

        <div className="tile span-6 tile-animate" style={{ animationDelay: '0.24s' }}>
          <div className="tile-content">
            <h2 className="stats-sub">{t.classicTitle}</h2>
            <div className="mode-leaderboard">
              <ul className="leaderboard-list">
                {leaderboard.classic?.length > 0 ? leaderboard.classic.map((entry, i) => (
                  <li key={i} className={`leaderboard-item ${["gold", "silver", "bronze"][i]}`}>
                    <span className="leaderboard-rank">{["🥇", "🥈", "🥉"][i]}</span>
                    <span className="leaderboard-pseudo">{entry.pseudo}</span>
                    <span className="leaderboard-date">{formatDate(entry.date, locale)}</span>
                    <span className="leaderboard-score">{entry.score.toFixed(1)} PTS</span>
                  </li>
                )) : <li className="leaderboard-empty-text">{t.noScore}</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="tile span-6 tile-grid-bg tile-animate" style={{ animationDelay: '0.28s' }}>
          <div className="tile-content">
            <h2 className="stats-sub">{t.highlowTitle}</h2>
            <div className="mode-leaderboard">
              <ul className="leaderboard-list">
                {leaderboard.highlow?.length > 0 ? leaderboard.highlow.map((entry, i) => (
                  <li key={i} className={`leaderboard-item ${["gold", "silver", "bronze"][i]}`}>
                    <span className="leaderboard-rank">{["🥇", "🥈", "🥉"][i]}</span>
                    <span className="leaderboard-pseudo">{entry.pseudo}</span>
                    <span className="leaderboard-date">{formatDate(entry.date, locale)}</span>
                    <span className="leaderboard-score">{entry.score}</span>
                  </li>
                )) : <li className="leaderboard-empty-text">{t.noScore}</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="tile span-12 tile-animate" style={{ animationDelay: '0.04s' }}>
          <header className="tile-content stats-header">
            <h1 className="gp-titleMain" style={{ marginBottom: '1rem' }}>{t.statsTitle}</h1>
            <p className="stats-intro" dangerouslySetInnerHTML={{ __html: t.statsIntro }} />
          </header>
        </div>

        <div className="tile span-6 tile-grid-bg tile-animate" style={{ animationDelay: '0.08s' }}>
          <div className="tile-content stats-hero-item">
            <span className="stats-hero-val">{data?.unique_sessions_count || 0}</span>
            <span className="stats-hero-lab">{t.visitors}</span>
          </div>
        </div>
        <div className="tile span-6 tile-animate" style={{ animationDelay: '0.12s' }}>
          <div className="tile-content stats-hero-item">
            <span className="stats-hero-val">{data?.total_games_played || 0}</span>
            <span className="stats-hero-lab">{t.gamesPlayed}</span>
          </div>
        </div>

        <div className="tile span-8 row-span-2 tile-animate" style={{ animationDelay: '0.16s' }}>
          <div className="tile-content stats-chart-wrap">
            <h2 className="stats-sub">{t.dailyActivity}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.daily_activity || []}>
                <XAxis dataKey="day" tickFormatter={(d) => formatDate(d, locale)} stroke="rgba(180,180,180,0.4)" fontSize={12} tickMargin={10} />
                <YAxis stroke="rgba(180,180,180,0.4)" fontSize={12} tickMargin={10} />
                <Tooltip labelFormatter={(d) => formatDate(d, locale)} contentStyle={{ background: "#1a103d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }} itemStyle={{ color: "#aaa" }} />
                <Bar dataKey="count" name={t.chartLabel} fill="var(--primary-purple)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="tile span-4 row-span-2 tile-grid-bg tile-animate" style={{ animationDelay: '0.2s' }}>
          <div className="tile-content">
            <h2 className="stats-sub">{t.performances}</h2>
            <div className="stats-modes-list">
              <div className="stats-mode-row">
                <div className="mode-name">{t.classic}</div>
                <div className="mode-vals">
                  <span>{t.avg} <strong>{data?.modes?.classic?.avg_score?.toFixed(1) || "0.0"}</strong></span>
                  <span>{t.rec} <strong>{data?.modes?.classic?.max_score?.toFixed(1) || "0.0"}</strong></span>
                </div>
              </div>
              <div className="stats-mode-row">
                <div className="mode-name">{t.highlow}</div>
                <div className="mode-vals">
                  <span>{t.avg} <strong>{data?.modes?.highlow?.avg_score?.toFixed(1) || "0.0"}</strong></span>
                  <span>{t.rec} <strong>{data?.modes?.highlow?.max_score?.toFixed(0) || "0"}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}