import { ArrowRight } from "lucide-react";
import React from "react";

export function CommitteesView({
  committees,
  handleViewCommittees,
  assignLoading,
  handleAssignCommittees,
  assignStatus,
  setAssignStatus,
  committeesLoading,
  openEditEvalModal,
}) {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #334155)',
        borderRadius: '16px', padding: '1.5rem 2rem',
        marginBottom: '1.5rem', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <h2 style={{ color: '#fff', margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Committees Overview</h2>
          <p style={{ color: '#94a3b8', margin: '0.3rem 0 0', fontSize: '0.85rem' }}>
            {committees.length} committee{committees.length !== 1 ? 's' : ''} · Review before assigning
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="action-btn-new"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', padding: '0.5rem 1rem', fontSize: '0.82rem' }}
            onClick={handleViewCommittees}>
            Refresh
          </button>
          <button className="action-btn-new"
            style={{
              background: assignLoading ? '#64748b' : 'linear-gradient(135deg, #f59e0b, #d97706)',
              padding: '0.5rem 1rem', fontSize: '0.82rem',
              opacity: assignLoading ? 0.7 : 1, cursor: assignLoading ? 'not-allowed' : 'pointer',
            }}
            onClick={handleAssignCommittees} disabled={assignLoading}>
            {assignLoading ? 'Assigning...' : 'Assign & Send Notifications'}
          </button>
        </div>
      </div>

      {/* Assign Status */}
      {assignStatus && (
        <div style={{
          marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem',
          background: assignStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
          border: `1px solid ${assignStatus.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: assignStatus.type === 'success' ? '#065f46' : '#991b1b',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>{assignStatus.message}</span>
          <button onClick={() => setAssignStatus(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'inherit' }}>✕</button>
        </div>
      )}

      {/* Loading */}
      {committeesLoading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}></div>
          <p style={{ margin: 0 }}>Loading committees...</p>
        </div>
      )}

      {/* Empty */}
      {!committeesLoading && committees.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}></div>
          <h3 style={{ color: '#475569', margin: '0 0 0.5rem' }}>No Committees Yet</h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Go to Dashboard <ArrowRight className="inline-icon" size={18} /> Step 1: Create Committees first.</p>
        </div>
      )}

      {/* Committee Cards — one per committee, using actual API data */}
      {!committeesLoading && committees.map((com, idx) => {
        const gradients = [
          'linear-gradient(135deg,#6366f1,#8b5cf6)',
          'linear-gradient(135deg,#3b82f6,#06b6d4)',
          'linear-gradient(135deg,#059669,#10b981)',
        ];
        const grad = gradients[idx % gradients.length];
        return (
          <div key={com.id} style={{
            background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0',
            marginBottom: '1.5rem', overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            {/* Card Header */}
            <div style={{ background: grad, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}></div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>{com.name}</h3>
                    <button onClick={() => openEditEvalModal(com)} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 8px' }}>✏️ Edit</button>
                  </div>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>
                    {com.members?.length || 0} members &nbsp;·&nbsp; {com.groups?.length || 0} groups
                  </p>
                </div>
              </div>
              <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>
                {com.groups?.length > 0 ? 'Assigned' : 'Pending'}
              </span>
            </div>

            {/* Body: 2 columns */}
            <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* LEFT: Members */}
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 0.75rem', borderBottom: '2px solid #e0e7ff', paddingBottom: '0.4rem' }}>
                  Members ({com.members?.length || 0})
                </p>
                {(com.members || []).map((m, mi) => (
                  <div key={`m-${m.id}-${mi}`} style={{
                    display: 'flex', gap: '0.6rem', padding: '0.55rem 0.7rem', borderRadius: '10px', marginBottom: '0.4rem',
                    background: m.designation?.toLowerCase().includes('prof') ? '#f5f3ff' : '#f0f9ff',
                    border: `1px solid ${m.designation?.toLowerCase().includes('prof') ? '#c4b5fd' : '#bae6fd'}`,
                  }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
                      background: m.designation?.toLowerCase().includes('prof') ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'linear-gradient(135deg,#3b82f6,#06b6d4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#fff',
                    }}>
                      {''}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.83rem', fontWeight: 700, color: '#1e293b' }}>{m.user?.name || `Supervisor #${m.id}`}</p>
                      <p style={{ margin: 0, fontSize: '0.69rem', color: '#6366f1', fontWeight: 600, textTransform: 'capitalize' }}>{m.designation}</p>
                      <p style={{ margin: 0, fontSize: '0.67rem', color: '#64748b' }}>{Array.isArray(m.expertise) ? m.expertise.join(' · ') : m.expertise || 'N/A'}</p>
                      {m.user?.email && <p style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8' }}>{m.user.email}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* RIGHT: Groups */}
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 0.75rem', borderBottom: '2px solid #fde68a', paddingBottom: '0.4rem' }}>
                  Assigned Groups ({com.groups?.length || 0})
                </p>
                {(!com.groups || com.groups.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', background: '#fafafa', borderRadius: '10px', border: '1px dashed #e2e8f0' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}></div>
                    <p style={{ margin: 0, fontSize: '0.8rem' }}>No groups assigned yet</p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem' }}>Use "Assign & Notify" to assign</p>
                  </div>
                ) : com.groups.map((g, gi) => (
                  <div key={`g-${g.id}-${gi}`} style={{ padding: '0.75rem', borderRadius: '10px', marginBottom: '0.6rem', background: '#fffbeb', border: '1px solid #fcd34d' }}>
                    {/* Project Title */}
                    <p style={{ margin: '0 0 0.3rem', fontSize: '0.85rem', fontWeight: 700, color: '#92400e', lineHeight: '1.3' }}>
                      {g.proposal?.title || `Project (Proposal #${g.proposalId})`}
                    </p>

                    {/* Domain badge */}
                    {g.proposal?.domain && (
                      <span style={{
                        display: 'inline-block', marginBottom: '0.4rem',
                        fontSize: '0.65rem', fontWeight: 700,
                        background: '#fef3c7', color: '#78350f',
                        padding: '0.1rem 0.5rem', borderRadius: '8px',
                        border: '1px solid #fcd34d',
                      }}>
                        {Array.isArray(g.proposal.domain) ? g.proposal.domain.join(' · ') : g.proposal.domain}
                      </span>
                    )}

                    {/* Student Registration Numbers */}
                    {g.studentRegs && g.studentRegs.length > 0 && (
                      <div style={{ marginBottom: '0.4rem' }}>
                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.65rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Students</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {g.studentRegs.map((reg, ri) => (
                            <span key={ri} style={{
                              fontSize: '0.68rem', fontWeight: 600,
                              background: ri === 0 ? '#d97706' : '#fff7ed',
                              color: ri === 0 ? '#fff' : '#92400e',
                              border: ri === 0 ? 'none' : '1px solid #fcd34d',
                              padding: '0.15rem 0.5rem', borderRadius: '6px',
                            }}>
                              {ri === 0 ? `${reg}` : reg}
                            </span>
                          ))}
                        </div>
                        <p style={{ margin: '0.15rem 0 0', fontSize: '0.6rem', color: '#b45309' }}>Lead Student</p>
                      </div>
                    )}

                    {/* Supervisor Name */}
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.68rem', color: '#6366f1', fontWeight: 600 }}>
                      {g.supervisor?.user?.name || g.supervisor?.name || `Supervisor #${g.supervisorId}`}
                      {g.supervisor?.designation && (
                        <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '0.3rem', textTransform: 'capitalize' }}>
                          ({g.supervisor.designation})
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
