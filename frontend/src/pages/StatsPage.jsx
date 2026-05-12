import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "../styles/StatsPage.css";

const API_URL = process.env.REACT_APP_API_URL || "";

const formatDateFr = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export default function StatsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/stats/global`);
        const json = await response.json();
        setData(json);
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
    <motion.div className="page-wrapper stats-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="stats-header">
        <h1 className="gp-titleMain">Statistiques</h1>
        <p className="stats-intro">Aperçu global (30 derniers jours)</p>
      </header>

      <div className="stats-grid-main">
        <div className="stats-column">
          <div className="stats-hero-row">
            <div className="stats-hero-item">
              <span className="stats-hero-val">{data.unique_sessions_count}</span>
              <span className="stats-hero-lab">VISITEURS</span>
            </div>
            <div className="stats-hero-item">
              <span className="stats-hero-val">{data.total_games_played}</span>
              <span className="stats-hero-lab">PARTIES JOUÉES</span>
            </div>
          </div>

          <div className="stats-chart-wrap">
            <h2 className="stats-sub">Activité Quotidienne</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.daily_activity}>
                <XAxis 
                  dataKey="day" 
                  tickFormatter={formatDateFr}
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={12}
                  tickMargin={10}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={12}
                  tickMargin={10}
                />
                <Tooltip 
                  labelFormatter={formatDateFr}
                  contentStyle={{ background: "#1a103d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }} 
                  itemStyle={{ color: "#fff" }}
                />
                <Bar dataKey="count" name="Parties" fill="var(--primary-purple)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="stats-column">
          <h2 className="stats-sub">Performances par Mode</h2>
          <div className="stats-modes-list">
            <div className="stats-mode-row">
              <div className="mode-name">Classique</div>
              <div className="mode-vals">
                <span>MOY. <strong>{data.modes.classic.avg_score.toFixed(1)}</strong></span>
                <span>REC. <strong>{data.modes.classic.max_score.toFixed(1)}</strong></span>
              </div>
            </div>
            <div className="stats-mode-row">
              <div className="mode-name">High / Low</div>
              <div className="mode-vals">
                <span>MOY. <strong>{data.modes.highlow.avg_score.toFixed(1)}</strong></span>
                <span>REC. <strong>{data.modes.highlow.max_score.toFixed(0)}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
