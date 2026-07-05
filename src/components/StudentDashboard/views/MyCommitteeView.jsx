import { RefreshCw, Building2 } from "lucide-react";
import React from "react";

export function MyCommitteeView({ fetchMyCommittee, committeeLoading, committeeError, myCommittee }) {
  return (
    <div className="dashboard-home">
      {/* Header */}
      <div className="welcome-banner" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem' }}><Building2 className="inline-icon" size={18} /> My Evaluation Committee</h1>
        <p>The committee assigned to evaluate your final year project</p>
      </div>

      <button
        onClick={fetchMyCommittee}
        disabled={committeeLoading}
        style={{
          marginBottom: '1.5rem', padding: '8px 20px',
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: '#fff', border: 'none', borderRadius: '10px',
          fontWeight: 600, fontSize: '0.85rem', cursor: committeeLoading ? 'not-allowed' : 'pointer',
          opacity: committeeLoading ? 0.7 : 1,
        }}
      >
        {committeeLoading ? '⏳ Loading...' : '<RefreshCw className="inline-icon" size={18} /> Refresh'}
      </button>

      {/* Loading */}
      {committeeLoading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6366f1' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⏳</div>
          <p style={{ fontWeight: 600 }}>Fetching your committee...</p>
        </div>
      )}

      {/* Error */}
      {committeeError && !committeeLoading && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#dc2626',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>?</div>
          <p style={{ fontWeight: 600 }}>{committeeError}</p>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            Committee may not be assigned yet. Please check back later.
          </p>
        </div>
      )}

      {/* Not assigned */}
      {!committeeLoading && !committeeError && !myCommittee && (
        <div style={{
          background: '#f8faff', border: '2px dashed #c7d2fe',
          borderRadius: '16px', padding: '3rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>??</div>
          <h3 style={{ color: '#4338ca', marginBottom: '0.5rem' }}>No Committee Assigned Yet</h3>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Your evaluation committee will be assigned after proposal approval.
          </p>
        </div>
      )}

      {/* Committee Data */}
      {!committeeLoading && myCommittee && (() => {
        const com = myCommittee.committee || myCommittee;
        const members = com.members || [];
        return (
          <div>
            <div style={{
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              borderRadius: '16px', padding: '1.25rem 1.5rem',
              marginBottom: '1.5rem', color: '#fff',
              display: 'flex', alignItems: 'center', gap: '1rem',
            }}>
              <div style={{
                width: '50px', height: '50px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem',
              }}>???</div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  {com.name || 'Evaluation Committee'}
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', opacity: 0.82 }}>
                  {members.length} member{members.length !== 1 ? 's' : ''}  Assigned for your FYP evaluation
                </p>
              </div>
            </div>

            <div className="section-card">
              <h3 className="section-title">????? Committee Members</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                gap: '1rem',
              }}>
                {members.map((m, i) => {
                  const isProf = m.designation?.toLowerCase().includes('prof');
                  return (
                    <div key={i} style={{
                      background: isProf ? '#f5f3ff' : '#f0f9ff',
                      border: `1px solid ${isProf ? '#c4b5fd' : '#bae6fd'}`,
                      borderRadius: '12px', padding: '1rem',
                      display: 'flex', gap: '0.85rem', alignItems: 'flex-start',
                    }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                        background: isProf
                          ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                          : 'linear-gradient(135deg,#3b82f6,#06b6d4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '1.1rem', fontWeight: 700,
                      }}>
                        {(m.user?.name || 'M').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>
                          {m.user?.name || `Member #${m.id}`}
                        </p>
                        <p style={{
                          margin: '3px 0', fontSize: '0.72rem', fontWeight: 600,
                          textTransform: 'capitalize',
                          color: isProf ? '#6366f1' : '#0ea5e9',
                        }}>
                          {m.designation || 'Faculty Member'}
                        </p>
                        {m.user?.email && (
                          <p style={{ margin: '3px 0 0', fontSize: '0.68rem', color: '#94a3b8' }}>
                            ?? {m.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
