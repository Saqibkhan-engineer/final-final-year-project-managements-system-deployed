import React, { useState, useEffect } from "react";
import { Sidebar } from "../Sidebar";
import { DashboardView } from "./views/DashboardView";
import { UploadView } from "./views/UploadView";
import { HistoryView } from "./views/HistoryView";
import { AddUserView } from "./views/AddUserView";
import { CommitteesView } from "./views/CommitteesView";
import { PecCommitteesView } from "./views/PecCommitteesView";
import { PhasesView } from "./views/PhasesView";
import { PasswordResetView } from "./views/PasswordResetView";
import * as api from "./api";

export function AdminDashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // ---- Upload state ----
  const [loading, setLoading] = useState(false);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [formData, setFormData] = useState({ title: "", projectType: "", description: "", file: null });
  const [fileName, setFileName] = useState("");
  const [uploadStatus, setUploadStatus] = useState(null);

  // ---- Add User state ----
  const [userLoading, setUserLoading] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "student", regNo: "", fatherName: "", department: "", designation: "", expertise: [] });
  const [userFieldErrors, setUserFieldErrors] = useState({});
  const [createdUsers, setCreatedUsers] = useState([]);

  // ---- Create Committees state ----
  const [committeeLoading, setCommitteeLoading] = useState(false);
  const [committeeStatus, setCommitteeStatus] = useState(null);
  const [committeesCreated, setCommitteesCreated] = useState(false);
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
    if (activeView === 'pec_committees') fetchPecCommittees();
    else if (activeView === 'phases') fetchPhases();
  }, [activeView]);

  const fetchPecCommittees = async () => {
    try {
      setLoadingPecCommittees(true);
      const data = await api.fetchPecCommitteesApi();
      setPecCommittees(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      console.error('Failed to fetch committees:', err);
      setPecCommittees([]);
    } finally {
      setLoadingPecCommittees(false);
    }
  };

  const fetchPhases = async () => {
    try {
      setPhasesLoading(true);
      const data = await api.fetchPhasesApi();
      setPhases(data);
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
      const data = await api.fetchRubricsApi(phaseId);
      setRubrics(Array.isArray(data) ? data : []);
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
      const body = {
        title: rubricForm.title,
        maxMarks: Number(rubricForm.maxMarks),
        evaluatorRole: activeRubricRole,
        ...(editingRubricId ? {} : { phaseId: activeRubricPhase.id })
      };
      await api.saveRubricApi(editingRubricId, body);
      setRubricStatus({ type: 'success', message: editingRubricId ? 'Rubric updated successfully!' : 'Rubric added successfully!' });
      setRubricForm({ title: "", maxMarks: "" });
      setEditingRubricId(null);
      fetchRubrics(activeRubricPhase.id);
    } catch (err) {
      setRubricStatus({ type: 'error', message: err.message || 'An error occurred while saving.' });
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
      await api.deleteRubricApi(id);
      setRubricStatus({ type: 'success', message: 'Rubric deleted successfully.' });
      fetchRubrics(activeRubricPhase.id);
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
      await api.savePhaseApi(editingPhaseId, { name: phaseForm.name, weight: newWeight, deadline: phaseForm.deadline });
      setPhaseStatus({ type: 'success', message: editingPhaseId ? 'Phase updated successfully!' : 'Phase created successfully!' });
      setPhaseForm({ name: "", weight: "", deadline: "" });
      setEditingPhaseId(null);
      setShowPhaseModal(false);
      fetchPhases();
    } catch (err) {
      setPhaseStatus({ type: 'error', message: err.message || 'An error occurred while saving.' });
    }
  };

  const handleDeletePhase = async (id) => {
    if (!window.confirm("Are you sure you want to delete this phase?")) return;
    try {
      await api.deletePhaseApi(id);
      setPhaseStatus({ type: 'success', message: 'Phase deleted successfully.' });
      fetchPhases();
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
    // If no domain is selected, fetch all supervisors so they can still see existing members
    fetchSupervisorsByDomain(newCommitteeDomain || "");
  }, [newCommitteeDomain]);

  const fetchSupervisorsByDomain = async (domain) => {
    try {
      const data = await api.fetchSupervisorsApi(domain);
      setAvailableSupervisors(data);
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
      await api.savePecCommitteeApi(editingCommitteeId, {
        name: newCommitteeName,
        domain: newCommitteeDomain,
        supervisorIds: selectedSupervisors,
      });
      alert(`Committee ${editingCommitteeId ? 'updated' : 'created'} successfully!`);
      closeCommitteeModal();
      fetchPecCommittees();
    } catch (err) {
      console.error(err);
      alert(`Error ${editingCommitteeId ? 'updating' : 'creating'} committee.`);
    } finally {
      setCreatingCommittee(false);
    }
  };

  const openEditCommitteeModal = (committee) => {
    setEditingCommitteeId(committee.id);
    setNewCommitteeName(committee.name || "");
    setNewCommitteeDomain(committee.domain || "");
    // Preserve selected supervisors, safely extracting their IDs
    const selected = committee.supervisors ? committee.supervisors.map(s => s.id) : [];
    setSelectedSupervisors(selected);
    setShowCreateCommittee(true);
    
    // Explicitly fetch supervisors if domain exists to ensure they are loaded
    if (committee.domain) {
      fetchSupervisorsByDomain(committee.domain);
    }
  };

  const closeCommitteeModal = () => {
    setShowCreateCommittee(false);
    setEditingCommitteeId(null);
    setNewCommitteeName("");
    setNewCommitteeDomain("");
    setSelectedSupervisors([]);
  };

  const toggleSupervisorSelection = (id) => {
    setSelectedSupervisors(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

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
    if (!formData.title.trim()) { setUploadStatus({ type: "error", message: "Please enter a project title" }); return; }
    if (!formData.projectType) { setUploadStatus({ type: "error", message: "Please select a domain" }); return; }
    if (!formData.file) { setUploadStatus({ type: "error", message: "Please select a PDF file" }); return; }

    setLoading(true);
    setUploadStatus(null);

    const data = new FormData();
    data.append("title", formData.title);
    data.append("projectType", formData.projectType);
    data.append("domain", formData.projectType);
    data.append("description", formData.description);
    data.append("file", formData.file);

    try {
      const result = await api.saveProposalApi(data);
      const newEntry = {
        id: result.existingProjectId || Date.now(),
        title: formData.title,
        projectType: formData.projectType,
        fileName: formData.file.name,
        uploadedAt: new Date().toISOString(),
      };
      setUploadHistory((prev) => [newEntry, ...prev]);
      setUploadStatus({ type: "success", message: `Project "${formData.title}" uploaded and embedded successfully! (ID: ${result.existingProjectId || "N/A"})` });
      setFormData({ title: "", projectType: "", description: "", file: null });
      setFileName("");
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus({ type: "error", message: error.message || "Upload failed. Make sure the AI service is running." });
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({ title: "", projectType: "", description: "", file: null });
    setFileName("");
    setUploadStatus(null);
  };

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
        ...(userForm.role === "student" && { regNo: userForm.regNo, fatherName: userForm.fatherName, department: userForm.department }),
        ...(userForm.role === "supervisor" && { designation: userForm.designation, expertise: userForm.expertise }),
      };
      await api.signupUserApi(body);
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

  const handleCreateCommittees = async () => {
    setCommitteeLoading(true);
    setCommitteeStatus(null);
    try {
      const data = await api.createCommitteesApi();
      setCommitteesCreated(true);
      setCommitteeStatus({ type: 'success', message: `${data.committees || 0} committees created! Now review or assign them.` });
    } catch (err) {
      setCommitteeStatus({ type: 'error', message: err.message || 'Failed to create committees.' });
    } finally {
      setCommitteeLoading(false);
    }
  };

  const handleViewCommittees = async () => {
    setActiveView('committees');
    setCommitteesLoading(true);
    try {
      const data = await api.fetchCommitteesDetailsApi();
      const raw = Array.isArray(data) ? data : [];
      const comMap = new Map();
      raw.forEach(c => {
        if (!comMap.has(c.id)) {
          const seenGroups = new Set();
          const uniqueGroups = (c.groups || []).filter(g => { if (seenGroups.has(g.id)) return false; seenGroups.add(g.id); return true; });
          const seenMembers = new Set();
          const uniqueMembers = (c.members || []).filter(m => { if (seenMembers.has(m.id)) return false; seenMembers.add(m.id); return true; });
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

  const openEditEvalModal = async (committee) => {
    setEvalEditingCommitteeId(committee.id);
    setEvalNewCommitteeName(committee.name);
    setEvalSelectedSupervisors(committee.members ? committee.members.map(m => m.id) : []);
    setShowEditEvalModal(true);
    if (allSupervisors.length === 0) {
      try {
        const data = await api.fetchSupervisorsApi();
        setAllSupervisors(data);
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
      await api.updateEvalCommitteesApi({
        committeeId: evalEditingCommitteeId,
        name: evalNewCommitteeName,
        memberIds: evalSelectedSupervisors,
      });
      alert("Committee updated successfully!");
      closeEditEvalModal();
      handleViewCommittees();
    } catch (err) {
      alert("Error updating committee: " + err.message);
    } finally {
      setEvalUpdating(false);
    }
  };

  const toggleEvalSupervisor = (id) => {
    setEvalSelectedSupervisors(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleAssignCommittees = async () => {
    setAssignLoading(true);
    setAssignStatus(null);
    try {
      const data = await api.assignCommitteesApi();
      setAssignStatus({ type: 'success', message: `${data.stats?.assigned || 0} groups assigned! Email notifications sent to all committee members.` });
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
    { id: "reset_password", label: "Password Reset" },
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
        {activeView === "dashboard" && (
          <DashboardView
            user={user} setActiveView={setActiveView} committeeLoading={committeeLoading}
            committeesCreated={committeesCreated} handleCreateCommittees={handleCreateCommittees}
            handleViewCommittees={handleViewCommittees} assignLoading={assignLoading}
            handleAssignCommittees={handleAssignCommittees} committeeStatus={committeeStatus}
            setCommitteeStatus={setCommitteeStatus} assignStatus={assignStatus}
            setAssignStatus={setAssignStatus} domainCounts={domainCounts}
          />
        )}
        
        {activeView === "upload" && (
          <UploadView
            uploadStatus={uploadStatus} formData={formData} setFormData={setFormData}
            loading={loading} handleFileChange={handleFileChange} fileName={fileName}
            handleUpload={handleUpload} clearForm={clearForm}
          />
        )}

        {activeView === "history" && (
          <HistoryView uploadHistory={uploadHistory} setActiveView={setActiveView} />
        )}

        {activeView === "adduser" && (
          <AddUserView
            userStatus={userStatus} userForm={userForm} setUserForm={setUserForm}
            userFieldErrors={userFieldErrors} setUserFieldErrors={setUserFieldErrors}
            userLoading={userLoading} handleCreateUser={handleCreateUser} createdUsers={createdUsers}
          />
        )}

        {activeView === "committees" && (
          <CommitteesView
            committees={committees} handleViewCommittees={handleViewCommittees}
            assignLoading={assignLoading} handleAssignCommittees={handleAssignCommittees}
            assignStatus={assignStatus} setAssignStatus={setAssignStatus}
            committeesLoading={committeesLoading} openEditEvalModal={openEditEvalModal}
          />
        )}

        {activeView === "pec_committees" && (
          <PecCommitteesView
            closeCommitteeModal={closeCommitteeModal} setShowCreateCommittee={setShowCreateCommittee}
            loadingPecCommittees={loadingPecCommittees} pecCommittees={pecCommittees}
            openEditCommitteeModal={openEditCommitteeModal} showCreateCommittee={showCreateCommittee}
            editingCommitteeId={editingCommitteeId} handleManualCreateCommittee={handleManualCreateCommittee}
            newCommitteeName={newCommitteeName} setNewCommitteeName={setNewCommitteeName}
            newCommitteeDomain={newCommitteeDomain} setNewCommitteeDomain={setNewCommitteeDomain}
            availableSupervisors={availableSupervisors} selectedSupervisors={selectedSupervisors}
            toggleSupervisorSelection={toggleSupervisorSelection} creatingCommittee={creatingCommittee}
          />
        )}

        {activeView === "phases" && (
          <PhasesView
            phaseStatus={phaseStatus} setPhaseStatus={setPhaseStatus} phasesLoading={phasesLoading}
            phases={phases} handleEditPhase={handleEditPhase} setShowPhaseModal={setShowPhaseModal}
            handleDeletePhase={handleDeletePhase} openRubricsModal={openRubricsModal}
            setEditingPhaseId={setEditingPhaseId} setPhaseForm={setPhaseForm}
          />
        )}

        {activeView === "reset_password" && (
          <PasswordResetView />
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
