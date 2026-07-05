import React from "react";

export function DocumentsView({
  evalPhasesLoading,
  evalPhasesError,
  evalPhases,
  documentStatus,
  setSelectedFile,
  githubUrls,
  setGithubUrls,
  handleDocumentSubmit,
  uploadingPhase,
}) {
  return (
    <div className="dashboard-home">
      <div className="welcome-banner" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem' }}>📄 Document Uploads</h1>
        <p>Upload your documents for each evaluation phase.</p>
      </div>
      
      {evalPhasesLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6366f1' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⏳</div>
          <p style={{ fontWeight: 600 }}>Fetching evaluation phases...</p>
        </div>
      ) : evalPhasesError ? (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
          <p style={{ fontWeight: 600 }}>{evalPhasesError}</p>
        </div>
      ) : evalPhases.length === 0 ? (
        <div style={{ background: '#f8faff', border: '2px dashed #c7d2fe', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
          <h3 style={{ color: '#4338ca', marginBottom: '0.5rem' }}>No Phases Found</h3>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>No evaluation phases have been created yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {evalPhases.map((phase, idx) => {
            const phaseId = phase.id || phase.phaseId || phase._id;
            const isSubmitted = documentStatus[phaseId]?.isSubmitted;
            return (
              <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b', fontSize: '1.1rem' }}>{phase.name || phase.phaseName || phase.title || `Phase ${idx + 1}`}</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>{phase.description || 'Upload your document for this phase.'}</p>
                </div>
                
                {isSubmitted ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', color: '#059669', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                    <span style={{ fontSize: '1.2rem' }}>✅</span>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Already Submitted</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="file" 
                      id={`file-upload-${phaseId}`}
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      style={{ fontSize: '0.85rem' }}
                    />
                    <input 
                      type="text" 
                      placeholder="GitHub URL (Required)" 
                      value={githubUrls[phaseId] || ''}
                      onChange={(e) => setGithubUrls(prev => ({...prev, [phaseId]: e.target.value}))}
                      style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '200px' }}
                    />
                    <button 
                      onClick={() => handleDocumentSubmit(phaseId)}
                      disabled={uploadingPhase === phaseId}
                      style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: uploadingPhase === phaseId ? 'not-allowed' : 'pointer' }}
                    >
                      {uploadingPhase === phaseId ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
