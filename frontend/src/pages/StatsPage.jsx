import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "../styles/StatsPage.css";
import { fetchLeaderboard } from "../utils/gameUtils";

const API_URL = process.env.REACT_APP_API_URL || "";

/**
 * @module Pages/StatsPage
 */

/**
 * Formats a date string into a French localized short date.
 * 
 * @param {string} dateStr - The date string to format.
 * @returns {string} The formatted date (e.g., "12 mai").
 */
const formatDateFr = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

/**
 * StatsPage component.
 * Fetches and displays global game statistics using charts and metrics.
 * 
 * @component
 * @returns {JSX.Element} The rendered Statistics page.
 */
export default function StatsPage() {
  const [data, setData] = useState(null);
  const [leaderboard, setLeaderboard] = useState({ classic: [], highlow: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsResponse, leaderboardResponse] = await Promise.all([
          fetch(`${API_URL}/api/stats/global`).then(res => res.json()),
          fetchLeaderboard()
        ]);

        if (statsResponse) {
          setData(statsResponse);
        }
        if (leaderboardResponse) {
          setLeaderboard(leaderboardResponse);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="page-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>Chargement...</div>;

  return (
    <div className="page-wrapper stats-page">
      <div className="tile-grid">
        <div className="tile span-12 tile-animate" style={{ animationDelay: '0.04s' }}>
          <header className="tile-content stats-header">
            <h1 className="gp-titleMain" style={{ marginBottom: '1rem' }}>Records</h1>
          </header>
        </div>

        <div className="tile span-6 tile-animate" style={{ animationDelay: '0.24s' }}>
          <div className="tile-content">
            <h2 className="stats-sub">Records - Classique</h2>
            <div className="mode-leaderboard">
              <ul className="leaderboard-list">
                {leaderboard.classic && leaderboard.classic.length > 0 ? (
                  leaderboard.classic.map((entry, index) => {
                    const medals = ["🥇", "🥈", "🥉"];
                    const medalClass = ["gold", "silver", "bronze"][index];
                    return (
                      <li key={index} className={`leaderboard-item ${medalClass}`}>
                        <span className="leaderboard-rank">{medals[index]}</span>
                        <span className="leaderboard-pseudo">{entry.pseudo}</span>
                        <span className="leaderboard-date">{formatDateFr(entry.date)}</span>
                        <span className="leaderboard-score">{entry.score.toFixed(1)} PTS</span>
                      </li>
                    );
                  })
                ) : (
                  <li className="leaderboard-empty-text">Aucun score enregistré</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="tile span-6 tile-grid-bg tile-animate" style={{ animationDelay: '0.28s' }}>
          <div className="tile-content">
            <h2 className="stats-sub">Records - High / Low</h2>
            <div className="mode-leaderboard">
              <ul className="leaderboard-list">
                {leaderboard.highlow && leaderboard.highlow.length > 0 ? (
                  leaderboard.highlow.map((entry, index) => {
                    const medals = ["🥇", "🥈", "🥉"];
                    const medalClass = ["gold", "silver", "bronze"][index];
                    return (
                      <li key={index} className={`leaderboard-item ${medalClass}`}>
                        <span className="leaderboard-rank">{medals[index]}</span>
                        <span className="leaderboard-pseudo">{entry.pseudo}</span>
                        <span className="leaderboard-date">{formatDateFr(entry.date)}</span>
                        <span className="leaderboard-score">{entry.score}</span>
                      </li>
                    );
                  })
                ) : (
                  <li className="leaderboard-empty-text">Aucun score enregistré</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="tile span-12 tile-animate" style={{ animationDelay: '0.04s' }}>
          <header className="tile-content stats-header">
            <h1 className="gp-titleMain" style={{ marginBottom: '1rem' }}>Statistiques</h1>
            <p className="stats-intro">Aperçu de l'activité lors des <span style={{ fontWeight: 'bold' }}>30 derniers jours</span></p>
          </header>
        </div>

        <div className="tile span-6 tile-grid-bg tile-animate" style={{ animationDelay: '0.08s' }}>
          <div className="tile-content stats-hero-item">
            <span className="stats-hero-val">{data?.unique_sessions_count || 0}</span>
            <span className="stats-hero-lab">VISITEURS</span>
          </div>
        </div>

        <div className="tile span-6 tile-animate" style={{ animationDelay: '0.12s' }}>
          <div className="tile-content stats-hero-item">
            <span className="stats-hero-val">{data?.total_games_played || 0}</span>
            <span className="stats-hero-lab">PARTIES JOUÉES</span>
          </div>
        </div>

        <div className="tile span-8 row-span-2 tile-animate" style={{ animationDelay: '0.16s' }}>
          <div className="tile-content stats-chart-wrap">
            <h2 className="stats-sub">Activité Quotidienne</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.daily_activity || []}>
                <XAxis
                  dataKey="day"
                  tickFormatter={formatDateFr}
                  stroke="rgba(180,180,180,0.4)"
                  fontSize={12}
                  tickMargin={10}
                />
                <YAxis
                  stroke="rgba(180,180,180,0.4)"
                  fontSize={12}
                  tickMargin={10}
                />
                <Tooltip
                  labelFormatter={formatDateFr}
                  contentStyle={{ background: "#1a103d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
                  itemStyle={{ color: "#aaa" }}
                />
                <Bar dataKey="count" name="Parties" fill="var(--primary-purple)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="tile span-4 row-span-2 tile-grid-bg tile-animate" style={{ animationDelay: '0.2s' }}>
          <div className="tile-content">
            <h2 className="stats-sub">Performances</h2>
            <div className="stats-modes-list">
              <div className="stats-mode-row">
                <div className="mode-name">Classique</div>
                <div className="mode-vals">
                  <span>MOY. <strong>{data?.modes?.classic?.avg_score?.toFixed(1) || "0.0"}</strong></span>
                  <span>REC. <strong>{data?.modes?.classic?.max_score?.toFixed(1) || "0.0"}</strong></span>
                </div>
              </div>
              <div className="stats-mode-row">
                <div className="mode-name">High / Low</div>
                <div className="mode-vals">
                  <span>MOY. <strong>{data?.modes?.highlow?.avg_score?.toFixed(1) || "0.0"}</strong></span>
                  <span>REC. <strong>{data?.modes?.highlow?.max_score?.toFixed(0) || "0"}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
