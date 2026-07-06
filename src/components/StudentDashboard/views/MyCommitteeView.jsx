import { RefreshCw, Building2, AlertCircle, Inbox, Users, Mail, User } from "lucide-react";
import React from "react";

export function MyCommitteeView({ fetchMyCommittee, committeeLoading, committeeError, myCommittee }) {
  return (
    <div className="dashboard-home">
      {/* Header */}
      <div className="welcome-banner" style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', color: '#1e293b' }}>
        <h1 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
          <Building2 size={22} className="text-indigo-600" style={{ color: '#4f46e5' }} /> 
          My Evaluation Committee
        </h1>
        <p style={{ margin: 0, color: '#64748b' }}>The committee assigned to evaluate your final year project.</p>
      </div>

      <button
        onClick={fetchMyCommittee}
        disabled={committeeLoading}
        style={{
          marginBottom: '1.5rem', padding: '8px 16px',
          background: '#fff', border: '1px solid #e2e8f0',
          color: '#475569', borderRadius: '8px',
          fontWeight: 500, fontSize: '0.85rem', cursor: committeeLoading ? 'not-allowed' : 'pointer',
          opacity: committeeLoading ? 0.7 : 1,
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => !committeeLoading && (e.currentTarget.style.background = '#f8fafc')}
        onMouseLeave={(e) => !committeeLoading && (e.currentTarget.style.background = '#fff')}
      >
        {committeeLoading ? (
          <>⏳ Loading...</>
        ) : (
          <><RefreshCw size={16} /> Refresh</>
        )}
      </button>

      {/* Loading */}
      {committeeLoading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <RefreshCw size={32} className="animate-spin" />
          </div>
          <p style={{ fontWeight: 500 }}>Fetching your committee...</p>
        </div>
      )}

      {/* Error */}
      {committeeError && !committeeLoading && (
        <div style={{
          background: '#fff', border: '1px solid #fecaca',
          borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#ef4444',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
            <AlertCircle size={32} />
          </div>
          <p style={{ fontWeight: 500, margin: '0 0 0.5rem 0' }}>{committeeError}</p>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Committee may not be assigned yet. Please check back later.
          </p>
        </div>
      )}

      {/* Not assigned */}
      {!committeeLoading && !committeeError && !myCommittee && (
        <div style={{
          background: '#fff', border: '1px dashed #cbd5e1',
          borderRadius: '12px', padding: '3rem', textAlign: 'center',
        }}>
          <div style={{ marginBottom: '1rem', color: '#94a3b8', display: 'flex', justifyContent: 'center' }}>
            <Inbox size={48} strokeWidth={1.5} />
          </div>
          <h3 style={{ color: '#334155', marginBottom: '0.5rem', fontWeight: 600 }}>No Committee Assigned Yet</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Your evaluation committee will be assigned after your proposal is approved.
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
              background: '#fff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              borderRadius: '12px', padding: '1.5rem',
              marginBottom: '1.5rem', color: '#1e293b',
              display: 'flex', alignItems: 'center', gap: '1rem',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '10px',
                background: '#f1f5f9', color: '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <Users size={24} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  {com.name || 'Evaluation Committee'}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  {members.length} member{members.length !== 1 ? 's' : ''} assigned for your FYP evaluation
                </p>
              </div>
            </div>

            <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 600, color: '#0f172a', margin: '0 0 1.25rem 0' }}>
                <User size={18} className="text-indigo-500" style={{ color: '#6366f1' }} /> 
                Committee Members
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem',
              }}>
                {members.map((m, i) => {
                  const isProf = m.designation?.toLowerCase().includes('prof');
                  return (
                    <div key={i} style={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderLeft: `4px solid ${isProf ? '#8b5cf6' : '#3b82f6'}`,
                      borderRadius: '8px', padding: '1.25rem',
                      display: 'flex', gap: '1rem', alignItems: 'flex-start',
                      transition: 'border-color 0.2s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                    >
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#475569', fontSize: '1rem', fontWeight: 600,
                      }}>
                        {(m.user?.name || 'M').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>
                          {m.user?.name || `Member #${m.id}`}
                        </p>
                        <p style={{
                          margin: '4px 0 0', fontSize: '0.8rem', fontWeight: 500,
                          textTransform: 'capitalize',
                          color: isProf ? '#7c3aed' : '#2563eb',
                        }}>
                          {m.designation || 'Faculty Member'}
                        </p>
                        {m.user?.email && (
                          <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={14} /> {m.user.email}
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
