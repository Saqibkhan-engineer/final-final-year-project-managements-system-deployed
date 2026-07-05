import React from "react";

export function StatusView({
  proposalLoading,
  existingProposal,
  getStatusBadge,
  showSupervisors,
  fetchSupervisors,
  supervisorsLoading,
  availableSupervisors,
  selectedSupervisorId,
  handleSelectSupervisor,
  loading,
  setSelectedSupervisorId,
  setActiveView,
}) {
  return (
    <div className="status-container">
      <div className="section-card">
        <h2 className="section-title">Proposal Status</h2>

        {proposalLoading ? (
          <div className="loading-state">
            <span className="spinner"></span>
            <p>Loading proposal status...</p>
          </div>
        ) : existingProposal ? (
          <div className="status-details">
            <div className="status-header">
              <h3>{existingProposal.title}</h3>
              {getStatusBadge(existingProposal.status)}
            </div>

            <div className="status-grid">
              <div className="status-item">
                <span className="status-label">Domain</span>
                <span className="status-value">{existingProposal.domain || 'N/A'}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Similarity Score</span>
                <span className="status-value">{existingProposal.highestSimilarity || 0}%</span>
              </div>
              <div className="status-item">
                <span className="status-label">Submitted On</span>
                <span className="status-value">
                  {existingProposal.createdAt
                    ? new Date(existingProposal.createdAt).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>

            {existingProposal.description && (
              <div className="status-section">
                <h4>Description</h4>
                <p>{existingProposal.description}</p>
              </div>
            )}

            {existingProposal.pecFeedback && (
              <div className={`feedback-box ${existingProposal.status}`}>
                <h4>PEC Feedback</h4>
                <p>{existingProposal.pecFeedback}</p>
              </div>
            )}

            {existingProposal.status === 'approved' && (
              <div className="supervisor-selection">
                <h4>Congratulations! Your proposal has been approved.</h4>
                <p>Please select a supervisor from the available options below:</p>
                
                {!showSupervisors ? (
                  <button 
                    className="action-btn-new primary" 
                    onClick={fetchSupervisors}
                    disabled={supervisorsLoading}
                  >
                    {supervisorsLoading ? "Loading Supervisors..." : "Show Available Supervisors"}
                  </button>
                ) : (
                  <div className="supervisor-grid">
                    {availableSupervisors.length === 0 ? (
                      <p>No supervisors found.</p>
                    ) : (
                      availableSupervisors.map((sup) => (
                        <div key={sup.id} className="supervisor-card">
                          {/* Avatar + Name */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{
                              width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                              background: sup.designation?.toLowerCase().includes('prof')
                                ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                                : 'linear-gradient(135deg,#3b82f6,#06b6d4)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: '1rem', fontWeight: 700,
                            }}>
                              {(sup.user?.name || 'S').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h5 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                                {sup.user?.name || `Supervisor #${sup.id}`}
                              </h5>
                              <span style={{
                                fontSize: '0.68rem', fontWeight: 600, textTransform: 'capitalize',
                                color: sup.designation?.toLowerCase().includes('prof') ? '#6366f1' : '#0ea5e9',
                              }}>
                                {sup.designation || 'Supervisor'}
                              </span>
                            </div>
                          </div>

                          {/* Expertise chips */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                            {(Array.isArray(sup.expertise) ? sup.expertise : [sup.expertise || 'General']).map((ex, ei) => (
                              <span key={ei} style={{
                                fontSize: '0.65rem', fontWeight: 600,
                                background: '#eff6ff', color: '#2563eb',
                                border: '1px solid #bfdbfe',
                                padding: '2px 8px', borderRadius: '10px',
                              }}>🏷️ {ex}</span>
                            ))}
                          </div>

                          {selectedSupervisorId === sup.id ? (
                            <div style={{ marginTop: '10px' }}>
                              <p style={{ fontSize: '0.8rem', color: '#374151', marginBottom: '8px' }}>
                                Are you sure you want to request this supervisor?
                              </p>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button
                                  className="select-btn"
                                  onClick={() => handleSelectSupervisor(sup.id)}
                                  disabled={loading}
                                >
                                  {loading ? '...' : 'Send Request'}
                                </button>
                                <button
                                  className="back-btn"
                                  style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                                  onClick={() => setSelectedSupervisorId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              className="select-btn"
                              onClick={() => setSelectedSupervisorId(sup.id)}
                            >
                              Select
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {existingProposal.status === 'rejected' && (
              <div className="resubmit-notice">
                <p>Your proposal was rejected. You can submit a revised proposal.</p>
                <button
                  className="action-btn-new primary"
                  onClick={() => setActiveView("submit")}
                >
                  Submit New Proposal
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">—</div>
            <h3>No Proposal Submitted</h3>
            <p>You haven't submitted any proposal yet.</p>
            <button
              className="action-btn-new primary"
              onClick={() => setActiveView("submit")}
            >
              Submit Your First Proposal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
