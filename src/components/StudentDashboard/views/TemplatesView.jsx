import React from "react";

export function TemplatesView() {
  return (
    <div className="templates-container">
      <div className="section-card">
        <h2 className="section-title">Download Official Templates</h2>
        <p className="section-subtitle">Download the required templates for your FYP proposal submission</p>

        <div className="template-list">
          <div className="template-item-new">
            <div className="template-icon-new">PDF</div>
            <div className="template-info">
              <h4>Proposal Template</h4>
              <p>Official FYP proposal submission template. Use this format to submit your project proposal.</p>
              <span className="template-meta">PDF Document</span>
            </div>
            <a
              href="/TITLE.pdf"
              download="Proposal_Template.pdf"
              className="download-btn-new"
            >
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
