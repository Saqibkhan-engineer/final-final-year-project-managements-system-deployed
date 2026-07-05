import React from "react";

export function DashboardView({
  student,
  existingProposal,
  getStatusBadge,
  canSubmitProposal,
  setActiveView,
  fetchMyCommittee,
}) {
  return (
    <div className="dashboard-home">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <h1>Welcome back, {student.name}</h1>
        <p>Track your FYP progress and manage your proposals.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">P</div>
          <div className="stat-info">
            <p className="stat-label">Proposal Status</p>
            <p className="stat-value">
              {existingProposal ? getStatusBadge(existingProposal.status) : 'Not Submitted'}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">%</div>
          <div className="stat-info">
            <p className="stat-label">Similarity Score</p>
            <p className="stat-value">
              {existingProposal?.highestSimilarity
                ? `${existingProposal.highestSimilarity}%`
                : 'N/A'}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={
            (existingProposal?.supervisorName && existingProposal.supervisorName !== 'Not Assigned') || existingProposal?.supervisorStatus === 'accepted' 
              ? { background: '#22c55e', color: 'white' } 
              : {}
          }>
            {(existingProposal?.supervisorName && existingProposal.supervisorName !== 'Not Assigned') || existingProposal?.supervisorStatus === 'accepted' ? '✓' : 'S'}
          </div>
          <div className="stat-info">
            <p className="stat-label">Supervisor</p>
            <p className="stat-value" style={
              (existingProposal?.supervisorName && existingProposal.supervisorName !== 'Not Assigned') || existingProposal?.supervisorStatus === 'accepted'
                ? { color: '#15803d', fontSize: '1.05rem' }
                : {}
            }>
              {(existingProposal?.supervisorName && existingProposal.supervisorName !== 'Not Assigned')
                ? existingProposal.supervisorName
                : existingProposal?.supervisorStatus === 'accepted'
                  ? 'Allocated'
                  : existingProposal?.supervisorStatus === 'pending'
                    ? 'Request Pending'
                    : existingProposal?.status === 'approved'
                      ? 'Select Now'
                      : 'Pending'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section-card">
        <h3 className="section-title">Quick Actions</h3>
        <div className="action-buttons">
          <button
            className="action-btn-new primary"
            onClick={() => setActiveView("submit")}
            disabled={!canSubmitProposal()}
          >
            <span>Submit Proposal</span>
          </button>
          <button
            className="action-btn-new"
            onClick={() => setActiveView("status")}
          >
            <span>Check Status</span>
          </button>
          <button
            className="action-btn-new"
            onClick={() => setActiveView("templates")}
          >
            <span>Download Templates</span>
          </button>
          <button
            className="action-btn-new"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            onClick={() => { setActiveView('committee'); fetchMyCommittee(); }}
          >
            <span>🏛️ View My Committee</span>
          </button>
        </div>
      </div>

      {/* Student Info */}
      <div className="section-card">
        <h3 className="section-title">Your Profile</h3>
        <div className="profile-grid">
          <div className="profile-item">
            <span className="profile-label">Name</span>
            <span className="profile-value">{student.name}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Email</span>
            <span className="profile-value">{student.email}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Program</span>
            <span className="profile-value">{student.program}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Semester</span>
            <span className="profile-value">{student.semester}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
