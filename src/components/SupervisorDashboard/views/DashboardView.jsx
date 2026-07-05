import React from "react";

export function DashboardView({ user }) {
  return (
    <div className="dashboard-home">
      <div className="welcome-banner" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)" }}>
        <h1>Welcome back, {user?.name || "Supervisor"}! 👋</h1>
        <p>Manage your students, groups, ideas, and committee tasks.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ borderTop: "4px solid #3b82f6" }}>
          <div className="stat-icon" style={{ background: "#eff6ff", color: "#3b82f6" }}>👥</div>
          <div className="stat-info">
            <h3>Active Groups</h3>
            <p className="stat-value">Manage</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: "4px solid #10b981" }}>
          <div className="stat-icon" style={{ background: "#ecfdf5", color: "#10b981" }}>💡</div>
          <div className="stat-info">
            <h3>Your Ideas</h3>
            <p className="stat-value">View</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: "4px solid #f59e0b" }}>
          <div className="stat-icon" style={{ background: "#fffbeb", color: "#f59e0b" }}>📝</div>
          <div className="stat-info">
            <h3>Pending Requests</h3>
            <p className="stat-value">Check</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: "4px solid #8b5cf6" }}>
          <div className="stat-icon" style={{ background: "#f5f3ff", color: "#8b5cf6" }}>⚖️</div>
          <div className="stat-info">
            <h3>Committee Tasks</h3>
            <p className="stat-value">Evaluate</p>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Quick Actions</h3>
        <div className="activity-list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div className="activity-item" style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <h4>📨 Check Requests</h4>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "5px 0" }}>Review new group formation requests from students.</p>
          </div>
          <div className="activity-item" style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <h4>📊 Monitor Progress</h4>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "5px 0" }}>View GitHub analytics and commit history for your groups.</p>
          </div>
          <div className="activity-item" style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <h4>✅ Evaluate Phases</h4>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "5px 0" }}>Grade group phases as an internal or external committee member.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
