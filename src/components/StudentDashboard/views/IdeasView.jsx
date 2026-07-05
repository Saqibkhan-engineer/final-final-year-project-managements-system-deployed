import { AlertTriangle, Lightbulb, Inbox } from "lucide-react";
import React from "react";

export function IdeasView({ ideasLoading, ideasError, availableIdeas }) {
  return (
    <div className="ideas-container">
      <div className="welcome-banner" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}><Lightbulb className="inline-icon" size={18} /> Supervisor Ideas</h1>
        <p>Explore project ideas posted by faculty members that are available for you to work on.</p>
      </div>

      {ideasLoading ? (
        <div className="center-state">
          <div className="loading-spinner-lg" />
          <p>Loading available ideas...</p>
        </div>
      ) : ideasError ? (
        <div className="center-state">
          <div className="state-icon"><AlertTriangle className="inline-icon" size={18} /></div>
          <h3 style={{ color: '#dc2626' }}>{ideasError}</h3>
        </div>
      ) : availableIdeas.length === 0 ? (
        <div className="center-state" style={{ padding: '3rem', background: '#fff', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}><Inbox className="inline-icon" size={18} /></div>
          <h3 style={{ color: '#64748b' }}>No Ideas Available</h3>
          <p style={{ color: '#94a3b8' }}>Check back later for new project ideas from supervisors.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {availableIdeas.map((idea) => {
            const supervisorName = idea.supervisorName || 'Faculty Member';
            return (
            <div key={idea.id} style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#0f172a', lineHeight: '1.4' }}>{idea.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                    {(supervisorName).charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', textTransform: 'capitalize' }}>{supervisorName}</span>
                </div>
              </div>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', flexGrow: 1, whiteSpace: 'pre-wrap' }}>
                {idea.description}
              </p>
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Posted on {new Date(idea.createdAt || Date.now()).toLocaleDateString()}</span>
                <span style={{ background: '#ecfdf5', color: '#10b981', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>AVAILABLE</span>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
