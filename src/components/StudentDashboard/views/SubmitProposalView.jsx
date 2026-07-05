import React from "react";

export function SubmitProposalView({
  canSubmitProposal,
  existingProposal,
  setActiveView,
  currentStep,
  formData,
  setFormData,
  pdfExtracting,
  handleFileChange,
  fileName,
  handleSubmit,
  loading,
  submittedProposal,
  isHighSimilarity,
  highestSimilarity,
  handleEnhance,
  handleBackToForm,
  selectedTeamMembers,
  memberSearchQuery,
  searchStudents,
  onSearchFocus,
  setShowSearchDropdown,
  showSearchDropdown,
  memberSearchLoading,
  memberSearchResults,
  addTeamMember,
  removeTeamMember,
  handleSendToCommittee,
  enhancedData,
  formatGeminiText,
}) {
  return (
    <div className="proposal-container">
      {/* Check if can submit */}
      {!canSubmitProposal() && existingProposal && (
        <div className="blocked-notice">
          <div className="blocked-icon">!</div>
          <h3>Proposal Already Submitted</h3>
          <p>
            You have already submitted a proposal titled "<strong>{existingProposal.title}</strong>".
            {existingProposal.status === 'submitted' && " It is currently under review by the PEC."}
            {existingProposal.status === 'approved' && " It has been approved! Please proceed to select a supervisor."}
          </p>
          <button
            className="action-btn-new primary"
            onClick={() => setActiveView("status")}
          >
            View Status
          </button>
        </div>
      )}

      {/* Proposal Form */}
      {canSubmitProposal() && currentStep === "form" && (
        <div className="proposal-form-card">
          <div className="form-header-new">
            <h2>Submit New Proposal</h2>
            <p>Upload your FYP proposal for similarity analysis</p>
          </div>

          <div className="form-body">
            <div className="form-group">
              <label className="form-label">Proposal Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your proposal title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Description
                {pdfExtracting && (
                  <span style={{ marginLeft: '8px', fontSize: '0.72rem', color: '#6366f1', fontWeight: 500 }}>
                    ⏳ Extracting from PDF...
                  </span>
                )}
                {!pdfExtracting && formData.description && (
                  <span style={{ marginLeft: '8px', fontSize: '0.72rem', color: '#059669', fontWeight: 500 }}>
                    ✅ Auto-filled from PDF
                  </span>
                )}
              </label>
              <textarea
                className="form-input"
                placeholder={pdfExtracting ? '⏳ Reading PDF...' : 'Upload a PDF to auto-fill description'}
                rows={6}
                value={formData.description}
                readOnly
                style={{
                  background: '#f8faff',
                  color: formData.description ? '#1e293b' : '#94a3b8',
                  cursor: 'not-allowed',
                  borderColor: formData.description ? '#6366f1' : '#e2e8f0',
                  resize: 'none',
                }}
              />
              <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '4px 0 0' }}>
                📄 Description is auto-extracted from your PDF file
              </p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Domain</label>
                <select
                  className="form-input"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                >
                  <option value="">Select Domain</option>
                  <option value="Web">Web Development</option>
                  <option value="AI">Artificial Intelligence</option>
                  <option value="Mobile">Mobile Development</option>
                  <option value="Cyber">Cybersecurity</option>
                  <option value="Networks">Networks</option>
                  <option value="DataScience">Data Science</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">PDF Document</label>
                <div className="file-upload-box">
                  <input type="file" accept=".pdf" onChange={handleFileChange} />
                  {fileName ? (
                    <span className="file-name">{fileName}</span>
                  ) : (
                    <span className="file-placeholder">Choose PDF file</span>
                  )}
                </div>
              </div>
            </div>

            <button
              className="submit-btn-new"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing...
                </>
              ) : (
                <>Submit & Check Similarity</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Similarity Results */}
      {currentStep === "results" && submittedProposal && (
        <div className="results-container">
          <div className="results-header">
            <div className="results-title">
              <h2>Similarity Analysis Complete</h2>
              <p>Your proposal: <strong>{submittedProposal.title}</strong></p>
            </div>

            {isHighSimilarity ? (
              <div className="similarity-alert high">
                <span className="alert-icon">!</span>
                <div className="alert-text">
                  <strong>High Similarity Detected</strong>
                  <p>Highest match: {highestSimilarity}%</p>
                </div>
              </div>
            ) : (
              <div className="similarity-alert low">
                <span className="alert-icon">✓</span>
                <div className="alert-text">
                  <strong>Low Similarity</strong>
                  <p>Your proposal appears to be unique</p>
                </div>
              </div>
            )}
          </div>

          <div className="similar-projects">
            <h3>Similar Existing Projects</h3>
            {submittedProposal.similarProjects.length === 0 ? (
              <div className="no-matches">
                <p>No similar projects found in the database.</p>
              </div>
            ) : (
              <div className="projects-list">
                {submittedProposal.similarProjects.slice(0, 5).map((project, index) => {
                  const similarity = project.similarities?.weightedSimilarity || 0;
                  const isTop = index === 0;
                  return (
                    <div
                      key={project.id || index}
                      className={`project-card ${isTop && similarity > 60 ? 'highlight' : ''}`}
                    >
                      <div className="project-rank">#{index + 1}</div>
                      <div className="project-info">
                        <h4>{project.title}</h4>
                        <p className="project-domain">{project.projectType}</p>
                      </div>
                      <div className="project-similarity">
                        <div className={`similarity-score ${similarity > 60 ? 'high' : 'low'}`}>
                          {similarity}%
                        </div>
                        <div className="similarity-breakdown">
                          <span>Title: {project.similarities?.titleSimilarity || 0}%</span>
                          <span>Scope: {project.similarities?.scopeSimilarity || 0}%</span>
                          <span>Modules: {project.similarities?.modulesSimilarity || 0}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="results-actions">
            {isHighSimilarity ? (
              <>
                <div className="blocked-warning">
                  <strong>Similarity Too High ({highestSimilarity}%)</strong>
                  <p>You cannot submit this proposal to the committee. Please use AI Enhancement to make your proposal more unique, or discard and submit a different proposal.</p>
                </div>
                <button
                  className="action-btn-new enhance"
                  onClick={handleEnhance}
                  disabled={loading}
                >
                  {loading ? "Enhancing..." : "Enhance with AI"}
                </button>
                <button className="back-btn danger" onClick={handleBackToForm}>
                  Discard & Start Over
                </button>
              </>
            ) : (
              <>
                <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>👥 Add Team Members (Max 3)</label>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                    {/* Selected members as tags */}
                    {selectedTeamMembers.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                        {selectedTeamMembers.map(m => (
                          <span key={m.id} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            background: '#eff6ff', color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            padding: '3px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600,
                          }}>
                            👤 {m.name} <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>({m.regNo})</span>
                            {!m.isMe && (
                              <button onClick={() => removeTeamMember(m.id)} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#ef4444', fontSize: '0.75rem', padding: 0, lineHeight: 1,
                              }} type="button">✕</button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Search input */}
                    {selectedTeamMembers.length < 3 && (
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="🔍 Search student by name..."
                          value={memberSearchQuery}
                          onChange={(e) => searchStudents(e.target.value)}
                          onFocus={onSearchFocus}
                          onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                          style={{ fontSize: '0.8rem', padding: '8px 12px', width: '100%' }}
                          autoComplete="off"
                        />
                        {/* Search results dropdown */}
                        {showSearchDropdown && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                            background: '#fff', border: '1px solid #e2e8f0',
                            borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                            maxHeight: '200px', overflowY: 'auto', marginTop: '4px',
                          }}>
                            {memberSearchLoading ? (
                              <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8' }}>
                                🔄 Searching...
                              </div>
                            ) : memberSearchResults.length === 0 ? (
                              <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8' }}>
                                No students found
                              </div>
                            ) : memberSearchResults.map(s => (
                              <div
                                key={s.id}
                                onMouseDown={() => addTeamMember(s)}
                                style={{
                                  padding: '9px 14px', cursor: 'pointer', fontSize: '0.82rem',
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  borderBottom: '1px solid #f1f5f9',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                                  👤 {s.user?.name || `Student #${s.id}`}
                                </span>
                                <span style={{
                                  fontSize: '0.68rem', color: '#64748b',
                                  background: '#f1f5f9', padding: '2px 7px', borderRadius: '6px', fontWeight: 600,
                                }}>{s.regNo}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedTeamMembers.length === 3 && (
                      <p style={{ fontSize: '0.7rem', color: '#d97706', marginTop: '6px' }}>✅ Maximum 3 members selected</p>
                    )}
                  </div>
                </div>

                <button
                  className="action-btn-new primary"
                  onClick={handleSendToCommittee}
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Send to Evaluation Committee"}
                </button>
                <p className="action-hint">
                  Your proposal has acceptable similarity. You can proceed to submit for evaluation.
                </p>
                <button className="back-btn" onClick={handleBackToForm}>
                  ← Discard & Submit Another
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Enhancement Result */}
      {currentStep === "enhancement" && enhancedData && (
        <div className="enhancement-container">
          <div className="enhancement-header">
            <div className="success-badge">AI Enhancement Complete</div>
            <h2>Your Enhanced Proposal</h2>
            <p>Review the AI-improved version of your proposal below</p>
          </div>

          <div className="enhancement-content">
            <div className="enhancement-section">
              <div className="section-label">Enhanced Title</div>
              <h3 className="enhanced-title">{enhancedData.title}</h3>
            </div>

            <div className="enhancement-section">
              <div className="section-label">Enhanced Scope</div>
              <div
                className="enhanced-scope"
                dangerouslySetInnerHTML={{ __html: formatGeminiText(enhancedData.scope) }}
              />
            </div>

            {enhancedData.modules && enhancedData.modules.length > 0 && (
              <div className="enhancement-section">
                <div className="section-label">Suggested Modules</div>
                <div className="modules-list">
                  {enhancedData.modules.map((module, index) => {
                    const moduleName = typeof module === "string" ? module : module.name || `Module ${index + 1}`;
                    const cleanName = moduleName.replace(/\*\*/g, '').replace(/\*/g, '');
                    return (
                      <div key={index} className="module-tag">
                        <span className="module-number">{index + 1}</span>
                        <span className="module-name">{cleanName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="enhancement-actions">
            <div className="info-notice">
              <span className="info-icon">i</span>
              <p>This enhancement is for your reference only. Please use these suggestions to revise and resubmit your proposal.</p>
            </div>
            <button className="back-btn" onClick={handleBackToForm}>
              ← Submit a Revised Proposal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
