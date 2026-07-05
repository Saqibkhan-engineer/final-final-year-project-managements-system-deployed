import React, { useState } from "react";

function RequestCard({ req, handleAcceptRequest, handleRejectRequest, onPreview }) {
  const members = req.teamMembers || [];
  const lead = members[0] || req.student?.user || req.student || req.studentId;
  const otherMembers = members.slice(1);

  return (
    <div style={{
      background: "#fff",
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      padding: "1.25rem 1.5rem",
      marginBottom: "1rem",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1.5rem",
      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
      transition: "box-shadow 0.2s"
    }}
    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)"; }}
    >
      {/* Left: Project Info */}
      <div style={{ flex: "2", minWidth: "250px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <h3 style={{ margin: 0, color: "#1e293b", fontSize: "1.1rem", fontWeight: 600 }}>
            {req.proposal?.title || "Untitled Proposal"}
          </h3>
          {req.proposal?.domain && (
            <span style={{
              background: "#eff6ff",
              color: "#3b82f6",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: 600,
              border: "1px solid #bfdbfe",
              whiteSpace: "nowrap"
            }}>
              {req.proposal.domain}
            </span>
          )}
        </div>
        
        {req.proposal?.description && (
          <button 
            onClick={() => onPreview(req.proposal)}
            style={{
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              color: "#475569",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: 500,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#f8fafc"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            Preview Description
          </button>
        )}
      </div>

      {/* Middle: Students Info */}
      <div style={{ flex: "2", display: "flex", gap: "1.5rem", borderLeft: "1px solid #f1f5f9", borderRight: "1px solid #f1f5f9", padding: "0 1.5rem", minWidth: "300px" }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Lead Student
          </p>
          {lead && typeof lead === 'object' && (lead.name || lead.regNo) ? (
            <div>
              <p style={{ margin: "0 0 2px 0", fontWeight: 500, color: "#334155", fontSize: "0.9rem" }}>{lead.name || "Unknown"}</p>
              {lead.regNo && <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>{lead.regNo}</p>}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic" }}>N/A</p>
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Group Members
          </p>
          {otherMembers.length > 0 ? (
            <div style={{ color: "#475569", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "4px" }}>
              {otherMembers.map((member, idx) => (
                <div key={idx}>
                  <span style={{ fontWeight: 500, color: "#334155" }}>{member.name || `Student ${idx + 1}`}</span> 
                  {member.regNo && <span style={{ color: "#64748b", marginLeft: "4px" }}>({member.regNo})</span>}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic" }}>None</p>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div style={{ flex: "1", display: "flex", flexDirection: "column", gap: "0.75rem", minWidth: "180px", alignItems: "flex-end" }}>
        <span style={{
          background: "#fffbeb",
          color: "#d97706",
          padding: "4px 12px",
          borderRadius: "12px",
          fontSize: "0.75rem",
          fontWeight: 600,
          border: "1px solid #fde68a"
        }}>
          Pending
        </span>
        
        <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
          <button
            onClick={() => {
              if (window.confirm(`Accept group request for "${req.proposal?.title}"?`)) {
                handleAcceptRequest(req.id || req._id);
              }
            }}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontWeight: 500,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#2563eb"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#3b82f6"}
          >
            Accept
          </button>
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to reject this request?")) {
                handleRejectRequest(req.id || req._id);
              }
            }}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: "#fff",
              color: "#ef4444",
              border: "1px solid #fca5a5",
              borderRadius: "6px",
              fontWeight: 500,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.borderColor = "#f87171"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#fca5a5"; }}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export function RequestsView({
  requestsLoading,
  requestsError,
  requests,
  fetchRequests,
  handleAcceptRequest,
  handleRejectRequest,
}) {
  const [previewProposal, setPreviewProposal] = useState(null);

  return (
    <div className="section-card" style={{ padding: "2rem", background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0", position: "relative" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 className="section-title" style={{ fontSize: "1.5rem", margin: "0 0 0.5rem 0", color: "#1e293b", fontWeight: 700 }}>
          Supervision Requests
        </h2>
        <p style={{ color: "#64748b", margin: 0, fontSize: "0.95rem" }}>
          Review and respond to requests from student groups who want you as their supervisor.
        </p>
      </div>

      {requestsLoading ? (
        <div className="center-state" style={{ padding: "4rem 0" }}>
          <div className="loading-spinner-lg" />
          <p style={{ fontWeight: 500, color: "#64748b", marginTop: "1rem" }}>Loading requests...</p>
        </div>
      ) : requestsError ? (
        <div className="center-state" style={{ background: "#fef2f2", padding: "3rem", borderRadius: "12px", border: "1px dashed #fca5a5" }}>
          <h3 style={{ color: "#991b1b", margin: "0 0 0.5rem 0" }}>Fetch Failed</h3>
          <p style={{ color: "#b91c1c" }}>{requestsError}</p>
          <button className="retry-btn" onClick={fetchRequests} style={{ marginTop: "1rem" }}>Try Again</button>
        </div>
      ) : requests.length === 0 ? (
        <div className="center-state" style={{ background: "#f0fdf4", padding: "4rem", borderRadius: "12px", border: "1px dashed #bbf7d0" }}>
          <h3 style={{ color: "#166534", fontSize: "1.25rem", fontWeight: 600, margin: "0 0 0.5rem 0" }}>All Caught Up!</h3>
          <p style={{ color: "#15803d", margin: 0, fontSize: "0.95rem" }}>You have no pending requests at the moment.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {requests.map((req) => (
            <RequestCard
              key={req.id || req._id}
              req={req}
              handleAcceptRequest={handleAcceptRequest}
              handleRejectRequest={handleRejectRequest}
              onPreview={setPreviewProposal}
            />
          ))}
        </div>
      )}

      {/* Description Preview Modal */}
      {previewProposal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#fff",
            width: "100%",
            maxWidth: "600px",
            borderRadius: "12px",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            maxHeight: "85vh"
          }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "0 0 0.25rem 0", color: "#1e293b", fontSize: "1.25rem", fontWeight: 600 }}>
                  Project Description
                </h3>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>{previewProposal.title}</p>
              </div>
              <button 
                onClick={() => setPreviewProposal(null)}
                style={{ background: "transparent", border: "none", fontSize: "1.5rem", color: "#94a3b8", cursor: "pointer", lineHeight: 1 }}
              >
                &times;
              </button>
            </div>
            
            <div style={{ padding: "1.5rem", overflowY: "auto", color: "#334155", fontSize: "0.95rem", lineHeight: 1.6 }}>
              {previewProposal.description ? (
                <div style={{ whiteSpace: "pre-wrap" }}>{previewProposal.description}</div>
              ) : (
                <p style={{ fontStyle: "italic", color: "#94a3b8" }}>No description provided for this proposal.</p>
              )}
            </div>
            
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e2e8f0", background: "#f8fafc", textAlign: "right" }}>
              <button 
                onClick={() => setPreviewProposal(null)}
                style={{ background: "#e2e8f0", color: "#475569", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: 500, cursor: "pointer" }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
