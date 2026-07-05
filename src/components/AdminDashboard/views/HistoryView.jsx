import React from "react";

export function HistoryView({ uploadHistory, setActiveView }) {
  return (
    <div className="proposals-container">
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">Upload History</h2>
          <p className="section-subtitle">
            Projects uploaded to the similarity database this session
          </p>
        </div>

        {uploadHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <h3>No Projects Uploaded Yet</h3>
            <p>Upload existing FYP projects to build the similarity corpus.</p>
            <button
              className="action-btn-new primary"
              style={{ background: "linear-gradient(135deg, #0f172a, #334155)" }}
              onClick={() => setActiveView("upload")}
            >
              Upload First Project
            </button>
          </div>
        ) : (
          <div className="proposals-list">
            {uploadHistory.map((item) => (
              <div key={item.id} className="proposal-review-card">
                <div className="proposal-header">
                  <div className="proposal-info">
                    <h3>{item.title}</h3>
                    <div className="proposal-meta">
                      <span className="meta-badge domain">{item.projectType}</span>
                      <span
                        className="meta-badge"
                        style={{ background: "#d1fae5", color: "#065f46" }}
                      >
                        ✓ Embedded
                      </span>
                    </div>
                  </div>
                </div>
                <div className="student-info" style={{ borderBottom: "none" }}>
                  <span>{item.fileName}</span>
                  <span>
                    {" "}
                    {new Date(item.uploadedAt).toLocaleString()}
                  </span>
                  <span>ID: {item.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
