import React from "react";

export function MarksView({
  evalPhasesLoading,
  marksLoading,
  evalPhasesError,
  evalPhases,
  studentMarks,
  collapsedMarksPhases,
  setCollapsedMarksPhases,
}) {
  return (
    <div className="dashboard-home">
      <div className="welcome-banner" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
        <h1 style={{ fontSize: '1.4rem' }}>📊 Evaluation Marks</h1>
        <p>View your obtained marks for all evaluation phases.</p>
      </div>
      
      {evalPhasesLoading || marksLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#059669' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⏳</div>
          <p style={{ fontWeight: 600 }}>Fetching your marks...</p>
        </div>
      ) : evalPhasesError ? (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
          <p style={{ fontWeight: 600 }}>{evalPhasesError}</p>
        </div>
      ) : evalPhases.length === 0 ? (
        <div style={{ background: '#f0fdf4', border: '2px dashed #a7f3d0', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
          <h3 style={{ color: '#047857', marginBottom: '0.5rem' }}>No Phases Found</h3>
          <p style={{ color: '#064e3b', fontSize: '0.88rem' }}>Evaluation phases have not been set up yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {evalPhases.filter(phase => {
            const phaseId = phase.id || phase.phaseId || phase._id;
            const marksInfo = studentMarks[phaseId];
            return marksInfo && marksInfo.data && marksInfo.data.length > 0;
          }).map((phase, idx) => {
            const phaseId = phase.id || phase.phaseId || phase._id;
            const marksInfo = studentMarks[phaseId];
            const isCollapsed = collapsedMarksPhases[idx] || false;
            
            return (
              <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                {/* Header */}
                <div 
                  onClick={() => setCollapsedMarksPhases(prev => ({...prev, [idx]: !prev[idx]}))}
                  style={{ padding: '1.5rem', background: '#f8fafc', borderBottom: isCollapsed ? 'none' : '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem', color: '#1e293b', fontSize: '1.15rem' }}>
                      {phase.name || phase.phaseName || phase.title || `Phase ${idx + 1}`}
                    </h3>
                    <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {marksInfo?.phaseWeight || phase.weight || 0}% Total Weight
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Evaluator Marks</p>
                        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#334155' }}>
                          {marksInfo.totalRawObtained} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>/ {marksInfo.totalRawMax}</span>
                        </p>
                      </div>
                      <svg width="36" height="36" viewBox="0 0 36 36" style={{marginLeft: '0.75rem', transform: 'rotate(-90deg)'}}>
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray={`${marksInfo.totalRawMax ? (marksInfo.totalRawObtained / marksInfo.totalRawMax) * 100 : 0}, 100`} />
                      </svg>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '1.5rem', borderLeft: '2px solid #e2e8f0' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Weighted Solid Marks</p>
                        <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>
                          {Number(marksInfo.solidMarksObtained).toFixed(2)}
                        </p>
                      </div>
                      <svg width="36" height="36" viewBox="0 0 36 36" style={{marginLeft: '0.75rem', transform: 'rotate(-90deg)'}}>
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray={`${marksInfo.phaseWeight ? (marksInfo.solidMarksObtained / marksInfo.phaseWeight) * 100 : 0}, 100`} />
                      </svg>
                    </div>
                    
                    {/* Collapse Arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '1rem' }}>
                      <svg 
                        viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                        style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s ease' }}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Body */}
                {!isCollapsed && (
                  <div style={{ padding: '1.5rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evaluator Breakdown</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {marksInfo.data.map((markItem, mIdx) => (
                        <div key={mIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f1f5f9', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                          <div>
                            <p style={{ margin: '0 0 0.25rem', fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', textTransform: 'capitalize' }}>
                              {markItem.evaluator?.user?.name || 'Evaluator'}
                            </p>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>
                              Rubric Max Marks: {markItem.rubric?.maxMarks || 0}
                            </p>
                            {markItem.feedback && (
                              <div style={{ marginTop: '0.75rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.75rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                  Feedback
                                </span>
                                <p style={{ margin: 0, color: '#334155', fontSize: '0.85rem', fontStyle: 'italic', lineHeight: '1.4' }}>
                                  "{markItem.feedback}"
                                </p>
                              </div>
                            )}
                          </div>
                          <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '6px', textAlign: 'center', minWidth: '80px' }}>
                            <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>OBTAINED</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563eb' }}>{markItem.marks}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                )}
              </div>
            );
          })}
          {evalPhases.filter(phase => {
            const phaseId = phase.id || phase.phaseId || phase._id;
            const marksInfo = studentMarks[phaseId];
            return marksInfo && marksInfo.data && marksInfo.data.length > 0;
          }).length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⏳</div>
              <p style={{ fontWeight: 600 }}>No marks have been uploaded or evaluated yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
