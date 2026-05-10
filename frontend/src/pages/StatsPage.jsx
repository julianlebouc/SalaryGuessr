import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import "../styles/GamePage.css"; // Reuse existing styles
import "../styles/StatsPage.css"; // We'll create some specific styles

const API_URL = process.env.REACT_APP_API_URL || "";

/**
 * Global Statistics Page.
 * Displays aggregated data from server-side logs.
 * @component
 */
export default function StatsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/stats/global`);
        if (!response.ok) throw new Error("Erreur lors du chargement des statistiques");
        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="gp-container gp-container--playing">
        <div className="gp-card gp-loadingCard">
          <div className="gp-loader"><span></span><span></span><span></span></div>
          <h2 className="gp-loadingTitle">Chargement des statistiques...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gp-container gp-container--playing">
        <div className="gp-card">
          <h2 className="gp-loadingTitle">❌ {error}</h2>
          <button className="gp-replayButton" onClick={() => navigate("/")}>Retour</button>
        </div>
      </div>
    );
  }

  return (
    <div className="gp-container gp-container--playing stats-page">
      <button className="gp-homeBtn" onClick={() => navigate("/")}>
        <img src="/logo512.svg" alt="SalaryGuessr" className="gp-homeLogo" />
        <span>SalaryGuessr</span>
      </button>

      <div className="gp-card stats-card">
        <div className="gp-cardGlow" />
        <h1 className="gp-titleMain">Statistiques Globales</h1>
        <p className="gp-subtitle">Aperçu de l'activité sur les 30 derniers jours</p>

        <div className="stats-overview-grid">
          <div className="gp-statCard">
            <div className="gp-statIcon">👥</div>
            <div className="gp-statInfo">
              <div className="gp-statLabel">Sessions Uniques</div>
              <div className="gp-statValue">{data.unique_sessions_count}</div>
            </div>
          </div>
          <div className="gp-statCard">
            <div className="gp-statIcon">🎮</div>
            <div className="gp-statInfo">
              <div className="gp-statLabel">Total Parties</div>
              <div className="gp-statValue">{data.total_games_played}</div>
            </div>
          </div>
        </div>

        <div className="stats-modes-container">
          <h2 className="stats-section-title">Performance par Mode</h2>
          <div className="stats-modes-grid">
            {/* CLASSIC MODE */}
            <div className="mode-stat-box">
              <h3>🎯 Mode Classique</h3>
              <div className="mode-metrics">
                <div className="metric"><span>Parties:</span> <strong>{data.modes.classic.games}</strong></div>
                <div className="metric"><span>Score Moyen:</span> <strong>{data.modes.classic.avg_score.toFixed(2)} / 100</strong></div>
                <div className="metric"><span>Record:</span> <strong>{data.modes.classic.max_score.toFixed(2)} / 100</strong></div>
                <div className="metric"><span>Pire Score:</span> <strong>{data.modes.classic.min_score.toFixed(2)} / 100</strong></div>
              </div>
            </div>

            {/* HIGH/LOW MODE */}
            <div className="mode-stat-box">
              <h3>⚖️ Mode High / Low</h3>
              <div className="mode-metrics">
                <div className="metric"><span>Parties:</span> <strong>{data.modes.highlow.games}</strong></div>
                <div className="metric"><span>Score Moyen:</span> <strong>{data.modes.highlow.avg_score.toFixed(2)}</strong></div>
                <div className="metric"><span>Record:</span> <strong>{data.modes.highlow.max_score.toFixed(2)}</strong></div>
                <div className="metric"><span>Pire Score:</span> <strong>{data.modes.highlow.min_score.toFixed(2)}</strong></div>
              </div>
            </div>

            {/* BATTLE ROYALE */}
            <div className="mode-stat-box">
              <h3>⚔️ Battle Royale</h3>
              <div className="mode-metrics">
                <div className="metric"><span>Parties Lancées:</span> <strong>{data.modes.battle_royale.games}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-chart-section">
          <h2 className="stats-section-title">Activité Quotidienne (Parties)</h2>
          <div className="gp-chartWrap">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.daily_activity}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="day" stroke="#fff" tick={{ fill: "#fff", fontSize: 10 }} />
                <YAxis stroke="#fff" tick={{ fill: "#fff" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(20, 16, 40, 0.95)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                    borderRadius: "14px",
                  }}
                />
                <Bar dataKey="count" name="Parties" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="gp-resultActions">
          <button className="gp-replayButton" onClick={() => navigate("/")}>🏠 ACCUEIL</button>
        </div>
      </div>
    </div>
  );
}
