import { Tag, Check } from "lucide-react";
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
              <div className="supervisor-selection" style={{ marginTop: '2rem' }}>
                {(existingProposal.supervisorName && existingProposal.supervisorName !== 'Not Assigned') || existingProposal.supervisorStatus === 'accepted' ? (
                  <div style={{
                    background: 'linear-gradient(145deg, #f0fdf4, #dcfce7)',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{
                      background: '#22c55e',
                      color: 'white',
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      flexShrink: 0
                    }}>
                      <Check className="inline-icon" size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: '#166534', fontSize: '1.1rem' }}>
                        Supervisor is allocated to you
                      </h4>
                      <p style={{ margin: 0, color: '#15803d', fontWeight: 500 }}>
                        {existingProposal.supervisorName || "Your Supervisor"}
                      </p>
                    </div>
                  </div>
                ) : existingProposal.supervisorStatus === 'pending' ? (
                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#d97706' }}>Request Pending</h4>
                    <p style={{ margin: 0, color: '#b45309' }}>Your request has been sent and is currently pending supervisor approval.</p>
                  </div>
                ) : (
                  <>
                    <h4 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>Congratulations! Your proposal has been approved.</h4>
                    <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Please select a supervisor from the available options below:</p>
                    
                    {!showSupervisors ? (
                      <button 
                        className="action-btn-new primary" 
                        onClick={fetchSupervisors}
                        disabled={supervisorsLoading}
                        style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 500 }}
                      >
                        {supervisorsLoading ? "Loading Supervisors..." : "Show Available Supervisors"}
                      </button>
                    ) : (
                      <div className="supervisor-grid" style={{ marginTop: '1rem' }}>
                        {availableSupervisors.length === 0 ? (
                          <p style={{ color: '#64748b' }}>No supervisors found.</p>
                        ) : (
                          availableSupervisors.map((sup) => (
                            <div key={sup.id} className="supervisor-card" style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff' }}>
                              {/* Avatar + Name */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                  width: '45px', height: '45px', borderRadius: '12px', flexShrink: 0,
                                  background: sup.designation?.toLowerCase().includes('prof')
                                    ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                                    : 'linear-gradient(135deg,#3b82f6,#06b6d4)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#fff', fontSize: '1.2rem', fontWeight: 700,
                                }}>
                                  {(sup.user?.name || 'S').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>
                                    {sup.user?.name || `Supervisor #${sup.id}`}
                                  </h5>
                                  <span style={{
                                    fontSize: '0.75rem', fontWeight: 500, textTransform: 'capitalize',
                                    color: sup.designation?.toLowerCase().includes('prof') ? '#6366f1' : '#0ea5e9',
                                  }}>
                                    {sup.designation || 'Supervisor'}
                                  </span>
                                </div>
                              </div>

                              {/* Expertise chips */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                {(Array.isArray(sup.expertise) ? sup.expertise : [sup.expertise || 'General']).map((ex, ei) => (
                                  <span key={ei} style={{
                                    fontSize: '0.7rem', fontWeight: 500,
                                    background: '#f1f5f9', color: '#475569',
                                    padding: '4px 10px', borderRadius: '12px',
                                  }}><Tag className="inline-icon" size={18} /> {ex}</span>
                                ))}
                              </div>

                              {selectedSupervisorId === sup.id ? (
                                <div style={{ marginTop: 'auto', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                                  <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 8px 0', textAlign: 'center' }}>
                                    Request this supervisor?
                                  </p>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      className="select-btn"
                                      onClick={() => handleSelectSupervisor(sup.id)}
                                      disabled={loading}
                                      style={{ flex: 1, padding: '8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 500 }}
                                    >
                                      {loading ? '...' : 'Confirm'}
                                    </button>
                                    <button
                                      className="back-btn"
                                      onClick={() => setSelectedSupervisorId(null)}
                                      style={{ flex: 1, padding: '8px', background: '#fff', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 500 }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  className="select-btn"
                                  onClick={() => setSelectedSupervisorId(sup.id)}
                                  style={{ width: '100%', marginTop: 'auto', padding: '8px', background: '#fff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
                                  onMouseEnter={(e) => { e.target.style.background = '#eff6ff'; }}
                                  onMouseLeave={(e) => { e.target.style.background = '#fff'; }}
                                >
                                  Select Supervisor
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
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
