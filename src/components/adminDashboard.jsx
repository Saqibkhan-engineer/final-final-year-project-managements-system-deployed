import { useState, useEffect } from "react";
import React from "react";
import { Sidebar } from "./Sidebar";

export function AdminDashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    projectType: "",
    description: "",
    file: null,
  });
  const [fileName, setFileName] = useState("");
  const [uploadStatus, setUploadStatus] = useState(null);

  // ---- Add User state ----
  const [userLoading, setUserLoading] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const [userForm, setUserForm] = useState({
    name: "", email: "", password: "", role: "student",
    regNo: "", fatherName: "", department: "",
    designation: "", expertise: [],
  });
  const [userFieldErrors, setUserFieldErrors] = useState({});
  const [createdUsers, setCreatedUsers] = useState([]);

  // ---- Create Committees state ----
  const [committeeLoading, setCommitteeLoading] = useState(false);
  const [committeeStatus, setCommitteeStatus] = useState(null);
  const [committeesCreated, setCommitteesCreated] = useState(false); // sequential flow
  const [committees, setCommittees] = useState([]);
  const [committeesLoading, setCommitteesLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignStatus, setAssignStatus] = useState(null);

  // ---- Manual PEC Committees state ----
  const [pecCommittees, setPecCommittees] = useState([]);
  const [loadingPecCommittees, setLoadingPecCommittees] = useState(false);
  const [showCreateCommittee, setShowCreateCommittee] = useState(false);
  const [newCommitteeName, setNewCommitteeName] = useState("");
  const [newCommitteeDomain, setNewCommitteeDomain] = useState("");
  const [availableSupervisors, setAvailableSupervisors] = useState([]);
  const [selectedSupervisors, setSelectedSupervisors] = useState([]);
  const [creatingCommittee, setCreatingCommittee] = useState(false);
  const [editingCommitteeId, setEditingCommitteeId] = useState(null);

  // ---- Edit Evaluation Committees state ----
  const [showEditEvalModal, setShowEditEvalModal] = useState(false);
  const [evalEditingCommitteeId, setEvalEditingCommitteeId] = useState(null);
  const [evalNewCommitteeName, setEvalNewCommitteeName] = useState("");
  const [evalSelectedSupervisors, setEvalSelectedSupervisors] = useState([]);
  const [allSupervisors, setAllSupervisors] = useState([]);
  const [evalUpdating, setEvalUpdating] = useState(false);

  // ---- Phases state ----
  const [phases, setPhases] = useState([]);
  const [phasesLoading, setPhasesLoading] = useState(false);
  const [phaseForm, setPhaseForm] = useState({ name: "", weight: "", deadline: "" });
  const [editingPhaseId, setEditingPhaseId] = useState(null);
  const [phaseStatus, setPhaseStatus] = useState(null);
  const [showPhaseModal, setShowPhaseModal] = useState(false);

  // ---- Rubrics state ----
  const [showRubricsModal, setShowRubricsModal] = useState(false);
  const [activeRubricPhase, setActiveRubricPhase] = useState(null);
  const [rubrics, setRubrics] = useState([]);
  const [rubricsLoading, setRubricsLoading] = useState(false);
  const [activeRubricRole, setActiveRubricRole] = useState("supervisor");
  const [rubricForm, setRubricForm] = useState({ title: "", maxMarks: "" });
  const [editingRubricId, setEditingRubricId] = useState(null);
  const [rubricStatus, setRubricStatus] = useState(null);

  useEffect(() => {
    if (activeView === 'pec_committees') {
      fetchPecCommittees();
    } else if (activeView === 'phases') {
      fetchPhases();
    }
  }, [activeView]);

  const fetchPecCommittees = async () => {
    try {
      setLoadingPecCommittees(true);
      const res = await fetch('/api/pec/all');
      if (res.ok) {
        const data = await res.json();
        setPecCommittees(data);
      }
    } catch (err) {
      console.error('Failed to fetch committees:', err);
    } finally {
      setLoadingPecCommittees(false);
    }
  };

  const fetchPhases = async () => {
    try {
      setPhasesLoading(true);
      const res = await fetch('/api/evaluation/phases');
      if (res.ok) {
        const data = await res.json();
        setPhases(data);
      }
    } catch (err) {
      console.error('Failed to fetch phases:', err);
    } finally {
      setPhasesLoading(false);
    }
  };

  // ---- Rubrics API Methods ----
  const openRubricsModal = (phase) => {
    setActiveRubricPhase(phase);
    setRubrics([]);
    setActiveRubricRole("supervisor");
    setRubricForm({ title: "", maxMarks: "" });
    setEditingRubricId(null);
    setRubricStatus(null);
    setShowRubricsModal(true);
    fetchRubrics(phase.id);
  };

  const closeRubricsModal = () => {
    setShowRubricsModal(false);
    setActiveRubricPhase(null);
  };

  const fetchRubrics = async (phaseId) => {
    try {
      setRubricsLoading(true);
      const res = await fetch(`/api/evaluation/rubrics/${phaseId}`);
      if (res.ok) {
        const data = await res.json();
        setRubrics(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch rubrics:', err);
    } finally {
      setRubricsLoading(false);
    }
  };

  const handleRubricSubmit = async (e) => {
    e.preventDefault();
    setRubricStatus(null);
    try {
      const url = editingRubricId 
        ? `/api/evaluation/rubrics/${editingRubricId}` 
        : '/api/evaluation/rubrics';
      const method = editingRubricId ? 'PATCH' : 'POST';
      const body = {
        title: rubricForm.title,
        maxMarks: Number(rubricForm.maxMarks),
        evaluatorRole: activeRubricRole,
        ...(editingRubricId ? {} : { phaseId: activeRubricPhase.id })
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setRubricStatus({ type: 'success', message: editingRubricId ? 'Rubric updated successfully!' : 'Rubric added successfully!' });
        setRubricForm({ title: "", maxMarks: "" });
        setEditingRubricId(null);
        fetchRubrics(activeRubricPhase.id);
      } else {
        const data = await res.json();
        setRubricStatus({ type: 'error', message: data.message || 'Failed to save rubric.' });
      }
    } catch (err) {
      setRubricStatus({ type: 'error', message: 'An error occurred while saving.' });
    }
  };

  const handleEditRubric = (r) => {
    setRubricForm({ title: r.title, maxMarks: r.maxMarks });
    setEditingRubricId(r.id);
    setRubricStatus(null);
  };

  const cancelRubricEdit = () => {
    setRubricForm({ title: "", maxMarks: "" });
    setEditingRubricId(null);
    setRubricStatus(null);
  };

  const handleDeleteRubric = async (id) => {
    if (!window.confirm("Are you sure you want to delete this rubric?")) return;
    try {
      const res = await fetch(`/api/evaluation/rubrics/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRubricStatus({ type: 'success', message: 'Rubric deleted successfully.' });
        fetchRubrics(activeRubricPhase.id);
      } else {
        setRubricStatus({ type: 'error', message: 'Failed to delete rubric.' });
      }
    } catch (err) {
      console.error('Failed to delete rubric:', err);
      setRubricStatus({ type: 'error', message: 'Error deleting rubric.' });
    }
  };

  const handlePhaseSubmit = async (e) => {
    e.preventDefault();
    setPhaseStatus(null);
    
    const currentTotalWeight = phases.reduce((acc, p) => p.id !== editingPhaseId ? acc + Number(p.weight) : acc, 0);
    const newWeight = Number(phaseForm.weight);
    
    if (currentTotalWeight + newWeight > 100) {
      setPhaseStatus({ type: 'error', message: `Total weight cannot exceed 100%. Current total (excluding this phase): ${currentTotalWeight}%` });
      return;
    }

    try {
      const url = editingPhaseId 
        ? `/api/evaluation/${editingPhaseId}` 
        : '/api/evaluation/phases';
      
      const method = editingPhaseId ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: phaseForm.name,
          weight: newWeight,
          deadline: phaseForm.deadline
        })
      });

      if (res.ok) {
        setPhaseStatus({ type: 'success', message: editingPhaseId ? 'Phase updated successfully!' : 'Phase created successfully!' });
        setPhaseForm({ name: "", weight: "", deadline: "" });
        setEditingPhaseId(null);
        setShowPhaseModal(false);
        fetchPhases();
      } else {
        const data = await res.json();
        setPhaseStatus({ type: 'error', message: data.message || 'Failed to save phase.' });
      }
    } catch (err) {
      setPhaseStatus({ type: 'error', message: 'An error occurred while saving.' });
    }
  };

  const handleDeletePhase = async (id) => {
    if (!window.confirm("Are you sure you want to delete this phase?")) return;
    try {
      const res = await fetch(`/api/evaluation/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPhaseStatus({ type: 'success', message: 'Phase deleted successfully.' });
        fetchPhases();
      } else {
        setPhaseStatus({ type: 'error', message: 'Failed to delete phase.' });
      }
    } catch (err) {
      console.error('Failed to delete phase:', err);
      setPhaseStatus({ type: 'error', message: 'Error deleting phase.' });
    }
  };

  const handleEditPhase = (phase) => {
    setPhaseForm({
      name: phase.name,
      weight: phase.weight,
      deadline: phase.deadline ? new Date(phase.deadline).toISOString().slice(0, 10) : ""
    });
    setEditingPhaseId(phase.id);
  };

  const cancelPhaseEdit = () => {
    setPhaseForm({ name: "", weight: "", deadline: "" });
    setEditingPhaseId(null);
    setPhaseStatus(null);
  };

  useEffect(() => {
    if (newCommitteeDomain) {
      fetchSupervisorsByDomain(newCommitteeDomain);
    } else {
      setAvailableSupervisors([]);
      setSelectedSupervisors([]);
    }
  }, [newCommitteeDomain]);

  const fetchSupervisorsByDomain = async (domain) => {
    try {
      const res = await fetch(`/api/supervisor/all?domain=${domain}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSupervisors(data);
      }
    } catch (err) {
      console.error('Failed to fetch supervisors:', err);
    }
  };

  const handleManualCreateCommittee = async (e) => {
    e.preventDefault();
    if (!newCommitteeName || !newCommitteeDomain || selectedSupervisors.length === 0) {
      alert("Please fill all fields and select at least one supervisor.");
      return;
    }
    try {
      setCreatingCommittee(true);
      const url = editingCommitteeId ? `/api/pec/update/${editingCommitteeId}` : '/api/pec/create';
      const method = editingCommitteeId ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCommitteeName,
          domain: newCommitteeDomain,
          supervisorIds: selectedSupervisors,
        }),
      });
      if (res.ok) {
        alert(`Committee ${editingCommitteeId ? 'updated' : 'created'} successfully!`);
        closeCommitteeModal();
        fetchPecCommittees();
      } else {
        alert(`Failed to ${editingCommitteeId ? 'update' : 'create'} committee.`);
      }
    } catch (err) {
      console.error(err);
      alert(`Error ${editingCommitteeId ? 'updating' : 'creating'} committee.`);
    } finally {
      setCreatingCommittee(false);
    }
  };

  const openEditCommitteeModal = (committee) => {
    setEditingCommitteeId(committee.id);
    setNewCommitteeName(committee.name);
    setNewCommitteeDomain(committee.domain);
    setSelectedSupervisors(committee.supervisors ? committee.supervisors.map(s => s.id) : []);
    setShowCreateCommittee(true);
  };

  const closeCommitteeModal = () => {
    setShowCreateCommittee(false);
    setEditingCommitteeId(null);
    setNewCommitteeName("");
    setNewCommitteeDomain("");
    setSelectedSupervisors([]);
  };

  const toggleSupervisorSelection = (id) => {
    setSelectedSupervisors(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  // Stats derived from upload history
  const totalUploaded = uploadHistory.length;
  const domainCounts = uploadHistory.reduce((acc, item) => {
    const domain = item.projectType || "Other";
    acc[domain] = (acc[domain] || 0) + 1;
    return acc;
  }, {});

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setUploadStatus({ type: "error", message: "Only PDF files are allowed" });
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setUploadStatus({ type: "error", message: "File size must be under 20MB" });
        return;
      }
      setFormData({ ...formData, file });
      setFileName(file.name);
      setUploadStatus(null);
    }
  };

  const handleUpload = async () => {
    // Validation
    if (!formData.title.trim()) {
      setUploadStatus({ type: "error", message: "Please enter a project title" });
      return;
    }
    if (!formData.projectType) {
      setUploadStatus({ type: "error", message: "Please select a domain" });
      return;
    }
    if (!formData.file) {
      setUploadStatus({ type: "error", message: "Please select a PDF file" });
      return;
    }

    setLoading(true);
    setUploadStatus(null);

    const data = new FormData();
    data.append("title", formData.title);
    data.append("projectType", formData.projectType);
    data.append("domain", formData.projectType);
    data.append("description", formData.description);
    data.append("file", formData.file);

    try {
      const res = await fetch("/api/fyp-office/save-proposal", {
        method: "POST",
        body: data,
      });

      let result;
      const responseText = await res.text();
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("Failed to parse response:", responseText);
        throw new Error("Server error. Please try again later.");
      }

      if (!res.ok) {
        throw new Error(result.message || "Upload failed");
      }

      // Add to local history
      const newEntry = {
        id: result.existingProjectId || Date.now(),
        title: formData.title,
        projectType: formData.projectType,
        fileName: formData.file.name,
        uploadedAt: new Date().toISOString(),
      };
      setUploadHistory((prev) => [newEntry, ...prev]);

      setUploadStatus({
        type: "success",
        message: `Project "${formData.title}" uploaded and embedded successfully! (ID: ${result.existingProjectId || "N/A"})`,
      });

      // Reset form
      setFormData({ title: "", projectType: "", description: "", file: null });
      setFileName("");
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus({
        type: "error",
        message: error.message || "Upload failed. Make sure the AI service is running.",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({ title: "", projectType: "", description: "", file: null });
    setFileName("");
    setUploadStatus(null);
  };

  // ---- Add User handlers ----
  const validateUserForm = () => {
    const errors = {};
    if (!userForm.name.trim()) errors.name = "Name is required";
    if (!userForm.email.trim()) errors.email = "Email is required";
    if (!userForm.password || userForm.password.length < 8) errors.password = "Min 8 characters";
    if (userForm.role === "student") {
      const regParts = userForm.regNo ? userForm.regNo.split('-') : [];
      if (!userForm.regNo || regParts.length < 3 || !regParts[1] || !regParts[2]) {
        errors.regNo = "Complete Registration number is required (e.g., FA22-BSE-005)";
      }
      if (!userForm.department) errors.department = "Department is required";
    }
    if (userForm.role === "supervisor") {
      if (!userForm.designation.trim()) errors.designation = "Designation is required";
      if (userForm.expertise.length === 0) errors.expertise = "Select at least one";
    }
    setUserFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateUserForm()) return;
    setUserLoading(true);
    setUserStatus(null);
    try {
      const body = {
        name: userForm.name, email: userForm.email,
        password: userForm.password, role: userForm.role,
        ...(userForm.role === "student" && {
          regNo: userForm.regNo, fatherName: userForm.fatherName, department: userForm.department,
        }),
        ...(userForm.role === "supervisor" && {
          designation: userForm.designation, expertise: userForm.expertise,
        }),
      };
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.message || 'Signup failed');
      setCreatedUsers(prev => [{ ...body, id: Date.now(), createdAt: new Date().toISOString() }, ...prev]);
      setUserStatus({ type: 'success', message: `User "${body.name}" (${body.role}) created successfully!` });
      setUserForm({ name: '', email: '', password: '', role: 'student', regNo: '', fatherName: '', department: '', designation: '', expertise: [] });
      setUserFieldErrors({});
    } catch (err) {
      setUserStatus({ type: 'error', message: err.message || 'Failed to create user' });
    } finally {
      setUserLoading(false);
    }
  };

  // ---- Create Committees (Step 1) ----
  const handleCreateCommittees = async () => {
    setCommitteeLoading(true);
    setCommitteeStatus(null);
    try {
      const res = await fetch('/api/committee/create-committees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.message || 'Failed to create committees');
      setCommitteesCreated(true); // unlock Step 2 and 3
      setCommitteeStatus({
        type: 'success',
        message: `${data.committees || 0} committees created! Now review or assign them.`,
      });
    } catch (err) {
      setCommitteeStatus({ type: 'error', message: err.message || 'Failed to create committees.' });
    } finally {
      setCommitteeLoading(false);
    }
  };

  // ---- View Committees (Step 2) ----
  const handleViewCommittees = async () => {
    setActiveView('committees');
    setCommitteesLoading(true);
    try {
      const res = await fetch('/api/committee/committees-details');
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      if (!res.ok) throw new Error(data.message || 'Failed to fetch committees');

      // Deduplicate committees by ID (TypeORM joins can cause duplicates)
      const raw = Array.isArray(data) ? data : [];
      const comMap = new Map();
      raw.forEach(c => {
        if (!comMap.has(c.id)) {
          // Also deduplicate groups within each committee by group ID
          const seenGroups = new Set();
          const uniqueGroups = (c.groups || []).filter(g => {
            if (seenGroups.has(g.id)) return false;
            seenGroups.add(g.id);
            return true;
          });
          // Also deduplicate members by member ID
          const seenMembers = new Set();
          const uniqueMembers = (c.members || []).filter(m => {
            if (seenMembers.has(m.id)) return false;
            seenMembers.add(m.id);
            return true;
          });
          comMap.set(c.id, { ...c, groups: uniqueGroups, members: uniqueMembers });
        }
      });
      setCommittees(Array.from(comMap.values()));
    } catch (err) {
      setCommittees([]);
      setAssignStatus({ type: 'error', message: err.message });
    } finally {
      setCommitteesLoading(false);
    }
  };

  // ---- Edit Evaluation Committees Logic ----
  const openEditEvalModal = async (committee) => {
    setEvalEditingCommitteeId(committee.id);
    setEvalNewCommitteeName(committee.name);
    setEvalSelectedSupervisors(committee.members ? committee.members.map(m => m.id) : []);
    setShowEditEvalModal(true);
    
    // Fetch all supervisors if not already fetched
    if (allSupervisors.length === 0) {
      try {
        const res = await fetch('/api/supervisor/all');
        if (res.ok) {
          const data = await res.json();
          setAllSupervisors(data);
        }
      } catch (err) {
        console.error('Failed to fetch supervisors', err);
      }
    }
  };

  const closeEditEvalModal = () => {
    setShowEditEvalModal(false);
    setEvalEditingCommitteeId(null);
    setEvalNewCommitteeName("");
    setEvalSelectedSupervisors([]);
  };

  const handleUpdateEvalCommittee = async (e) => {
    e.preventDefault();
    if (!evalNewCommitteeName || evalSelectedSupervisors.length === 0) {
      alert("Please provide a name and select at least one supervisor.");
      return;
    }
    try {
      setEvalUpdating(true);
      const res = await fetch('/api/committee/update-committees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          committeeId: evalEditingCommitteeId,
          name: evalNewCommitteeName,
          memberIds: evalSelectedSupervisors,
        })
      });
      if (res.ok) {
        alert("Committee updated successfully!");
        closeEditEvalModal();
        handleViewCommittees(); // refresh the list
      } else {
        const text = await res.text();
        alert("Failed to update committee: " + text);
      }
    } catch (err) {
      alert("Error updating committee: " + err.message);
    } finally {
      setEvalUpdating(false);
    }
  };

  const toggleEvalSupervisor = (id) => {
    setEvalSelectedSupervisors(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };


  // ---- Assign Committees & Send Emails (Step 3) ----
  const handleAssignCommittees = async () => {
    setAssignLoading(true);
    setAssignStatus(null);
    try {
      const res = await fetch('/api/committee/assign-committees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.message || 'Assignment failed');
      setAssignStatus({
        type: 'success',
        message: `${data.stats?.assigned || 0} groups assigned! Email notifications sent to all committee members.`,
      });
      // Refresh view
      handleViewCommittees();
    } catch (err) {
      setAssignStatus({ type: 'error', message: err.message || 'Assignment failed.' });
    } finally {
      setAssignLoading(false);
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "upload", label: "Upload Project" },
    { id: "adduser", label: "Add User" },
    { id: "history", label: "Upload History" },
    { id: "committees", label: "Committees" },
    { id: "pec_committees", label: "Manage PEC Committees" },
    { id: "phases", label: "Manage Phases" },
  ];

  return (
    <div className="app-layout">
      <Sidebar
        activeView={activeView}
        setActiveView={(view) => {
          setActiveView(view);
          if (view === "upload") setUploadStatus(null);
        }}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        role="admin"
        navItems={navItems}
      />

      <main className="main-content">
        {/* ============================== */}
        {/* DASHBOARD HOME                 */}
        {/* ============================== */}
        {activeView === "dashboard" && (
          <div className="dashboard-home">
            {/* Welcome Banner */}
            <div
              className="welcome-banner"
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
              }}
            >
              <div className="welcome-content">
                <h1>Admin Panel</h1>
                <p>
                  Upload existing FYP projects to build the similarity database.
                  <br />
                  These projects are used to detect plagiarism in new proposals.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="section-card">
              <h3 className="section-title">Quick Actions</h3>
              <div className="action-buttons">
                <button
                  className="action-btn-new primary"
                  style={{ background: "linear-gradient(135deg, #0f172a, #334155)" }}
                  onClick={() => setActiveView("upload")}
                >
                  <span>Upload Existing Project</span>
                </button>
                <button
                  className="action-btn-new"
                  style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
                  onClick={() => setActiveView("history")}
                >
                  <span>View Upload History</span>
                </button>
              </div>

              {/* ══ Committee Workflow (Sequential) ══ */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginTop: '1rem' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>
                  Committee Management
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Step 1: Always visible */}
                  <button
                    className="action-btn-new"
                    style={{
                      background: committeeLoading ? '#64748b' : 'linear-gradient(135deg, #059669, #047857)',
                      opacity: committeeLoading ? 0.7 : 1,
                      cursor: committeeLoading ? 'not-allowed' : 'pointer',
                    }}
                    onClick={handleCreateCommittees}
                    disabled={committeeLoading}
                  >
                    <span>{committeeLoading ? 'Creating...' : committeesCreated ? 'Re-create Committees' : 'Create Committees'}</span>
                  </button>

                  {/* Steps 2 & 3: Only after committees are created */}
                  {committeesCreated && (
                    <>
                      <span style={{ color: '#94a3b8', fontSize: '1.2rem' }}>→</span>
                      <button
                        className="action-btn-new"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                        onClick={handleViewCommittees}
                      >
                        <span>View Committees</span>
                      </button>

                      <span style={{ color: '#94a3b8', fontSize: '1.2rem' }}>→</span>
                      <button
                        className="action-btn-new"
                        style={{
                          background: assignLoading ? '#64748b' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                          opacity: assignLoading ? 0.7 : 1,
                          cursor: assignLoading ? 'not-allowed' : 'pointer',
                        }}
                        onClick={handleAssignCommittees}
                        disabled={assignLoading}
                      >
                        <span>{assignLoading ? 'Assigning...' : 'Assign & Notify'}</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Status messages */}
                {committeeStatus && (
                  <div style={{
                    marginTop: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                    fontSize: '0.82rem', background: committeeStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
                    border: `1px solid ${committeeStatus.type === 'success' ? '#10b981' : '#ef4444'}`,
                    color: committeeStatus.type === 'success' ? '#065f46' : '#991b1b',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span>{committeeStatus.message}</span>
                    <button onClick={() => setCommitteeStatus(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'inherit' }}>✕</button>
                  </div>
                )}
                {assignStatus && (
                  <div style={{
                    marginTop: '0.5rem', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                    fontSize: '0.82rem', background: assignStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
                    border: `1px solid ${assignStatus.type === 'success' ? '#10b981' : '#ef4444'}`,
                    color: assignStatus.type === 'success' ? '#065f46' : '#991b1b',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span>{assignStatus.message}</span>
                    <button onClick={() => setAssignStatus(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'inherit' }}>✕</button>
                  </div>
                )}
              </div>
            </div>


            {/* Domain Breakdown */}
            {Object.keys(domainCounts).length > 0 && (
              <div className="section-card">
                <h3 className="section-title">Projects by Domain</h3>
                <div className="profile-grid">
                  {Object.entries(domainCounts).map(([domain, count]) => (
                    <div className="profile-item" key={domain}>
                      <span className="profile-label">{domain}</span>
                      <span className="profile-value">{count} projects</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile */}
            <div className="section-card">
              <h3 className="section-title">Your Profile</h3>
              <div className="profile-grid">
                <div className="profile-item">
                  <span className="profile-label">Name</span>
                  <span className="profile-value">{user?.name || "Admin"}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Email</span>
                  <span className="profile-value">{user?.email || "admin@fyp.edu"}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Role</span>
                  <span className="profile-value">FYP Office Admin</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================== */}
        {/* UPLOAD PROJECT                 */}
        {/* ============================== */}
        {activeView === "upload" && (
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
        )}

        {/* ============================== */}
        {/* UPLOAD HISTORY                 */}
        {/* ============================== */}
        {activeView === "history" && (
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
        )}

        {/* ============================== */}
        {/* ADD USER                       */}
        {/* ============================== */}
        {activeView === "adduser" && (
          <div className="proposal-container">
            <div className="proposal-form-card">
              <div className="form-header-new" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                <h2>Add New User</h2>
                <p>Create accounts for students, supervisors, PEC members, or admins.</p>
              </div>
              <div className="form-body">
                {userStatus && (
                  <div style={{ padding: '0.875rem 1rem', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.85rem', background: userStatus.type === 'success' ? '#d1fae5' : '#fee2e2', border: `1px solid ${userStatus.type === 'success' ? '#10b981' : '#ef4444'}`, color: userStatus.type === 'success' ? '#065f46' : '#991b1b' }}>
                    {userStatus.message}
                  </div>
                )}

                {/* Name */}
                <div className="form-group">
                  <label className="form-label">Full Name <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input type="text" className={`form-input ${userFieldErrors.name ? 'error' : ''}`} placeholder="Enter full name" value={userForm.name} onChange={e => { setUserForm({ ...userForm, name: e.target.value }); setUserFieldErrors(p => ({ ...p, name: '' })); }} disabled={userLoading} />
                  {userFieldErrors.name && <span className="input-error" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{userFieldErrors.name}</span>}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label">Email <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input type="email" className={`form-input ${userFieldErrors.email ? 'error' : ''}`} placeholder="user@example.com" value={userForm.email} onChange={e => { setUserForm({ ...userForm, email: e.target.value }); setUserFieldErrors(p => ({ ...p, email: '' })); }} disabled={userLoading} />
                  {userFieldErrors.email && <span className="input-error" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{userFieldErrors.email}</span>}
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="form-label">Password <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input type="text" className={`form-input ${userFieldErrors.password ? 'error' : ''}`} placeholder="Min 8 characters" value={userForm.password} onChange={e => { setUserForm({ ...userForm, password: e.target.value }); setUserFieldErrors(p => ({ ...p, password: '' })); }} disabled={userLoading} />
                  {userFieldErrors.password && <span className="input-error" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{userFieldErrors.password}</span>}
                </div>

                {/* Role */}
                <div className="form-group">
                  <label className="form-label">Role <span style={{ color: 'var(--error)' }}>*</span></label>
                  <select className="form-input" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} disabled={userLoading}>
                    <option value="student">Student</option>
                    <option value="pec">PEC Member</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin (FYP Office)</option>
                  </select>
                </div>

                {/* Student fields */}
                {userForm.role === 'student' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Registration Number <span style={{ color: 'var(--error)' }}>*</span></label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                          className={`form-input ${userFieldErrors.regNo ? 'error' : ''}`}
                          style={{ flex: 1.2 }}
                          value={userForm.regNo ? (userForm.regNo.split('-')[0] || "FA22") : "FA22"}
                          onChange={e => {
                            const parts = userForm.regNo ? userForm.regNo.split('-') : ["FA22", "", ""];
                            setUserForm({ ...userForm, regNo: `${e.target.value}-${parts[1] || ""}-${parts[2] || ""}`.toUpperCase() });
                            setUserFieldErrors(p => ({ ...p, regNo: '' }));
                          }}
                          disabled={userLoading}
                        >
                          {['FA22', 'SP22', 'FA23', 'SP23', 'FA24', 'SP24', 'FA25', 'SP25', 'FA26', 'SP26'].map(sem => (
                            <option key={sem} value={sem}>{sem}</option>
                          ))}
                        </select>
                        <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>-</span>
                        <input
                          type="text"
                          className={`form-input ${userFieldErrors.regNo ? 'error' : ''}`}
                          style={{ flex: 1 }}
                          placeholder="e.g. BSE"
                          value={userForm.regNo ? (userForm.regNo.split('-')[1] || "") : ""}
                          onChange={e => {
                            const parts = userForm.regNo ? userForm.regNo.split('-') : ["FA22", "", ""];
                            setUserForm({ ...userForm, regNo: `${parts[0] || "FA22"}-${e.target.value}-${parts[2] || ""}`.toUpperCase() });
                            setUserFieldErrors(p => ({ ...p, regNo: '' }));
                          }}
                          disabled={userLoading}
                        />
                        <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>-</span>
                        <input
                          type="text"
                          className={`form-input ${userFieldErrors.regNo ? 'error' : ''}`}
                          style={{ flex: 1 }}
                          placeholder="e.g. 005"
                          value={userForm.regNo ? (userForm.regNo.split('-')[2] || "") : ""}
                          onChange={e => {
                            const parts = userForm.regNo ? userForm.regNo.split('-') : ["FA22", "", ""];
                            setUserForm({ ...userForm, regNo: `${parts[0] || "FA22"}-${parts[1] || ""}-${e.target.value}`.toUpperCase() });
                            setUserFieldErrors(p => ({ ...p, regNo: '' }));
                          }}
                          disabled={userLoading}
                        />
                      </div>
                      {userFieldErrors.regNo && <span className="input-error" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{userFieldErrors.regNo}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Father's Name</label>
                      <input type="text" className="form-input" placeholder="Enter father's name" value={userForm.fatherName} onChange={e => setUserForm({ ...userForm, fatherName: e.target.value })} disabled={userLoading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department <span style={{ color: 'var(--error)' }}>*</span></label>
                      <select className={`form-input ${userFieldErrors.department ? 'error' : ''}`} value={userForm.department} onChange={e => { setUserForm({ ...userForm, department: e.target.value }); setUserFieldErrors(p => ({ ...p, department: '' })); }} disabled={userLoading}>
                        <option value="">Select Department</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Software Engineering">Software Engineering</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Data Science">Data Science</option>
                      </select>
                      {userFieldErrors.department && <span className="input-error" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{userFieldErrors.department}</span>}
                    </div>
                  </>
                )}

                {/* Supervisor fields */}
                {userForm.role === 'supervisor' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Designation <span style={{ color: 'var(--error)' }}>*</span></label>
                      <select className={`form-input ${userFieldErrors.designation ? 'error' : ''}`} value={userForm.designation} onChange={e => { setUserForm({ ...userForm, designation: e.target.value }); setUserFieldErrors(p => ({ ...p, designation: '' })); }} disabled={userLoading}>
                        <option value="">Select Designation</option>
                        <option value="Lecturer">Lecturer</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Professor">Professor</option>
                      </select>
                      {userFieldErrors.designation && <span className="input-error" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{userFieldErrors.designation}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Expertise <span style={{ color: 'var(--error)' }}>*</span></label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
                        {['AI', 'Web', 'Mobile', 'Data Science', 'Cybersecurity'].map(item => (
                          <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                            <input type="checkbox" value={item} checked={userForm.expertise.includes(item)} onChange={e => { const updated = e.target.checked ? [...userForm.expertise, item] : userForm.expertise.filter(x => x !== item); setUserForm({ ...userForm, expertise: updated }); setUserFieldErrors(p => ({ ...p, expertise: '' })); }} />
                            {item}
                          </label>
                        ))}
                      </div>
                      {userFieldErrors.expertise && <span className="input-error" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{userFieldErrors.expertise}</span>}
                    </div>
                  </>
                )}

                {/* Submit */}
                <button className="submit-btn-new" onClick={handleCreateUser} disabled={userLoading} style={{ background: userLoading ? '#64748b' : 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                  {userLoading ? (<><span className="spinner"></span> Creating...</>) : ('Create User')}
                </button>

                {/* Recently Created */}
                {createdUsers.length > 0 && (
                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Recently Created Users</h4>
                    {createdUsers.slice(0, 5).map(u => (
                      <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#f9fafb', borderRadius: '0.375rem', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                        <span><strong>{u.name}</strong> — {u.email}</span>
                        <span className="meta-badge domain" style={{ textTransform: 'capitalize' }}>{u.role}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* ══════════ COMMITTEES VIEW ══════════ */}
        {activeView === 'committees' && (
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

            {/* Header Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b, #334155)',
              borderRadius: '16px', padding: '1.5rem 2rem',
              marginBottom: '1.5rem', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
            }}>
              <div>
                <h2 style={{ color: '#fff', margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Committees Overview</h2>
                <p style={{ color: '#94a3b8', margin: '0.3rem 0 0', fontSize: '0.85rem' }}>
                  {committees.length} committee{committees.length !== 1 ? 's' : ''} · Review before assigning
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button className="action-btn-new"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                  onClick={handleViewCommittees}>
                  Refresh
                </button>
                <button className="action-btn-new"
                  style={{
                    background: assignLoading ? '#64748b' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                    padding: '0.5rem 1rem', fontSize: '0.82rem',
                    opacity: assignLoading ? 0.7 : 1, cursor: assignLoading ? 'not-allowed' : 'pointer',
                  }}
                  onClick={handleAssignCommittees} disabled={assignLoading}>
                  {assignLoading ? 'Assigning...' : 'Assign & Send Notifications'}
                </button>
              </div>
            </div>

            {/* Assign Status */}
            {assignStatus && (
              <div style={{
                marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem',
                background: assignStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
                border: `1px solid ${assignStatus.type === 'success' ? '#10b981' : '#ef4444'}`,
                color: assignStatus.type === 'success' ? '#065f46' : '#991b1b',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>{assignStatus.message}</span>
                <button onClick={() => setAssignStatus(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'inherit' }}>✕</button>
              </div>
            )}

            {/* Loading */}
            {committeesLoading && (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}></div>
                <p style={{ margin: 0 }}>Loading committees...</p>
              </div>
            )}

            {/* Empty */}
            {!committeesLoading && committees.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}></div>
                <h3 style={{ color: '#475569', margin: '0 0 0.5rem' }}>No Committees Yet</h3>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Go to Dashboard → Step 1: Create Committees first.</p>
              </div>
            )}

            {/* Committee Cards — one per committee, using actual API data */}
            {!committeesLoading && committees.map((com, idx) => {
              const gradients = [
                'linear-gradient(135deg,#6366f1,#8b5cf6)',
                'linear-gradient(135deg,#3b82f6,#06b6d4)',
                'linear-gradient(135deg,#059669,#10b981)',
              ];
              const grad = gradients[idx % gradients.length];
              return (
              <div key={com.id} style={{
                background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0',
                marginBottom: '1.5rem', overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}>
                {/* Card Header */}
                <div style={{ background: grad, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}></div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>{com.name}</h3>
                        <button onClick={() => openEditEvalModal(com)} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 8px' }}>✏️ Edit</button>
                      </div>
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>
                        {com.members?.length || 0} members &nbsp;·&nbsp; {com.groups?.length || 0} groups
                      </p>
                    </div>
                  </div>
                  <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>
                    {com.groups?.length > 0 ? 'Assigned' : 'Pending'}
                  </span>
                </div>

                {/* Body: 2 columns */}
                <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                  {/* LEFT: Members */}
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 0.75rem', borderBottom: '2px solid #e0e7ff', paddingBottom: '0.4rem' }}>
                      Members ({com.members?.length || 0})
                    </p>
                    {(com.members || []).map((m, mi) => (
                      <div key={`m-${m.id}-${mi}`} style={{
                        display: 'flex', gap: '0.6rem', padding: '0.55rem 0.7rem', borderRadius: '10px', marginBottom: '0.4rem',
                        background: m.designation?.toLowerCase().includes('prof') ? '#f5f3ff' : '#f0f9ff',
                        border: `1px solid ${m.designation?.toLowerCase().includes('prof') ? '#c4b5fd' : '#bae6fd'}`,
                      }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
                          background: m.designation?.toLowerCase().includes('prof') ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'linear-gradient(135deg,#3b82f6,#06b6d4)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#fff',
                        }}>
                          {''}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.83rem', fontWeight: 700, color: '#1e293b' }}>{m.user?.name || `Supervisor #${m.id}`}</p>
                          <p style={{ margin: 0, fontSize: '0.69rem', color: '#6366f1', fontWeight: 600, textTransform: 'capitalize' }}>{m.designation}</p>
                          <p style={{ margin: 0, fontSize: '0.67rem', color: '#64748b' }}>{Array.isArray(m.expertise) ? m.expertise.join(' · ') : m.expertise || 'N/A'}</p>
                          {m.user?.email && <p style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8' }}>{m.user.email}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* RIGHT: Groups */}
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 0.75rem', borderBottom: '2px solid #fde68a', paddingBottom: '0.4rem' }}>
                      Assigned Groups ({com.groups?.length || 0})
                    </p>
                    {(!com.groups || com.groups.length === 0) ? (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', background: '#fafafa', borderRadius: '10px', border: '1px dashed #e2e8f0' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}></div>
                        <p style={{ margin: 0, fontSize: '0.8rem' }}>No groups assigned yet</p>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem' }}>Use "Assign & Notify" to assign</p>
                      </div>
                    ) : com.groups.map((g, gi) => (
                      <div key={`g-${g.id}-${gi}`} style={{ padding: '0.75rem', borderRadius: '10px', marginBottom: '0.6rem', background: '#fffbeb', border: '1px solid #fcd34d' }}>

                        {/* Project Title */}
                        <p style={{ margin: '0 0 0.3rem', fontSize: '0.85rem', fontWeight: 700, color: '#92400e', lineHeight: '1.3' }}>
                          {g.proposal?.title || `Project (Proposal #${g.proposalId})`}
                        </p>

                        {/* Domain badge */}
                        {g.proposal?.domain && (
                          <span style={{
                            display: 'inline-block', marginBottom: '0.4rem',
                            fontSize: '0.65rem', fontWeight: 700,
                            background: '#fef3c7', color: '#78350f',
                            padding: '0.1rem 0.5rem', borderRadius: '8px',
                            border: '1px solid #fcd34d',
                          }}>
                            {Array.isArray(g.proposal.domain) ? g.proposal.domain.join(' · ') : g.proposal.domain}
                          </span>
                        )}

                        {/* Student Registration Numbers */}
                        {g.studentRegs && g.studentRegs.length > 0 && (
                          <div style={{ marginBottom: '0.4rem' }}>
                            <p style={{ margin: '0 0 0.25rem', fontSize: '0.65rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Students</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                              {g.studentRegs.map((reg, ri) => (
                                <span key={ri} style={{
                                  fontSize: '0.68rem', fontWeight: 600,
                                  background: ri === 0 ? '#d97706' : '#fff7ed',
                                  color: ri === 0 ? '#fff' : '#92400e',
                                  border: ri === 0 ? 'none' : '1px solid #fcd34d',
                                  padding: '0.15rem 0.5rem', borderRadius: '6px',
                                }}>
                                  {ri === 0 ? `${reg}` : reg}
                                </span>
                              ))}
                            </div>
                            <p style={{ margin: '0.15rem 0 0', fontSize: '0.6rem', color: '#b45309' }}>Lead Student</p>
                          </div>
                        )}

                        {/* Supervisor Name */}
                        <p style={{ margin: '0.1rem 0 0', fontSize: '0.68rem', color: '#6366f1', fontWeight: 600 }}>
                          {g.supervisor?.user?.name || g.supervisor?.name || `Supervisor #${g.supervisorId}`}
                          {g.supervisor?.designation && (
                            <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '0.3rem', textTransform: 'capitalize' }}>
                              ({g.supervisor.designation})
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* ─── Manage PEC Committees ─── */}
        {activeView === "pec_committees" && (
          <div className="committees-container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem' }}>
            <div className="section-card" style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 className="section-title" style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>PEC Committees</h2>
                  <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>Generate and manage domain-specific evaluation committees manually.</p>
                </div>
                <button
                  className="action-btn-new primary"
                  onClick={() => {
                    closeCommitteeModal();
                    setShowCreateCommittee(true);
                  }}
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Create New Committee
                </button>
              </div>

              {loadingPecCommittees ? (
                <div className="loading-state" style={{ textAlign: 'center', padding: '3rem' }}>
                  <span className="spinner"></span>
                  <p>Loading committees...</p>
                </div>
              ) : pecCommittees.length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '12px' }}>
                  <div className="empty-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                  <h3 style={{ margin: '0 0 0.5rem' }}>No PEC Committees Found</h3>
                  <p style={{ color: '#64748b' }}>Create a new committee to get started.</p>
                </div>
              ) : (
                <div className="committees-list" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                  {pecCommittees.map((c) => (
                    <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', background: '#f8fafc', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{c.name}</h3>
                        <button 
                          onClick={() => openEditCommitteeModal(c)}
                          style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', color: '#475569', fontWeight: 600 }}
                        >
                          Edit
                        </button>
                      </div>
                      <span style={{ display: 'inline-block', padding: '4px 10px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '1rem' }}>
                        Domain: {c.domain}
                      </span>
                      <div>
                        <strong style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>Members:</strong>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#334155' }}>
                          {c.supervisors && c.supervisors.length > 0 ? (
                            c.supervisors.map(s => <li key={s.id}>{s.user?.name || s.name || `Supervisor ID: ${s.id}`}</li>)
                          ) : (
                            <li>No members assigned</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Committee Modal */}
            {showCreateCommittee && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', borderRadius: '16px 16px 0 0' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>{editingCommitteeId ? 'Edit Committee' : 'Create New Committee'}</h3>
                    <button onClick={closeCommitteeModal} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '8px', width: '30px', height: '30px', fontSize: '1rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                  
                  <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                    <form onSubmit={handleManualCreateCommittee}>
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Committee Name</label>
                        <input type="text" value={newCommitteeName} onChange={e => setNewCommitteeName(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} placeholder="e.g. Web Dev Review Committee" required />
                      </div>

                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Domain</label>
                        <select value={newCommitteeDomain} onChange={e => setNewCommitteeDomain(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} required>
                          <option value="">Select Domain...</option>
                          <option value="Web">Web</option>
                          <option value="AI">AI</option>
                          <option value="Mobile">Mobile</option>
                          <option value="Cyber">Cyber Security</option>
                          <option value="Networks">Networks</option>
                          <option value="DataScience">Data Science</option>
                        </select>
                      </div>

                      {newCommitteeDomain && (
                        <div style={{ marginBottom: '1.25rem' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Select Members (Supervisors)</label>
                          <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem' }}>
                            {availableSupervisors.length === 0 ? (
                              <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '1rem 0', margin: 0 }}>No supervisors found for this domain.</p>
                            ) : (
                              availableSupervisors.map(sup => (
                                <label key={sup.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                                  <input type="checkbox" checked={selectedSupervisors.includes(sup.id)} onChange={() => toggleSupervisorSelection(sup.id)} style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }} />
                                  <span style={{ fontSize: '0.9rem', color: '#334155' }}>{sup.user?.name || sup.name}</span>
                                </label>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" onClick={closeCommitteeModal} style={{ padding: '0.6rem 1.2rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={creatingCommittee || selectedSupervisors.length === 0} style={{ padding: '0.6rem 1.2rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: (creatingCommittee || selectedSupervisors.length === 0) ? 0.6 : 1 }}>
                          {creatingCommittee ? (editingCommitteeId ? 'Updating...' : 'Creating...') : (editingCommitteeId ? 'Update Committee' : 'Create Committee')}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      {/* ═══════════════ EDIT EVALUATION COMMITTEE MODAL ═══════════════ */}
      {showEditEvalModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b' }}>Edit Evaluation Committee</h2>
              <button onClick={closeEditEvalModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleUpdateEvalCommittee}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Committee Name</label>
                <input 
                  type="text" 
                  value={evalNewCommitteeName} 
                  onChange={e => setEvalNewCommitteeName(e.target.value)}
                  placeholder="e.g. Committee Alpha"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Select Members (Supervisors)</label>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem', background: '#f8fafc' }}>
                  {allSupervisors.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '1rem 0', margin: 0 }}>Loading supervisors...</p>
                  ) : (
                    allSupervisors.map(sup => (
                      <label key={sup.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', margin: 0 }}>
                        <input 
                          type="checkbox" 
                          checked={evalSelectedSupervisors.includes(sup.id)} 
                          onChange={() => toggleEvalSupervisor(sup.id)} 
                          style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }} 
                        />
                        <span style={{ fontSize: '0.9rem', color: '#334155' }}>
                          {sup.user?.name || sup.name || `Supervisor ID: ${sup.id}`}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={closeEditEvalModal} style={{ padding: '0.6rem 1.2rem', background: 'none', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={evalUpdating || evalSelectedSupervisors.length === 0} style={{ padding: '0.6rem 1.2rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: (evalUpdating || evalSelectedSupervisors.length === 0) ? 0.6 : 1 }}>
                  {evalUpdating ? 'Updating...' : 'Update Committee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeView === "phases" && (
        <div className="phases-container" style={{ width: '100%' }}>
          
          <div className="section-card" style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 className="section-title" style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Evaluation Phases</h2>
                <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>Manage evaluation phases, weightages, and deadlines.</p>
              </div>
            </div>

            {/* Status Message */}
            {phaseStatus && (
              <div style={{
                marginBottom: '1.5rem', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem',
                background: phaseStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
                border: `1px solid ${phaseStatus.type === 'success' ? '#10b981' : '#ef4444'}`,
                color: phaseStatus.type === 'success' ? '#065f46' : '#991b1b',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <span>{phaseStatus.message}</span>
                <button onClick={() => setPhaseStatus(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1.1rem' }}>✕</button>
              </div>
            )}

            {/* Total Weight Status */}
            {!phasesLoading && phases.length > 0 && (
              <div style={{
                marginBottom: '1.5rem', padding: '1.25rem 1.5rem', borderRadius: '12px',
                background: 'linear-gradient(135deg, #1e293b, #334155)', color: '#fff',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Total Allocated Weightage</span>
                <span style={{ 
                  fontSize: '1.3rem', fontWeight: 700, 
                  color: phases.reduce((acc, p) => acc + Number(p.weight), 0) === 100 ? '#34d399' : '#fcd34d' 
                }}>
                  {phases.reduce((acc, p) => acc + Number(p.weight), 0)}% / 100%
                </span>
              </div>
            )}

            {/* Phase Cards Grid */}
            {phasesLoading ? (
               <div style={{ textAlign: 'center', padding: '3rem' }}>
                 <span className="spinner"></span>
                 <p style={{ color: '#64748b', marginTop: '1rem' }}>Loading phases...</p>
               </div>
            ) : phases.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                 <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                 <h3 style={{ margin: '0 0 0.5rem' }}>No Phases Defined Yet</h3>
                 <p style={{ color: '#64748b', margin: 0 }}>Create a new evaluation phase to get started.</p>
               </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {phases.map((phase, idx) => {
                  const gradients = [
                    'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    'linear-gradient(135deg,#3b82f6,#06b6d4)',
                    'linear-gradient(135deg,#f59e0b,#f97316)',
                    'linear-gradient(135deg,#10b981,#059669)',
                  ];
                  const grad = gradients[idx % gradients.length];
                  
                  return (
                    <div key={phase.id} style={{
                      background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0',
                      overflow: 'hidden', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                      transition: 'transform 0.2s', cursor: 'default'
                    }}>
                      <div style={{ background: grad, padding: '1.25rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', fontWeight: 700 }}>{phase.name}</h3>
                          <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.25)', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>Weight: {phase.weight}%</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button 
                            onClick={() => { handleEditPhase(phase); setShowPhaseModal(true); }}
                            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '6px', color: '#fff', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Edit"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button 
                            onClick={() => handleDeletePhase(phase.id)}
                            style={{ background: 'rgba(239, 68, 68, 0.9)', border: 'none', borderRadius: '6px', color: '#fff', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Delete"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                        </div>
                      </div>
                      <div style={{ padding: '1.25rem', background: '#f8fafc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#475569', fontSize: '0.9rem', marginBottom: '1rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>📅</span>
                          <span><strong>Deadline:</strong> {phase.deadline ? new Date(phase.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}</span>
                        </div>
                        <button 
                          onClick={() => openRubricsModal(phase)}
                          style={{ width: '100%', padding: '0.6rem', background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background 0.2s' }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                          Manage Rubrics
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Phase Button */}
            <div style={{ textAlign: 'center', marginTop: phases.length > 0 ? '1rem' : '2rem' }}>
              <button 
                className="action-btn-new primary"
                onClick={() => { setEditingPhaseId(null); setPhaseForm({ name: "", weight: "", deadline: "" }); setShowPhaseModal(true); }}
                style={{ 
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', 
                  padding: '0.8rem 1.75rem', borderRadius: '10px', border: 'none', 
                  fontWeight: 600, fontSize: '1.05rem', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Add New Phase
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* ═══════════════ ADD/EDIT PHASE MODAL ═══════════════ */}
      {showPhaseModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 600 }}>{editingPhaseId ? 'Edit Phase' : 'Create New Phase'}</h3>
              <button onClick={() => { setShowPhaseModal(false); cancelPhaseEdit(); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '8px', width: '32px', height: '32px', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <form onSubmit={handlePhaseSubmit}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Phase Name</label>
                  <input
                    type="text"
                    value={phaseForm.name}
                    onChange={(e) => setPhaseForm({...phaseForm, name: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    placeholder="e.g. Proposal Defense"
                    required
                  />
                </div>
                
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Weightage (%)</label>
                  <input
                    type="number"
                    value={phaseForm.weight}
                    onChange={(e) => setPhaseForm({...phaseForm, weight: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    placeholder="e.g. 10"
                    min="1"
                    max="100"
                    required
                  />
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>Ensure the total weight does not exceed 100%.</p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Deadline</label>
                  <input
                    type="date"
                    value={phaseForm.deadline}
                    onChange={(e) => setPhaseForm({...phaseForm, deadline: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" onClick={() => { setShowPhaseModal(false); cancelPhaseEdit(); }} style={{ padding: '0.6rem 1.2rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '0.6rem 1.2rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                    {editingPhaseId ? 'Update Phase' : 'Add Phase'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MANAGE RUBRICS MODAL ═══════════════ */}
      {showRubricsModal && activeRubricPhase && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 600 }}>Manage Rubrics</h3>
                <p style={{ margin: '0.2rem 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Phase: {activeRubricPhase.name}</p>
              </div>
              <button onClick={closeRubricsModal} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '8px', width: '32px', height: '32px', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            
            {/* Role Tabs */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', padding: '0 1.5rem' }}>
              <button 
                onClick={() => { setActiveRubricRole("supervisor"); cancelRubricEdit(); }}
                style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', borderBottom: activeRubricRole === 'supervisor' ? '3px solid #3b82f6' : '3px solid transparent', color: activeRubricRole === 'supervisor' ? '#2563eb' : '#64748b', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Supervisor Rubrics
              </button>
              <button 
                onClick={() => { setActiveRubricRole("committee"); cancelRubricEdit(); }}
                style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', borderBottom: activeRubricRole === 'committee' ? '3px solid #3b82f6' : '3px solid transparent', color: activeRubricRole === 'committee' ? '#2563eb' : '#64748b', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Committee Rubrics
              </button>
            </div>

            <div className="rubrics-modal-body">
              
              {/* Form Section (Left) */}
              <div className="rubrics-form-section">
                <h4 style={{ margin: '0 0 1rem', color: '#1e293b', fontSize: '1.05rem' }}>{editingRubricId ? 'Edit Rubric' : 'Add New Rubric'}</h4>
                
                {rubricStatus && (
                  <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', background: rubricStatus.type === 'success' ? '#d1fae5' : '#fee2e2', border: `1px solid ${rubricStatus.type === 'success' ? '#10b981' : '#ef4444'}`, color: rubricStatus.type === 'success' ? '#065f46' : '#991b1b' }}>
                    {rubricStatus.message}
                  </div>
                )}

                <form onSubmit={handleRubricSubmit}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Rubric Title</label>
                    <input
                      type="text"
                      value={rubricForm.title}
                      onChange={(e) => setRubricForm({...rubricForm, title: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                      placeholder="e.g. Code Quality"
                      required
                    />
                  </div>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Max Marks</label>
                    <input
                      type="number"
                      value={rubricForm.maxMarks}
                      onChange={(e) => setRubricForm({...rubricForm, maxMarks: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                      placeholder="e.g. 15"
                      min="1"
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button type="submit" style={{ width: '100%', padding: '0.75rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                      {editingRubricId ? 'Update Rubric' : 'Add Rubric'}
                    </button>
                    {editingRubricId && (
                      <button type="button" onClick={cancelRubricEdit} style={{ width: '100%', padding: '0.75rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List Section (Right) */}
              <div className="rubrics-list-section">
                <h4 style={{ margin: '0 0 1rem', color: '#1e293b', fontSize: '1.05rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{activeRubricRole === 'supervisor' ? 'Supervisor' : 'Committee'} Rubrics</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                    Total Marks: {rubrics.filter(r => r.evaluatorRole === activeRubricRole).reduce((acc, r) => acc + Number(r.maxMarks), 0)}
                  </span>
                </h4>
                
                {rubricsLoading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading rubrics...</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {rubrics.filter(r => r.evaluatorRole === activeRubricRole).length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                        No rubrics defined for {activeRubricRole}.
                      </div>
                    ) : (
                      rubrics.filter(r => r.evaluatorRole === activeRubricRole).map(rubric => (
                        <div key={rubric.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                          <div>
                            <h5 style={{ margin: '0 0 0.25rem', fontSize: '1rem', color: '#1e293b' }}>{rubric.title}</h5>
                            <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Max Marks: {rubric.maxMarks}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => handleEditRubric(rubric)}
                              style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#3b82f6', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteRubric(rubric.id)}
                              style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', color: '#ef4444', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

