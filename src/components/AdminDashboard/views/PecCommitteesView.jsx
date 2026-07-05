import React from "react";

export function PecCommitteesView({
  closeCommitteeModal,
  setShowCreateCommittee,
  loadingPecCommittees,
  pecCommittees,
  openEditCommitteeModal,
  showCreateCommittee,
  editingCommitteeId,
  handleManualCreateCommittee,
  newCommitteeName,
  setNewCommitteeName,
  newCommitteeDomain,
  setNewCommitteeDomain,
  availableSupervisors,
  selectedSupervisors,
  toggleSupervisorSelection,
  creatingCommittee,
}) {
  return (
    <div className="committees-container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem' }}>
      <div className="section-card" style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 className="section-title" style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>PEC Committees</h2>
            <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>Generate and manage domain-specific evaluation committees manually.</p>
          </div>
          <button
            className="action-btn-new primary"
            onClick={() => {
              closeCommitteeModal();
              setShowCreateCommittee(true);
            }}
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            + Create New Committee
          </button>
        </div>

        {loadingPecCommittees ? (
          <div className="loading-state" style={{ textAlign: 'center', padding: '3rem' }}>
            <span className="spinner"></span>
            <p>Loading committees...</p>
          </div>
        ) : pecCommittees.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '12px' }}>
            <div className="empty-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <h3 style={{ margin: '0 0 0.5rem' }}>No PEC Committees Found</h3>
            <p style={{ color: '#64748b' }}>Create a new committee to get started.</p>
          </div>
        ) : (
          <div className="committees-list" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {pecCommittees.map((c) => (
              <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', background: '#f8fafc', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{c.name}</h3>
                  <button 
                    onClick={() => openEditCommitteeModal(c)}
                    style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', color: '#475569', fontWeight: 600 }}
                  >
                    Edit
                  </button>
                </div>
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
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>{editingCommitteeId ? 'Edit Committee' : 'Create New Committee'}</h3>
              <button onClick={closeCommitteeModal} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '8px', width: '30px', height: '30px', fontSize: '1rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            
            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
              <form onSubmit={handleManualCreateCommittee}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Committee Name</label>
                  <input type="text" value={newCommitteeName} onChange={e => setNewCommitteeName(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} placeholder="e.g. Web Dev Review Committee" required />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Domain</label>
                  <select value={newCommitteeDomain} onChange={e => setNewCommitteeDomain(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} required>
                    <option value="">Select Domain...</option>
                    <option value="General">General</option>
                    <option value="Web">Web</option>
                    <option value="AI">AI</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Cyber">Cyber Security</option>
                    <option value="Networks">Networks</option>
                    <option value="DataScience">Data Science</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Select Members (Supervisors)</label>
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem' }}>
                    {availableSupervisors.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '1rem 0', margin: 0 }}>No supervisors found. Please select a domain or create supervisors first.</p>
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

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" onClick={closeCommitteeModal} style={{ padding: '0.6rem 1.2rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={creatingCommittee || selectedSupervisors.length === 0} style={{ padding: '0.6rem 1.2rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: (creatingCommittee || selectedSupervisors.length === 0) ? 0.6 : 1 }}>
                    {creatingCommittee ? (editingCommitteeId ? 'Updating...' : 'Creating...') : (editingCommitteeId ? 'Update Committee' : 'Create Committee')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
