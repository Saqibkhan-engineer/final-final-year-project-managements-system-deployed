import React from "react";

export function IdeasView({
  ideasLoading,
  ideasError,
  ideas,
  fetchIdeas,
  showIdeaForm,
  setShowIdeaForm,
  newIdea,
  setNewIdea,
  handlePostIdea,
}) {
  return (
    <div className="section-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 className="section-title" style={{ margin: 0 }}>💡 My Offered Ideas</h2>
        <button
          className="btn-primary"
          onClick={() => setShowIdeaForm(!showIdeaForm)}
          style={{ padding: "0.6rem 1.25rem", borderRadius: "8px", fontWeight: 600 }}
        >
          {showIdeaForm ? "Cancel" : "+ Post New Idea"}
        </button>
      </div>

      {showIdeaForm && (
        <form onSubmit={handlePostIdea} className="idea-form" style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "2rem" }}>
          <h3 style={{ marginTop: 0, color: "#1e293b", fontSize: "1.1rem" }}>Post a New Project Idea</h3>
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "#475569" }}>Title</label>
            <input
              type="text"
              required
              value={newIdea.title}
              onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              placeholder="e.g., AI-based Traffic Management System"
            />
          </div>
          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "#475569" }}>Description</label>
            <textarea
              required
              rows="4"
              value={newIdea.description}
              onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "vertical" }}
              placeholder="Describe the project goals, requirements, and technologies..."
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: "0.75rem 1.5rem", borderRadius: "8px", width: "100%" }}>
            Publish Idea
          </button>
        </form>
      )}

      {ideasLoading ? (
        <div className="center-state">
          <div className="loading-spinner-lg" />
          <p>Loading your ideas...</p>
        </div>
      ) : ideasError ? (
        <div className="center-state">
          <div className="state-icon">⚠️</div>
          <h3>Error</h3>
          <p>{ideasError}</p>
          <button className="retry-btn" onClick={fetchIdeas}>Retry</button>
        </div>
      ) : ideas.length === 0 ? (
        <div className="center-state">
          <div className="state-icon">💡</div>
          <h3>No Ideas Posted</h3>
          <p>You haven't posted any project ideas yet. Post one to attract student groups.</p>
        </div>
      ) : (
        <div className="ideas-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {ideas.map((idea) => (
            <div key={idea._id} className="idea-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#1e293b", lineHeight: 1.4 }}>{idea.title}</h3>
                <span style={{ fontSize: "0.7rem", background: "#f1f5f9", padding: "4px 8px", borderRadius: "100px", color: "#64748b", fontWeight: 600 }}>
                  {new Date(idea.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                {idea.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
