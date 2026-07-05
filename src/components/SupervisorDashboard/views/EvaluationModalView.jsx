import { AlertTriangle, Scale, FileText, Link, GitBranch, Check, ArrowRight } from "lucide-react";
import React from "react";

export function EvaluationModalView({
  evalModalOpen,
  setEvalModalOpen,
  evalFormLoading,
  evalFormError,
  evalFormData,
  evalSelectedPhase,
  setEvalSelectedPhase,
  evaluatingRole,
  phaseLockStatus,
  phaseDocument,
  phaseExistingMarks,
  rubricScores,
  setRubricScores,
  phaseFeedback,
  setPhaseFeedback,
  submittingMarks,
  handleSubmitPhaseMarks,
  allPhasesStatus,
  handleSelectPhase,
  browserSupportsSpeechRecognition,
  listening,
  isMicActive,
  setIsMicActive,
  SpeechRecognition,
  resetTranscript,
}) {
  if (!evalModalOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "2rem",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "700px",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0, color: "#1e293b", fontSize: "1.25rem" }}><Scale className="inline-icon" size={18} /> Evaluate Group</h2>
          <button
            onClick={() => setEvalModalOpen(false)}
            style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#64748b" }}
          >
            &times;
          </button>
        </div>

        {evalFormLoading ? (
          <div className="center-state">
            <div className="loading-spinner-lg" />
            <p>Loading evaluation form…</p>
          </div>
        ) : evalFormError ? (
          <div className="center-state">
            <div className="state-icon"><AlertTriangle className="inline-icon" size={18} /></div>
            <p>{evalFormError}</p>
          </div>
        ) : (() => {
          const phasesData = Array.isArray(evalFormData) ? evalFormData : evalFormData?.phases || evalFormData?.data || [];
          if (phasesData.length === 0) {
            return (
              <div className="center-state">
                <p>No evaluation phases found for this group.</p>
              </div>
            );
          }

          if (evalSelectedPhase) {
            let rubrics = Array.isArray(evalSelectedPhase.rubrics) ? evalSelectedPhase.rubrics : [];
            if (evaluatingRole === "supervisor") {
              rubrics = rubrics.filter((r) => r.evaluatorRole && r.evaluatorRole.toLowerCase() === "supervisor");
            } else if (evaluatingRole === "committee") {
              rubrics = rubrics.filter((r) => r.evaluatorRole && r.evaluatorRole.toLowerCase() === "committee");
            }

            const isLockedForRole =
              evaluatingRole === "supervisor" ? phaseLockStatus?.isSupervisorLocked : phaseLockStatus?.isCommitteeLocked;

            return (
              <div className="phase-details-view">
                <button
                  onClick={() => setEvalSelectedPhase(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#3b82f6",
                    fontWeight: 600,
                    cursor: "pointer",
                    marginBottom: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    padding: 0,
                  }}
                >
                  ← Back to Phases
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                  <h3 style={{ margin: 0, color: "#1e293b" }}>
                    {evalSelectedPhase.name || evalSelectedPhase.phaseName || evalSelectedPhase.title || "Selected Phase"}
                  </h3>
                  {isLockedForRole && (
                    <span
                      style={{
                        background: "#d1fae5",
                        color: "#059669",
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                      }}
                    >
                      <Check className="inline-icon" size={18} /> Completed & Locked
                    </span>
                  )}
                </div>

                {/* Document & AI Detection Block */}
                {phaseDocument && (phaseDocument.hasSubmitted || phaseDocument.documentUrl || phaseDocument.fileName) ? (
                  <div
                    style={{
                      marginBottom: "1.5rem",
                      padding: "1rem",
                      background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                      <div>
                        <h4
                          style={{
                            margin: "0 0 0.5rem",
                            color: "#334155",
                            fontSize: "0.95rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <FileText className="inline-icon" size={18} /> Document Uploaded
                        </h4>
                        <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>
                          {phaseDocument.fileName || "Submitted Document"}
                        </p>
                        {phaseDocument.documentUrl && (
                          <a
                            href={phaseDocument.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-block",
                              marginTop: "0.5rem",
                              fontSize: "0.8rem",
                              color: "#2563eb",
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
                          >
                            <Link className="inline-icon" size={18} /> View / Download Document
                          </a>
                        )}
                        {phaseDocument.githubUrl && (
                          <a
                            href={phaseDocument.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-block",
                              marginTop: "0.5rem",
                              marginLeft: phaseDocument.documentUrl ? "1rem" : "0",
                              fontSize: "0.8rem",
                              color: "#1e293b",
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
                          >
                            <GitBranch className="inline-icon" size={18} /> View GitHub Repo
                          </a>
                        )}
                      </div>

                      {/* AI Detection Stats */}
                      {(phaseDocument.aiDetectionScore !== undefined ||
                        phaseDocument.plagiarismScore !== undefined ||
                        phaseDocument.aiReportSummary) && (
                        <div
                          style={{
                            background: "#fff",
                            padding: "0.75rem",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            gap: "1rem",
                            alignItems: "center",
                          }}
                        >
                          {phaseDocument.aiDetectionScore !== undefined && (
                            <div style={{ textAlign: "center" }}>
                              <div
                                style={{
                                  fontSize: "1.2rem",
                                  fontWeight: 800,
                                  color:
                                    phaseDocument.aiDetectionScore > 50
                                      ? "#dc2626"
                                      : phaseDocument.aiDetectionScore > 20
                                      ? "#d97706"
                                      : "#16a34a",
                                }}
                              >
                                {phaseDocument.aiDetectionScore}%
                              </div>
                              <div style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                                AI Written
                              </div>
                            </div>
                          )}
                          {phaseDocument.plagiarismScore !== undefined && (
                            <div
                              style={{
                                textAlign: "center",
                                borderLeft: phaseDocument.aiDetectionScore !== undefined ? "1px solid #e2e8f0" : "none",
                                paddingLeft: phaseDocument.aiDetectionScore !== undefined ? "1rem" : "0",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "1.2rem",
                                  fontWeight: 800,
                                  color: phaseDocument.plagiarismScore > 30 ? "#dc2626" : "#16a34a",
                                }}
                              >
                                {phaseDocument.plagiarismScore}%
                              </div>
                              <div style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                                Plagiarism
                              </div>
                            </div>
                          )}
                          {phaseDocument.aiReportSummary && (
                            <div
                              style={{
                                borderLeft:
                                  phaseDocument.aiDetectionScore !== undefined || phaseDocument.plagiarismScore !== undefined
                                    ? "1px solid #e2e8f0"
                                    : "none",
                                paddingLeft:
                                  phaseDocument.aiDetectionScore !== undefined || phaseDocument.plagiarismScore !== undefined
                                    ? "1rem"
                                    : "0",
                                maxWidth: "250px",
                                fontSize: "0.75rem",
                                color: "#475569",
                              }}
                            >
                              {phaseDocument.aiReportSummary}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      marginBottom: "1.5rem",
                      padding: "1rem",
                      background: "#fef2f2",
                      borderRadius: "10px",
                      border: "1px dashed #fca5a5",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span style={{ fontSize: "1.2rem" }}><AlertTriangle className="inline-icon" size={18} /></span>
                    <span style={{ color: "#991b1b", fontSize: "0.85rem", fontWeight: 600 }}>
                      No document has been uploaded for this phase yet.
                    </span>
                  </div>
                )}

                {rubrics.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {rubrics.map((rubric, rIdx) => {
                      const maxMarks = Number(rubric.maxMarks || rubric.marks || rubric.totalMarks || 100);
                      return (
                        <div key={rubric.id || rIdx} style={{ padding: "1rem", background: "#f1f5f9", borderRadius: "6px", borderLeft: "4px solid #3b82f6" }}>
                          <h4 style={{ margin: "0 0 0.5rem 0", color: "#0f172a" }}>
                            {rubric.name || rubric.rubricName || rubric.title || `Rubric ${rIdx + 1}`}
                          </h4>
                          {rubric.description && <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "#475569" }}>{rubric.description}</p>}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                            <span style={{ fontWeight: 600, color: "#334155" }}>Max Marks: {maxMarks}</span>
                            {isLockedForRole ? (
                              <span style={{ color: "#059669", fontWeight: 700, padding: "4px 10px", background: "#d1fae5", borderRadius: "6px" }}>
                                <Check className="inline-icon" size={18} /> Evaluated {phaseExistingMarks[rubric.id] !== undefined ? `(Score: ${phaseExistingMarks[rubric.id]})` : ""}
                              </span>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <label style={{ fontWeight: 600, color: "#1e293b" }}>Score:</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={maxMarks}
                                  value={rubricScores[rIdx] !== undefined ? rubricScores[rIdx] : ""}
                                  onChange={(e) => {
                                    let val = e.target.value;
                                    if (val !== "" && Number(val) > maxMarks) val = maxMarks;
                                    if (val !== "" && Number(val) < 0) val = 0;
                                    setRubricScores((prev) => ({ ...prev, [rIdx]: val }));
                                  }}
                                  style={{
                                    width: "70px",
                                    padding: "0.4rem",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    textAlign: "center",
                                    fontWeight: 600,
                                  }}
                                  placeholder="0"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="center-state" style={{ padding: "2rem" }}>
                    <p style={{ color: "#94a3b8", margin: 0 }}>No rubrics assigned to {evaluatingRole} for this phase.</p>
                  </div>
                )}

                {/* Global Phase Feedback Input */}
                {rubrics.length > 0 && !isLockedForRole && (
                  <div style={{ marginTop: "1.5rem", background: "#fff", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <label style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1e293b" }}>Phase Feedback (Optional)</label>
                      {browserSupportsSpeechRecognition && (
                        <button
                          type="button"
                          onClick={() => {
                            if (listening && isMicActive) {
                              SpeechRecognition.stopListening();
                              setIsMicActive(false);
                            } else {
                              resetTranscript();
                              setIsMicActive(true);
                              SpeechRecognition.startListening({ continuous: true });
                            }
                          }}
                          style={{
                            background: listening && isMicActive ? "#fee2e2" : "#f1f5f9",
                            border: listening && isMicActive ? "1px solid #fca5a5" : "1px solid #cbd5e1",
                            cursor: "pointer",
                            color: listening && isMicActive ? "#dc2626" : "#475569",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            padding: "0.4rem 0.75rem",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            transition: "all 0.2s",
                          }}
                        >
                          {listening && isMicActive ? (
                            <>
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
                              </svg>
                              Recording...
                            </>
                          ) : (
                            <>
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                              </svg>
                              Voice Input
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <textarea
                      placeholder="Type feedback for this phase or use the voice option..."
                      value={phaseFeedback || ""}
                      onChange={(e) => {
                        if (listening && isMicActive) {
                          SpeechRecognition.stopListening();
                          setIsMicActive(false);
                        }
                        setPhaseFeedback(e.target.value);
                      }}
                      rows={3}
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.95rem", resize: "vertical" }}
                      disabled={isLockedForRole}
                    />
                  </div>
                )}

                {/* Submit Button */}
                {rubrics.length > 0 && !isLockedForRole && (
                  <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
                    <button
                      onClick={handleSubmitPhaseMarks}
                      disabled={submittingMarks}
                      style={{
                        background: submittingMarks ? "#94a3b8" : "linear-gradient(135deg, #22c55e, #16a34a)",
                        color: "#fff",
                        border: "none",
                        padding: "0.75rem 1.5rem",
                        borderRadius: "8px",
                        cursor: submittingMarks ? "not-allowed" : "pointer",
                        fontWeight: 600,
                        fontSize: "1rem",
                        boxShadow: "0 4px 6px -1px rgba(34, 197, 94, 0.2)",
                      }}
                    >
                      {submittingMarks ? "Submitting..." : <><Check className="inline-icon" size={18} /> Submit Phase Marks</>}
                    </button>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {phasesData.map((phase, idx) => {
                const phaseKey = phase.id || idx;
                const phaseIdForStatus = phase.id || phase.phaseId || phase._id;
                const statusObj = allPhasesStatus[phaseIdForStatus];
                const evaluated = evaluatingRole === "supervisor" ? statusObj?.isSupervisorLocked : statusObj?.isCommitteeLocked;

                return (
                  <div
                    key={phaseKey}
                    onClick={() => handleSelectPhase(phase)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ background: evaluated ? "#f0fdf4" : "#f8fafc", padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span>{phase.name || phase.phaseName || phase.title || `Phase ${idx + 1}`}</span>
                        {phase.weight ? (
                          <span style={{ fontSize: "0.75rem", background: "#3b82f6", color: "#fff", padding: "3px 10px", borderRadius: "12px" }}>
                            {phase.weight}% Weight
                          </span>
                        ) : null}
                        {evaluated && (
                          <span style={{ fontSize: "0.7rem", background: "#10b981", color: "#fff", padding: "3px 8px", borderRadius: "12px" }}>
                            <Check className="inline-icon" size={18} /> Completed
                          </span>
                        )}
                      </div>
                      <span style={{ color: "#94a3b8", fontSize: "1.2rem" }}><ArrowRight className="inline-icon" size={18} /></span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
