import React from "react";

export function UploadView({
  uploadStatus,
  formData,
  setFormData,
  loading,
  handleFileChange,
  fileName,
  handleUpload,
  clearForm,
}) {
  return (
    <div className="proposal-container">
      <div className="proposal-form-card">
        <div
          className="form-header-new"
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
          }}
        >
          <h2>Upload Existing Project</h2>
          <p>
            Add a past FYP project to the similarity database. The AI service will extract
            text and generate embeddings automatically.
          </p>
        </div>

        <div className="form-body">
          {/* Status Messages */}
          {uploadStatus && (
            <div
              style={{
                padding: "0.875rem 1rem",
                borderRadius: "0.5rem",
                marginBottom: "1.25rem",
                fontSize: "0.85rem",
                lineHeight: "1.5",
                background: uploadStatus.type === "success" ? "#d1fae5" : "#fee2e2",
                border: `1px solid ${uploadStatus.type === "success" ? "#10b981" : "#ef4444"}`,
                color: uploadStatus.type === "success" ? "#065f46" : "#991b1b",
              }}
            >
              {uploadStatus.message}
            </div>
          )}

          {/* Title */}
          <div className="form-group">
            <label className="form-label">
              Project Title <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter the existing project title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              className="form-input"
              placeholder="Brief description of the project..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Domain */}
          <div className="form-group">
            <label className="form-label">
              Domain / Project Type <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <select
              className="form-input"
              value={formData.projectType}
              onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
              disabled={loading}
            >
              <option value="">Select Domain</option>
              <option value="AI">Artificial Intelligence</option>
              <option value="Web">Web Development</option>
              <option value="Mobile">Mobile Development</option>
              <option value="Cyber">Cybersecurity</option>
              <option value="Data Science">Data Science</option>
              <option value="IoT">Internet of Things</option>
              <option value="Blockchain">Blockchain</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* File Upload */}
          <div className="form-group">
            <label className="form-label">
              Project PDF <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <div className="file-upload-box">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={loading}
              />
              {fileName ? (
                <div>
                  <span className="file-name" style={{ fontWeight: 600 }}>
                    {fileName}
                  </span>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      margin: "0.25rem 0 0",
                    }}
                  >
                    Click to change file
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontWeight: 500, color: "var(--text-dark)" }}>
                    Click or drag to upload PDF
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      margin: "0.25rem 0 0",
                    }}
                  >
                    PDF files only (max 20MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Info Notice */}
          <div className="info-notice" style={{ marginBottom: "1rem" }}>
            <span className="info-icon"></span>
            <p>
              The AI service will extract title, scope, and modules from the PDF and generate
              vector embeddings. This may take 30–60 seconds depending on file size.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              className="submit-btn-new"
              onClick={handleUpload}
              disabled={loading}
              style={{
                flex: 1,
                background: loading
                  ? "#64748b"
                  : "linear-gradient(135deg, #0f172a, #334155)",
              }}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Processing with AI... Please wait
                </>
              ) : (
                <>Upload & Generate Embeddings</>
              )}
            </button>
            {!loading && (
              <button
                className="back-btn"
                onClick={clearForm}
                style={{ marginTop: 0, padding: "0.75rem 1.25rem" }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
