import React from "react";

export function DashboardView({
  user,
  setActiveView,
  committeeLoading,
  committeesCreated,
  handleCreateCommittees,
  handleViewCommittees,
  assignLoading,
  handleAssignCommittees,
  committeeStatus,
  setCommitteeStatus,
  assignStatus,
  setAssignStatus,
  domainCounts,
}) {
  return (
    <div className="dashboard-home">
      {/* Welcome Banner */}
      <div
        className="welcome-banner"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
        }}
      >
        <div className="welcome-content">
          <h1>Admin Panel</h1>
          <p>
            Upload existing FYP projects to build the similarity database.
            <br />
            These projects are used to detect plagiarism in new proposals.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section-card">
        <h3 className="section-title">Quick Actions</h3>
        <div className="action-buttons">
          <button
            className="action-btn-new primary"
            style={{ background: "linear-gradient(135deg, #0f172a, #334155)" }}
            onClick={() => setActiveView("upload")}
          >
            <span>Upload Existing Project</span>
          </button>
          <button
            className="action-btn-new"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
            onClick={() => setActiveView("history")}
          >
            <span>View Upload History</span>
          </button>
        </div>

        {/* ══ Committee Workflow (Sequential) ══ */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginTop: '1rem' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>
            Committee Management
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Step 1: Always visible */}
            <button
              className="action-btn-new"
              style={{
                background: committeeLoading ? '#64748b' : 'linear-gradient(135deg, #059669, #047857)',
                opacity: committeeLoading ? 0.7 : 1,
                cursor: committeeLoading ? 'not-allowed' : 'pointer',
              }}
              onClick={handleCreateCommittees}
              disabled={committeeLoading}
            >
              <span>{committeeLoading ? 'Creating...' : committeesCreated ? 'Re-create Committees' : 'Create Committees'}</span>
            </button>

            {/* Steps 2 & 3: Only after committees are created */}
            {committeesCreated && (
              <>
                <span style={{ color: '#94a3b8', fontSize: '1.2rem' }}>→</span>
                <button
                  className="action-btn-new"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                  onClick={handleViewCommittees}
                >
                  <span>View Committees</span>
                </button>

                <span style={{ color: '#94a3b8', fontSize: '1.2rem' }}>→</span>
                <button
                  className="action-btn-new"
                  style={{
                    background: assignLoading ? '#64748b' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                    opacity: assignLoading ? 0.7 : 1,
                    cursor: assignLoading ? 'not-allowed' : 'pointer',
                  }}
                  onClick={handleAssignCommittees}
                  disabled={assignLoading}
                >
                  <span>{assignLoading ? 'Assigning...' : 'Assign & Notify'}</span>
                </button>
              </>
            )}
          </div>

          {/* Status messages */}
          {committeeStatus && (
            <div style={{
              marginTop: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.5rem',
              fontSize: '0.82rem', background: committeeStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
              border: `1px solid ${committeeStatus.type === 'success' ? '#10b981' : '#ef4444'}`,
              color: committeeStatus.type === 'success' ? '#065f46' : '#991b1b',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>{committeeStatus.message}</span>
              <button onClick={() => setCommitteeStatus(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'inherit' }}>✕</button>
            </div>
          )}
          {assignStatus && (
            <div style={{
              marginTop: '0.5rem', padding: '0.75rem 1rem', borderRadius: '0.5rem',
              fontSize: '0.82rem', background: assignStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
              border: `1px solid ${assignStatus.type === 'success' ? '#10b981' : '#ef4444'}`,
              color: assignStatus.type === 'success' ? '#065f46' : '#991b1b',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>{assignStatus.message}</span>
              <button onClick={() => setAssignStatus(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'inherit' }}>✕</button>
            </div>
          )}
        </div>
      </div>

      {/* Domain Breakdown */}
      {Object.keys(domainCounts).length > 0 && (
        <div className="section-card">
          <h3 className="section-title">Projects by Domain</h3>
          <div className="profile-grid">
            {Object.entries(domainCounts).map(([domain, count]) => (
              <div className="profile-item" key={domain}>
                <span className="profile-label">{domain}</span>
                <span className="profile-value">{count} projects</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile */}
      <div className="section-card">
        <h3 className="section-title">Your Profile</h3>
        <div className="profile-grid">
          <div className="profile-item">
            <span className="profile-label">Name</span>
            <span className="profile-value">{user?.name || "Admin"}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Email</span>
            <span className="profile-value">{user?.email || "admin@fyp.edu"}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Role</span>
            <span className="profile-value">FYP Office Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
