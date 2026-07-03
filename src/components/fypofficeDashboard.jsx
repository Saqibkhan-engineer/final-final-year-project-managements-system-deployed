import { useState, useEffect } from "react";
import React from "react";
import { Sidebar } from "./Sidebar";

export function OfficeDashboard({ user, onLogout, originalRole, onSwitchRole }) {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackInputs, setFeedbackInputs] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  // Preview modal state
  const [previewProposal, setPreviewProposal] = useState(null);

  // Committee management state
  const [committees, setCommittees] = useState([]);
  const [loadingCommittees, setLoadingCommittees] = useState(false);
  const [showCreateCommittee, setShowCreateCommittee] = useState(false);
  const [newCommitteeName, setNewCommitteeName] = useState("");
  const [newCommitteeDomain, setNewCommitteeDomain] = useState("");
  const [availableSupervisors, setAvailableSupervisors] = useState([]);
  const [selectedSupervisors, setSelectedSupervisors] = useState([]);
  const [creatingCommittee, setCreatingCommittee] = useState(false);

  useEffect(() => {
    fetchSubmittedProposals();
  }, []);

  const fetchSubmittedProposals = async () => {
    try {
      setLoading(true);
      const supervisorId = user?.supervisorId || user?.id || 1; // Fallback to 1 if missing for testing
      const res = await fetch(`/api/pec/submitted/${supervisorId}`);
      if (res.ok) {
        const data = await res.json();
        setProposals(data);
      }
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  const pendingProposals = proposals.filter(p => p.status === "submitted");
  const approvedCount = proposals.filter(p => p.status === "approved").length;
  const rejectedCount = proposals.filter(p => p.status === "rejected").length;

  const handleApprove = async (id) => {
    const feedback = feedbackInputs[id] || "Proposal approved. Proceed to supervisor selection.";
    setActionLoading({ ...actionLoading, [id]: 'approve' });
    try {
      const res = await fetch(`/api/pec/approve/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      if (!res.ok) throw new Error('Failed to approve');
      alert("Proposal Approved! Student can now select supervisor.");
      setFeedbackInputs({ ...feedbackInputs, [id]: "" });
      fetchSubmittedProposals();
    } catch (err) {
      console.error(err);
      alert("Failed to approve proposal");
    } finally {
      setActionLoading({ ...actionLoading, [id]: null });
    }
  };

  const handleReject = async (id) => {
    const feedback = feedbackInputs[id];
    if (!feedback) {
      alert("Please provide feedback before rejecting!");
      return;
    }
    setActionLoading({ ...actionLoading, [id]: 'reject' });
    try {
      const res = await fetch(`/api/pec/reject/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      alert("Proposal rejected.");
      setFeedbackInputs({ ...feedbackInputs, [id]: "" });
      fetchSubmittedProposals();
    } catch (err) {
      console.error(err);
      alert("Failed to reject proposal");
    } finally {
      setActionLoading({ ...actionLoading, [id]: null });
    }
  };

  // Committees Functions
  useEffect(() => {
    if (activeView === 'committees') {
      fetchCommittees();
    }
  }, [activeView]);

  const fetchCommittees = async () => {
    try {
      setLoadingCommittees(true);
      const res = await fetch('/api/pec/all');
      if (res.ok) {
        const data = await res.json();
        setCommittees(data);
      }
    } catch (err) {
      console.error('Failed to fetch committees:', err);
    } finally {
      setLoadingCommittees(false);
    }
  };

  useEffect(() => {
    if (newCommitteeDomain) {
      fetchSupervisorsByDomain(newCommitteeDomain);
    } else {
      setAvailableSupervisors([]);
      setSelectedSupervisors([]);
    }
  }, [newCommitteeDomain]);

  const fetchSupervisorsByDomain = async (domain) => {
    try {
      const res = await fetch(`/api/supervisor/all?domain=${domain}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSupervisors(data);
      }
    } catch (err) {
      console.error('Failed to fetch supervisors:', err);
    }
  };

  const handleCreateCommittee = async (e) => {
    e.preventDefault();
    if (!newCommitteeName || !newCommitteeDomain || selectedSupervisors.length === 0) {
      alert("Please fill all fields and select at least one supervisor.");
      return;
    }
    try {
      setCreatingCommittee(true);
      const res = await fetch('/api/pec/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCommitteeName,
          domain: newCommitteeDomain,
          supervisorIds: selectedSupervisors,
        }),
      });
      if (res.ok) {
        alert("Committee created successfully!");
        setShowCreateCommittee(false);
        setNewCommitteeName("");
        setNewCommitteeDomain("");
        setSelectedSupervisors([]);
        fetchCommittees();
      } else {
        alert("Failed to create committee.");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating committee.");
    } finally {
      setCreatingCommittee(false);
    }
  };

  const toggleSupervisorSelection = (id) => {
    setSelectedSupervisors(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "proposals", label: "Review Proposals" },
    { id: "committees", label: "Manage Committees" },
  ];

  return (
    <div className="app-layout">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        role="office"
        navItems={navItems}
      />

      <main className="main-content" style={{ position: 'relative' }}>
        {originalRole === 'supervisor' && (
          <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}>
            <button 
              className="role-switch-btn"
              onClick={() => onSwitchRole('supervisor')}
            >
              <span className="role-switch-icon">🔄</span>
              <span>Switch Back to Supervisor</span>
            </button>
          </div>
        )}

        {/* ─── Dashboard Home ─── */}
        {activeView === "dashboard" && (
          <div className="dashboard-home">
            <div className="welcome-banner">
              <h1>Welcome back, {user?.name || 'PEC Admin'}</h1>
              <p>Review and manage student proposals submitted for evaluation.</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">P</div>
                <div className="stat-info">
                  <p className="stat-label">Pending Review</p>
                  <p className="stat-value">{pendingProposals.length}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✓</div>
                <div className="stat-info">
                  <p className="stat-label">Approved</p>
                  <p className="stat-value">{approvedCount}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✗</div>
                <div className="stat-info">
                  <p className="stat-label">Rejected</p>
                  <p className="stat-value">{rejectedCount}</p>
                </div>
              </div>
            </div>

            <div className="section-card">
              <h3 className="section-title">Quick Actions</h3>
              <div className="action-buttons">
                <button
                  className="action-btn-new primary"
                  onClick={() => setActiveView("proposals")}
                >
                  <span>Review Pending Proposals ({pendingProposals.length})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Proposals Review ─── */}
        {activeView === "proposals" && (
          <div className="proposals-container">
            <div className="section-card">
              <div className="section-header">
                <h2 className="section-title">Review Proposals</h2>
                <p className="section-subtitle">Proposals awaiting your approval</p>
              </div>

              {loading ? (
                <div className="loading-state">
                  <span className="spinner"></span>
                  <p>Loading proposals...</p>
                </div>
              ) : pendingProposals.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">—</div>
                  <h3>All Caught Up!</h3>
                  <p>No proposals pending review.</p>
                </div>
              ) : (
                <div className="proposals-list">
                  {pendingProposals.map((p) => (
                    <div key={p.id} className="proposal-review-card">

                      {/* Header row */}
                      <div className="proposal-header">
                        <div className="proposal-info">
                          <h3>{p.title}</h3>
                          <div className="proposal-meta">
                            <span className="meta-badge domain">{p.domain || 'N/A'}</span>
                            <span className={`meta-badge similarity ${p.highestSimilarity > 60 ? 'high' : 'low'}`}>
                              Similarity: {p.highestSimilarity || 0}%
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                          {/* Preview Description Button */}
                          {p.description && (
                            <button
                              onClick={() => setPreviewProposal(p)}
                              style={{
                                padding: '6px 14px',
                                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                color: '#fff', border: 'none', borderRadius: '8px',
                                fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '5px',
                              }}
                            >
                              👁️ Preview
                            </button>
                          )}

                          {p.fileUrl && (
                            <a
                              href={p.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="download-btn-new"
                            >
                              Download PDF
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Student Info */}
                      <div className="student-info">
                        <span>Student: {p.student?.user?.name || 'Unknown Student'}</span>
                        <span>Email: {p.student?.user?.email || 'N/A'}</span>
                        <span>Reg#: {p.student?.regNo || 'N/A'}</span>
                      </div>

                      {/* Feedback + Actions */}
                      <div className="feedback-section">
                        <label>Your Feedback</label>
                        <textarea
                          placeholder="Write your feedback here..."
                          className="form-input"
                          rows="3"
                          value={feedbackInputs[p.id] || ""}
                          onChange={(e) => setFeedbackInputs({ ...feedbackInputs, [p.id]: e.target.value })}
                        />
                        <div className="action-buttons-row">
                          <button
                            onClick={() => handleApprove(p.id)}
                            className="action-btn-new success"
                            disabled={actionLoading[p.id]}
                          >
                            {actionLoading[p.id] === 'approve' ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(p.id)}
                            className="action-btn-new danger"
                            disabled={actionLoading[p.id]}
                          >
                            {actionLoading[p.id] === 'reject' ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Manage Committees ─── */}
        {activeView === "committees" && (
          <div className="committees-container">
            <div className="section-card">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 className="section-title" style={{ margin: 0 }}>PEC Committees</h2>
                  <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0' }}>Manage domain-specific evaluation committees.</p>
                </div>
                <button
                  className="action-btn-new primary"
                  onClick={() => setShowCreateCommittee(true)}
                >
                  + Create New Committee
                </button>
              </div>

              {loadingCommittees ? (
                <div className="loading-state">
                  <span className="spinner"></span>
                  <p>Loading committees...</p>
                </div>
              ) : committees.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <h3>No Committees Found</h3>
                  <p>Create a new committee to get started.</p>
                </div>
              ) : (
                <div className="committees-list" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                  {committees.map((c) => (
                    <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', background: '#f8fafc' }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{c.name}</h3>
                      <span style={{ display: 'inline-block', padding: '4px 10px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '1rem' }}>
                        Domain: {c.domain}
                      </span>
                      <div>
                        <strong style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>Members:</strong>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#334155' }}>
                          {c.supervisors && c.supervisors.length > 0 ? (
                            c.supervisors.map(s => <li key={s.id}>{s.user?.name || s.name || `Supervisor ID: ${s.id}`}</li>)
                          ) : (
                            <li>No members assigned</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Committee Modal */}
            {showCreateCommittee && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', borderRadius: '16px 16px 0 0' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>Create New Committee</h3>
                    <button onClick={() => setShowCreateCommittee(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '8px', width: '30px', height: '30px', fontSize: '1rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                  
                  <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                    <form onSubmit={handleCreateCommittee}>
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Committee Name</label>
                        <input type="text" value={newCommitteeName} onChange={e => setNewCommitteeName(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} placeholder="e.g. Web Dev Review Committee" required />
                      </div>

                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Domain</label>
                        <select value={newCommitteeDomain} onChange={e => setNewCommitteeDomain(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} required>
                          <option value="">Select Domain...</option>
                          <option value="Web">Web</option>
                          <option value="AI">AI</option>
                          <option value="Mobile">Mobile</option>
                          <option value="Cyber">Cyber Security</option>
                          <option value="Networks">Networks</option>
                          <option value="DataScience">Data Science</option>
                        </select>
                      </div>

                      {newCommitteeDomain && (
                        <div style={{ marginBottom: '1.25rem' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Select Members (Supervisors)</label>
                          <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem' }}>
                            {availableSupervisors.length === 0 ? (
                              <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '1rem 0', margin: 0 }}>No supervisors found for this domain.</p>
                            ) : (
                              availableSupervisors.map(sup => (
                                <label key={sup.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                                  <input type="checkbox" checked={selectedSupervisors.includes(sup.id)} onChange={() => toggleSupervisorSelection(sup.id)} style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }} />
                                  <span style={{ fontSize: '0.9rem', color: '#334155' }}>{sup.user?.name || sup.name}</span>
                                </label>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" onClick={() => setShowCreateCommittee(false)} style={{ padding: '0.6rem 1.2rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={creatingCommittee || selectedSupervisors.length === 0} style={{ padding: '0.6rem 1.2rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: (creatingCommittee || selectedSupervisors.length === 0) ? 0.6 : 1 }}>
                          {creatingCommittee ? 'Creating...' : 'Create Committee'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ─── Description Preview Modal ─── */}
      {previewProposal && (
        <div
          onClick={() => setPreviewProposal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '16px',
              width: '100%', maxWidth: '680px',
              maxHeight: '85vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              borderRadius: '16px 16px 0 0',
            }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
                  📄 {previewProposal.title}
                </h3>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700,
                    background: 'rgba(255,255,255,0.2)', color: '#fff',
                    padding: '2px 8px', borderRadius: '8px',
                  }}>🏷️ {previewProposal.domain || 'N/A'}</span>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700,
                    background: previewProposal.highestSimilarity > 60 ? '#fef2f2' : '#f0fdf4',
                    color: previewProposal.highestSimilarity > 60 ? '#dc2626' : '#16a34a',
                    padding: '2px 8px', borderRadius: '8px',
                  }}>Similarity: {previewProposal.highestSimilarity || 0}%</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewProposal(null)}
                style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none',
                  color: '#fff', borderRadius: '8px', width: '30px', height: '30px',
                  fontSize: '1rem', cursor: 'pointer', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            </div>

            {/* Student Info Strip */}
            <div style={{
              padding: '0.75rem 1.5rem',
              background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
              display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: '#64748b',
            }}>
              <span>👤 {previewProposal.student?.user?.name || 'Unknown'}</span>
              <span>✉️ {previewProposal.student?.user?.email || 'N/A'}</span>
              <span>🎓 {previewProposal.student?.regNo || 'N/A'}</span>
            </div>

            {/* Description Body */}
            <div style={{
              padding: '1.5rem',
              overflowY: 'auto',
              flex: 1,
            }}>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
                Project Description
              </h4>
              <div style={{
                fontSize: '0.88rem', lineHeight: '1.75', color: '#1e293b',
                whiteSpace: 'pre-wrap',         /* preserves \n line breaks */
                fontFamily: 'Georgia, serif',
                background: '#fafafa',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '1rem 1.25rem',
              }}>
                {previewProposal.description}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'flex-end', gap: '8px',
            }}>
              {previewProposal.fileUrl && (
                <a
                  href={previewProposal.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="download-btn-new"
                  style={{ fontSize: '0.82rem' }}
                >
                  📥 Download PDF
                </a>
              )}
              <button
                onClick={() => setPreviewProposal(null)}
                style={{
                  padding: '8px 20px',
                  background: '#f1f5f9', border: 'none',
                  borderRadius: '8px', fontWeight: 600,
                  fontSize: '0.82rem', cursor: 'pointer', color: '#475569',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
