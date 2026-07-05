import { BarChart2, Calendar } from "lucide-react";
import React from "react";

export function PhasesView({
  phaseStatus,
  setPhaseStatus,
  phasesLoading,
  phases,
  handleEditPhase,
  setShowPhaseModal,
  handleDeletePhase,
  openRubricsModal,
  setEditingPhaseId,
  setPhaseForm,
}) {
  return (
    <div className="phases-container" style={{ width: '100%' }}>
      <div className="section-card" style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 className="section-title" style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Evaluation Phases</h2>
            <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>Manage evaluation phases, weightages, and deadlines.</p>
          </div>
        </div>

        {/* Status Message */}
        {phaseStatus && (
          <div style={{
            marginBottom: '1.5rem', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem',
            background: phaseStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
            border: `1px solid ${phaseStatus.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: phaseStatus.type === 'success' ? '#065f46' : '#991b1b',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span>{phaseStatus.message}</span>
            <button onClick={() => setPhaseStatus(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1.1rem' }}>✕</button>
          </div>
        )}

        {/* Total Weight Status */}
        {!phasesLoading && phases.length > 0 && (
          <div style={{
            marginBottom: '1.5rem', padding: '1.25rem 1.5rem', borderRadius: '12px',
            background: 'linear-gradient(135deg, #1e293b, #334155)', color: '#fff',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Total Allocated Weightage</span>
            <span style={{ 
              fontSize: '1.3rem', fontWeight: 700, 
              color: phases.reduce((acc, p) => acc + Number(p.weight), 0) === 100 ? '#34d399' : '#fcd34d' 
            }}>
              {phases.reduce((acc, p) => acc + Number(p.weight), 0)}% / 100%
            </span>
          </div>
        )}

        {/* Phase Cards Grid */}
        {phasesLoading ? (
           <div style={{ textAlign: 'center', padding: '3rem' }}>
             <span className="spinner"></span>
             <p style={{ color: '#64748b', marginTop: '1rem' }}>Loading phases...</p>
           </div>
        ) : phases.length === 0 ? (
           <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
             <div style={{ fontSize: '3rem', marginBottom: '1rem' }}><BarChart2 className="inline-icon" size={18} /></div>
             <h3 style={{ margin: '0 0 0.5rem' }}>No Phases Defined Yet</h3>
             <p style={{ color: '#64748b', margin: 0 }}>Create a new evaluation phase to get started.</p>
           </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {phases.map((phase, idx) => {
              const gradients = [
                'linear-gradient(135deg,#6366f1,#8b5cf6)',
                'linear-gradient(135deg,#3b82f6,#06b6d4)',
                'linear-gradient(135deg,#f59e0b,#f97316)',
                'linear-gradient(135deg,#10b981,#059669)',
              ];
              const grad = gradients[idx % gradients.length];
              
              return (
                <div key={phase.id} style={{
                  background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0',
                  overflow: 'hidden', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s', cursor: 'default'
                }}>
                  <div style={{ background: grad, padding: '1.25rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', fontWeight: 700 }}>{phase.name}</h3>
                      <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.25)', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>Weight: {phase.weight}%</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button 
                        onClick={() => { handleEditPhase(phase); setShowPhaseModal(true); }}
                        style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '6px', color: '#fff', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Edit"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button 
                        onClick={() => handleDeletePhase(phase.id)}
                        style={{ background: 'rgba(239, 68, 68, 0.9)', border: 'none', borderRadius: '6px', color: '#fff', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Delete"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: '1.25rem', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#475569', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '1.2rem' }}><Calendar className="inline-icon" size={18} /></span>
                      <span><strong>Deadline:</strong> {phase.deadline ? new Date(phase.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}</span>
                    </div>
                    <button 
                      onClick={() => openRubricsModal(phase)}
                      style={{ width: '100%', padding: '0.6rem', background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background 0.2s' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      Manage Rubrics
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Phase Button */}
        <div style={{ textAlign: 'center', marginTop: phases.length > 0 ? '1rem' : '2rem' }}>
          <button 
            className="action-btn-new primary"
            onClick={() => { setEditingPhaseId(null); setPhaseForm({ name: "", weight: "", deadline: "" }); setShowPhaseModal(true); }}
            style={{ 
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', 
              padding: '0.8rem 1.75rem', borderRadius: '10px', border: 'none', 
              fontWeight: 600, fontSize: '1.05rem', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add New Phase
          </button>
        </div>
      </div>
    </div>
  );
}
