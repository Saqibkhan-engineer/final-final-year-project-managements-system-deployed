import { CheckCircle, XCircle, Search } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "../Sidebar";
import io from "socket.io-client";
import * as pdfjsLib from 'pdfjs-dist';
import {
  fetchChatMessagesApi,
  sendChatMessageApi,
  fetchEvaluationPhasesApi,
  fetchViewDocumentApi,
  fetchMarksApi,
  submitDocumentApi,
  fetchStudentDashboardApi,
  fetchSupervisorsApi,
  fetchMyCommitteeApi,
  fetchAvailableIdeasApi,
  searchStudentsApi,
  sendSupervisorRequestApi,
  checkSimilarityApi,
  enhanceProposalApi,
  submitToPecApi,
} from "./api";

import { DashboardView } from "./views/DashboardView";
import { IdeasView } from "./views/IdeasView";
import { SubmitProposalView } from "./views/SubmitProposalView";
import { StatusView } from "./views/StatusView";
import { TemplatesView } from "./views/TemplatesView";
import { ChatView } from "./views/ChatView";
import { MyCommitteeView } from "./views/MyCommitteeView";
import { DocumentsView } from "./views/DocumentsView";
import { MarksView } from "./views/MarksView";

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/* ── Socket singleton ── */
let studentSocket = null;
function getStudentSocket() {
  if (!studentSocket) {
    studentSocket = io(import.meta.env.VITE_API_URL || "/", { transports: ["websocket", "polling"] });
  }
  return studentSocket;
}

export function StudentDashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file: null,
    domain: "",
  });
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [pdfExtracting, setPdfExtracting] = useState(false); // PDF text extraction loading
  const [currentStep, setCurrentStep] = useState("form");
  const [submittedProposal, setSubmittedProposal] = useState(null);
  const [enhancedData, setEnhancedData] = useState(null);
  const [existingProposal, setExistingProposal] = useState(null);
  const [proposalLoading, setProposalLoading] = useState(true);

  const [availableSupervisors, setAvailableSupervisors] = useState([]);
  const [showSupervisors, setShowSupervisors] = useState(false);
  const [supervisorsLoading, setSupervisorsLoading] = useState(false);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState(null);

  // ── Team member search state ──
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]); // [{id, name, regNo}]
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // ── My Committee state ──
  const [myCommittee, setMyCommittee] = useState(null);
  const [committeeLoading, setCommitteeLoading] = useState(false);
  const [committeeError, setCommitteeError] = useState(null);

  // ── Chat state ──
  const [myGroupId, setMyGroupId] = useState(null);
  const [myGroupInfo, setMyGroupInfo] = useState(null); // { id, name, supervisor, members, ... }
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatBoxRef = useRef(null);

  // ── Documents Upload state ──
  const [evalPhases, setEvalPhases] = useState([]);
  const [evalPhasesLoading, setEvalPhasesLoading] = useState(false);
  const [evalPhasesError, setEvalPhasesError] = useState("");
  const [documentStatus, setDocumentStatus] = useState({});
  const [uploadingPhase, setUploadingPhase] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [githubUrls, setGithubUrls] = useState({});
  const [studentMarks, setStudentMarks] = useState({});
  const [marksLoading, setMarksLoading] = useState(false);
  const [collapsedMarksPhases, setCollapsedMarksPhases] = useState({});

  // ── Supervisor Ideas state ──
  const [availableIdeas, setAvailableIdeas] = useState([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasError, setIdeasError] = useState("");

  const student = {
    name: user?.name || "Student",
    email: user?.email || "student@gmail.com",
    program: "BS Computer Science",
    semester: "7th Semester",
  };

  // Fetch dashboard data on mount: proposal + groupId in ONE call
  useEffect(() => {
    if (user?.studentId) {
      fetchMyProposal();
    }
  }, [user?.studentId]);

  // Initialize selectedTeamMembers with logged-in student
  useEffect(() => {
    if (user && selectedTeamMembers.length === 0) {
      setSelectedTeamMembers([{
        id: user.studentId || user.id,
        name: (user.name || 'Student') + ' (You)',
        regNo: user.email || user.regNo || '',
        isMe: true
      }]);
    }
  }, [user, selectedTeamMembers.length]);

  // ── Socket: Join group room as soon as myGroupId is known ──
  useEffect(() => {
    if (!myGroupId) return;
    const s = getStudentSocket();
    const joinRoom = () => {
      s.emit('joinRoom', myGroupId);
      console.log('<CheckCircle className="inline-icon" size={18} /> Student joined group room:', myGroupId);
    };
    if (s.connected) joinRoom();
    else s.on('connect', joinRoom);
    return () => s.off('connect', joinRoom);
  }, [myGroupId]);

  // ── Socket: Listen for proposal_submitted from group members ──
  useEffect(() => {
    if (!myGroupId) return;
    const s = getStudentSocket();
    const handleProposalSubmitted = (data) => {
      console.log('📬 proposal_submitted received from group:', data);
      // Re-fetch so all group members see the updated proposal
      fetchMyProposal();
    };
    s.on('proposal_submitted', handleProposalSubmitted);
    return () => s.off('proposal_submitted', handleProposalSubmitted);
  }, [myGroupId]);

  // ── Socket for Chat ──
  useEffect(() => {
    if (activeView !== 'chat') return;
    if (!myGroupId) {
      setChatError('You are not assigned to any group yet.');
      return;
    }
    
    const initChat = async () => {
      setChatLoading(true);
      setChatError(null);
      try {
        // Fetch chat messages for this group
        const history = await fetchChatMessagesApi(myGroupId);
        setChatMessages(Array.isArray(history) ? history : []);
        
        // Join socket room
        const s = getStudentSocket();
        const joinRoom = () => {
          s.emit('joinRoom', myGroupId);
          console.log('<CheckCircle className="inline-icon" size={18} /> Student joined room:', myGroupId, '| socket id:', s.id);
        };
        
        if (s.connected) {
          joinRoom();
        } else {
          s.once('connect', joinRoom);
        }
        
        const handleMsg = (msg) => {
          console.log('📬 Student receiveMessage:', msg);
          setChatMessages(prev => [...prev, msg]);
        };
        s.on('receiveMessage', handleMsg);
        
        // Cleanup stored for return
        setChatLoading(false);
        
        return () => {
          s.off('receiveMessage', handleMsg);
          s.off('connect', joinRoom);
        };
      } catch (err) {
        console.error('<XCircle className="inline-icon" size={18} /> Chat init error:', err);
        setChatError('Failed to load chat. Please try again.');
        setChatLoading(false);
      }
    };
    
    let cleanup;
    initChat().then(cleanupFn => { cleanup = cleanupFn; });
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [activeView, myGroupId]);

  // Auto-scroll
  useEffect(() => {
    if (chatBoxRef.current)
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [chatMessages]);

  // Send message
  const sendStudentMessage = async () => {
    if (!chatInput.trim() || !myGroupId) return;
    const data = {
      groupId: myGroupId,
      senderId: user?.studentId || user?.id || 0,
      senderName: user?.name || 'Student',
      senderRole: 'student',
      message: chatInput,
    };
    console.log('📤 Student sending:', data);
    
    // Clear input immediately for snappy UX
    setChatInput('');
    
    try {
      await sendChatMessageApi(data);
      // Re-fetch chat history to show the newly sent message
      const history = await fetchChatMessagesApi(myGroupId);
      setChatMessages(Array.isArray(history) ? history : []);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Fetch Evaluation Phases for Document Upload and Marks
  useEffect(() => {
    if ((activeView === "documents" || activeView === "marks") && myGroupId) {
      const fetchPhasesAndData = async () => {
        setEvalPhasesLoading(true);
        setEvalPhasesError("");
        try {
          const data = await fetchEvaluationPhasesApi(myGroupId);
          const phasesData = Array.isArray(data) ? data : (data.phases || data.data || []);
          setEvalPhases(phasesData);
          
          if (activeView === "documents") {
            // Fetch document status for each phase
            const statusMap = {};
            await Promise.all(phasesData.map(async (phase) => {
              const pId = phase.id || phase.phaseId || phase._id;
              if (pId) {
                try {
                  const docData = await fetchViewDocumentApi(myGroupId, pId);
                  if (docData && (docData.documentUrl || docData.fileName)) {
                    statusMap[pId] = { isSubmitted: true, ...docData };
                  }
                } catch (e) {}
              }
            }));
            setDocumentStatus(statusMap);
          } else if (activeView === "marks") {
            // Fetch marks for each phase
            setMarksLoading(true);
            const marksMap = {};
            await Promise.all(phasesData.map(async (phase) => {
              const pId = phase.id || phase.phaseId || phase._id;
              if (pId) {
                try {
                  const marksData = await fetchMarksApi(myGroupId, pId);
                  if (marksData && marksData.success) {
                    marksMap[pId] = marksData;
                  }
                } catch (e) {}
              }
            }));
            setStudentMarks(marksMap);
            setMarksLoading(false);
          }
        } catch (err) {
          setEvalPhasesError("Network error or failed to fetch.");
        } finally {
          setEvalPhasesLoading(false);
        }
      };
      fetchPhasesAndData();
    }
  }, [activeView, myGroupId]);

  const handleDocumentSubmit = async (phaseId) => {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }
    if (!githubUrls[phaseId] || !githubUrls[phaseId].trim()) {
      alert("GitHub link is required.");
      return;
    }
    setUploadingPhase(phaseId);
    const formDataObj = new FormData();
    formDataObj.append("file", selectedFile);
    formDataObj.append("githubLink", githubUrls[phaseId].trim());
    
    try {
      const studentId = user?.studentId || user?.id || 0;
      await submitDocumentApi(myGroupId, phaseId, studentId, formDataObj);
      alert("Document submitted successfully!");
      setDocumentStatus(prev => ({ ...prev, [phaseId]: { isSubmitted: true } }));
      setSelectedFile(null);
      document.getElementById(`file-upload-${phaseId}`).value = "";
    } catch (err) {
      alert(err.message || "Network error.");
    } finally {
      setUploadingPhase(null);
    }
  };

  const fetchMyProposal = async () => {
    if (!user?.studentId) {
      console.log('<XCircle className="inline-icon" size={18} /> No studentId found on user object:', user);
      return;
    }
    console.log('<Search className="inline-icon" size={18} /> Fetching dashboard for studentId:', user.studentId);

    try {
      setProposalLoading(true);
      const dashboardData = await fetchStudentDashboardApi(user.studentId);
      console.log('<Search className="inline-icon" size={18} /> Dashboard data:', dashboardData);

      // Set proposal (works for all students via proposalId lock)
      if (dashboardData.hasProposal && dashboardData.data) {
        setExistingProposal({
          ...dashboardData.data,
          supervisorName: dashboardData.supervisorName
        });
      } else {
        setExistingProposal(null);
      }

      // <CheckCircle className="inline-icon" size={18} /> Set groupId from dashboard response (no separate API call needed)
      if (dashboardData.groupId) {
        setMyGroupId(dashboardData.groupId);
        console.log('<CheckCircle className="inline-icon" size={18} /> GroupId set from dashboard:', dashboardData.groupId);
      }
    } catch (err) {
      console.log('<XCircle className="inline-icon" size={18} /> Error fetching dashboard:', err);
      setExistingProposal(null);
    } finally {
      setProposalLoading(false);
    }
  };

  const fetchSupervisors = async () => {
    try {
      setSupervisorsLoading(true);
      const domain = existingProposal?.domain || "";
      const data = await fetchSupervisorsApi(domain);
      setAvailableSupervisors(data);
      setShowSupervisors(true);
    } catch (err) {
      console.error(err);
      alert("Error fetching supervisors");
    } finally {
      setSupervisorsLoading(false);
    }
  };

  // Fetch my committee
  const fetchMyCommittee = async () => {
    setCommitteeLoading(true);
    setCommitteeError(null);
    try {
      const studentId = user?.studentId;
      if (!studentId) throw new Error('Student ID not found');
      const data = await fetchMyCommitteeApi(studentId);
      setMyCommittee(data);
    } catch (err) {
      setCommitteeError(err.message);
      setMyCommittee(null);
    } finally {
      setCommitteeLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === "ideas") fetchAvailableIdeas();
  }, [activeView]);

  const fetchAvailableIdeas = async () => {
    setIdeasLoading(true);
    setIdeasError("");
    try {
      const data = await fetchAvailableIdeasApi();
      setAvailableIdeas(data);
    } catch (e) {
      setIdeasError(e.message || "Network error fetching ideas");
    } finally {
      setIdeasLoading(false);
    }
  };

  // Search students by name for team member selection
  const searchStudents = async (query) => {
    setMemberSearchQuery(query);
    setShowSearchDropdown(true);
    setMemberSearchLoading(true);
    try {
      const data = await searchStudentsApi(query);
      // Exclude current logged-in student and already selected members
      const filtered = data.filter(s =>
        s.id !== user?.studentId &&
        !selectedTeamMembers.find(m => m.id === s.id)
      );
      setMemberSearchResults(filtered);
    } catch (err) {
      console.error('Student search error:', err);
      setMemberSearchResults([]);
    } finally {
      setMemberSearchLoading(false);
    }
  };

  // Load all students when search box is focused
  const onSearchFocus = () => {
    setShowSearchDropdown(true);
    if (memberSearchResults.length === 0 && !memberSearchLoading) {
      searchStudents('');
    }
  };

  const addTeamMember = (student) => {
    if (selectedTeamMembers.length >= 3) return;
    setSelectedTeamMembers(prev => [...prev, { id: student.id, name: student.user?.name || '', regNo: student.regNo }]);
    setMemberSearchQuery('');
    setMemberSearchResults([]);
  };

  const removeTeamMember = (studentId) => {
    setSelectedTeamMembers(prev => prev.filter(m => m.id !== studentId));
  };

  const handleSelectSupervisor = async (supervisorId) => {
    if (!existingProposal) return;
    try {
      setLoading(true);
      const proposalId = existingProposal.id ?? existingProposal.proposalId;
      console.log('📋 existingProposal full object:', existingProposal);
      console.log('📋 Using proposalId:', proposalId, '| studentId:', user?.studentId, '| supervisorId:', supervisorId);

      if (!proposalId) {
        alert('Cannot send request: proposal ID is missing. Check console for details.');
        setLoading(false);
        return;
      }

      console.log('📤 Sending request payload:', {
        studentId: user?.studentId, proposalId, supervisorId
      });

      const data = await sendSupervisorRequestApi({
        studentId: user?.studentId,
        proposalId,
        supervisorId,
      });

      alert(data.message || 'Supervisor request sent successfully!');
      setSelectedSupervisorId(null);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error sending supervisor request');
    } finally {
      setLoading(false);
    }
  };

  const formatGeminiText = (text) => {
    if (!text) return "";
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^#+\s*(.+)$/gm, '<h4>$1</h4>')
      .replace(/^-\s+(.+)$/gm, '• $1')
      .replace(/\n/g, '<br/>');
  };

  const extractTextFromPdf = async (file) => {
    setPdfExtracting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let allLines = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        // Group items by Y position to detect lines
        const lineMap = new Map();
        for (const item of content.items) {
          if (!item.str || !item.str.trim()) continue;
          const y = Math.round(item.transform[5]);
          if (!lineMap.has(y)) lineMap.set(y, []);
          lineMap.get(y).push(item.str);
        }

        // Sort top-to-bottom (PDF Y is bottom-up, so sort descending)
        const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
        let prevY = null;
        for (const y of sortedYs) {
          const lineText = lineMap.get(y).join(' ').trim();
          if (!lineText) continue;

          // Skip schema/diagram lines (database ERD, table columns, etc.)
          const isSchemaLine =
            /^(int|varchar|text|float|boolean|timestamp|vector|date)\s/i.test(lineText) ||
            /\b(PK|FK|UK)\b/.test(lineText) ||
            /^[A-Z_]{3,}\s*$/.test(lineText) ||            // all-caps table names
            /^\w+\s+(id|name|email)\s*$/.test(lineText) || // short field listings
            (lineText.split(' ').length <= 2 && lineText.length < 20); // too short

          if (isSchemaLine) continue;

          // Insert blank line if Y gap > 20pt (paragraph break)
          if (prevY !== null && (prevY - y) > 20) allLines.push('');
          allLines.push(lineText);
          prevY = y;
        }
        allLines.push(''); // page separator
      }

      const formatted = allLines.join('\n').replace(/\n{3,}/g, '\n\n').trim().substring(0, 3000);

      if (!formatted) {
        alert('Could not extract meaningful text. Please upload a text-based proposal PDF.');
        setFormData(prev => ({ ...prev, description: '' }));
        return;
      }

      setFormData(prev => ({ ...prev, description: formatted }));
    } catch (err) {
      console.error('PDF extraction error:', err);
      setFormData(prev => ({ ...prev, description: '' }));
      alert('Could not extract text from PDF. Please try another file.');
    } finally {
      setPdfExtracting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Only PDF files are allowed");
        return;
      }
      setFormData(prev => ({ ...prev, file, description: '' }));
      setFileName(file.name);
      extractTextFromPdf(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.file || !formData.domain) {
      alert("Please fill all fields and select a file!");
      return;
    }

    setLoading(true);
    const dataObj = new FormData();
    dataObj.append("title", formData.title);
    dataObj.append("description", formData.description);
    dataObj.append("domain", formData.domain);
    dataObj.append("file", formData.file);
    dataObj.append("studentId", String(user?.studentId || ""));

    try {
      const result = await checkSimilarityApi(dataObj);
      console.log("Backend Response:", result);

      const sortedSimilar = (result.similarProjects || []).sort(
        (a, b) => (b.similarities?.weightedSimilarity || 0) - (a.similarities?.weightedSimilarity || 0)
      );

      // Store proposal data from backend (NOT saved to DB yet)
      const newProposal = {
        proposalData: result.proposalData,
        title: result.original.title,
        description: result.proposalData.description,
        scope: result.original.scope,
        modules: result.original.modules,
        fileName: formData.file.name,
        domain: result.proposalData.domain,
        similarProjects: sortedSimilar,
        highestSimilarity: result.highestSimilarity,
      };

      setSubmittedProposal(newProposal);
      setCurrentStep("results");
      setFormData({ title: "", description: "", file: null, domain: "" });
      setFileName("");
    } catch (error) {
      console.error(error);
      alert("Similarity check failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnhance = async () => {
    if (!submittedProposal) return;
    setLoading(true);

    try {
      console.log('Sending to Gemini:', {
        title: submittedProposal.title,
        scope: submittedProposal.scope,
        modules: submittedProposal.modules,
      });

      const result = await enhanceProposalApi({
        title: submittedProposal.title,
        description: submittedProposal.description,
        scope: submittedProposal.scope,
        modules: submittedProposal.modules,
      });

      setEnhancedData(result);
      setCurrentStep("enhancement");
    } catch (error) {
      console.error(error);
      if (error.message === 'QUOTA_EXCEEDED') {
        alert("⏰ AI Enhancement Temporarily Unavailable\n\nThe AI service is experiencing high demand. Please wait a few minutes and try again.\n\nAlternatively, you can:\n• Discard this proposal and revise it manually\n• Wait for the quota to reset and try again");
      } else if (error.message === 'MODEL_UNAVAILABLE') {
        alert("🔧 AI Service Unavailable\n\nThe AI enhancement model is currently unavailable. Please try again later.");
      } else {
        alert("Enhancement failed. Please try again or proceed with your current proposal.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendToCommittee = async () => {
    if (!submittedProposal?.proposalData) return;
    setLoading(true);

    try {
      const payloadToSubmit = {
        ...submittedProposal.proposalData,
        memberRegNos: selectedTeamMembers.map(m => m.regNo),
      };

      await submitToPecApi(payloadToSubmit);

      alert("Proposal sent to Proposal Evaluation Committee!");
      setCurrentStep("form");
      setSubmittedProposal(null);
      setEnhancedData(null);
      setSelectedTeamMembers(user ? [{
        id: user.studentId || user.id,
        name: (user.name || 'Student') + ' (You)',
        regNo: user.email || user.regNo || '',
        isMe: true
      }] : []);
      setMemberSearchQuery('');
      setMemberSearchResults([]);

      await fetchMyProposal();
      console.log('Proposal submitted. Other group members will see status on next load.');

    } catch (error) {
      console.error(error);
      alert("Failed to submit: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToForm = () => {
    setCurrentStep("form");
    setSubmittedProposal(null);
    setEnhancedData(null);
  };

  const highestSimilarity = submittedProposal?.similarProjects?.[0]?.similarities?.weightedSimilarity || 0;
  const isHighSimilarity = highestSimilarity > 60;

  // Check if student can submit new proposal
  const canSubmitProposal = () => {
    if (!existingProposal) return true;
    if (existingProposal.status === 'rejected') return true;
    return false;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: '#6b7280', bg: '#f3f4f6', label: 'Draft' },
      submitted: { color: '#d97706', bg: '#fef3c7', label: 'Under Review' },
      approved: { color: '#059669', bg: '#d1fae5', label: 'Approved' },
      rejected: { color: '#dc2626', bg: '#fee2e2', label: 'Rejected' },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span style={{
        background: config.bg,
        color: config.color,
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
      }}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="app-layout">
      <Sidebar
        activeView={activeView}
        setActiveView={(view) => {
          setActiveView(view);
          if (view === "submit") {
            setCurrentStep("form");
            setSubmittedProposal(null);
            setEnhancedData(null);
          }
        }}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        role="student"
        navItems={[
          { id: "dashboard", label: "Dashboard" },
          { id: "submit", label: "Submit Proposal" },
          { id: "status", label: "Check Status" },
          { id: "ideas", label: "Supervisor Ideas" },
          { id: "templates", label: "Templates" },
          { id: "committee", label: "My Committee" },
          { id: "chat", label: "Chat" },
          ...(myGroupId ? [
            { id: "documents", label: "Document Uploads" },
            { id: "marks", label: "Marks" }
          ] : [])
        ]}
      />

      <main className="main-content">
        {activeView === "dashboard" && (
          <DashboardView
            student={student}
            existingProposal={existingProposal}
            getStatusBadge={getStatusBadge}
            canSubmitProposal={canSubmitProposal}
            setActiveView={setActiveView}
            fetchMyCommittee={fetchMyCommittee}
          />
        )}

        {activeView === "ideas" && (
          <IdeasView
            ideasLoading={ideasLoading}
            ideasError={ideasError}
            availableIdeas={availableIdeas}

          />
        )}

        {activeView === "submit" && (
          <SubmitProposalView
            canSubmitProposal={canSubmitProposal}
            existingProposal={existingProposal}
            setActiveView={setActiveView}
            currentStep={currentStep}
            formData={formData}
            setFormData={setFormData}
            pdfExtracting={pdfExtracting}
            handleFileChange={handleFileChange}
            fileName={fileName}
            handleSubmit={handleSubmit}
            loading={loading}
            submittedProposal={submittedProposal}
            isHighSimilarity={isHighSimilarity}
            highestSimilarity={highestSimilarity}
            handleEnhance={handleEnhance}
            handleBackToForm={handleBackToForm}
            selectedTeamMembers={selectedTeamMembers}
            memberSearchQuery={memberSearchQuery}
            searchStudents={searchStudents}
            onSearchFocus={onSearchFocus}
            setShowSearchDropdown={setShowSearchDropdown}
            showSearchDropdown={showSearchDropdown}
            memberSearchLoading={memberSearchLoading}
            memberSearchResults={memberSearchResults}
            addTeamMember={addTeamMember}
            removeTeamMember={removeTeamMember}
            handleSendToCommittee={handleSendToCommittee}
            enhancedData={enhancedData}
            formatGeminiText={formatGeminiText}
          />
        )}

        {activeView === "status" && (
          <StatusView
            proposalLoading={proposalLoading}
            existingProposal={existingProposal}
            getStatusBadge={getStatusBadge}
            showSupervisors={showSupervisors}
            fetchSupervisors={fetchSupervisors}
            supervisorsLoading={supervisorsLoading}
            availableSupervisors={availableSupervisors}
            selectedSupervisorId={selectedSupervisorId}
            handleSelectSupervisor={handleSelectSupervisor}
            loading={loading}
            setSelectedSupervisorId={setSelectedSupervisorId}
            setActiveView={setActiveView}
          />
        )}

        {activeView === "templates" && <TemplatesView />}

        {activeView === "chat" && (
          <ChatView
            chatLoading={chatLoading}
            chatError={chatError}
            myGroupInfo={myGroupInfo}
            myGroupId={myGroupId}
            chatBoxRef={chatBoxRef}
            chatMessages={chatMessages}
            user={user}
            chatInput={chatInput}
            setChatInput={setChatInput}
            sendStudentMessage={sendStudentMessage}
          />
        )}

        {activeView === "committee" && (
          <MyCommitteeView
            fetchMyCommittee={fetchMyCommittee}
            committeeLoading={committeeLoading}
            committeeError={committeeError}
            myCommittee={myCommittee}
          />
        )}

        {activeView === "documents" && (
          <DocumentsView
            evalPhasesLoading={evalPhasesLoading}
            evalPhasesError={evalPhasesError}
            evalPhases={evalPhases}
            documentStatus={documentStatus}
            setSelectedFile={setSelectedFile}
            githubUrls={githubUrls}
            setGithubUrls={setGithubUrls}
            handleDocumentSubmit={handleDocumentSubmit}
            uploadingPhase={uploadingPhase}
          />
        )}

        {activeView === "marks" && (
          <MarksView
            evalPhasesLoading={evalPhasesLoading}
            marksLoading={marksLoading}
            evalPhasesError={evalPhasesError}
            evalPhases={evalPhases}
            studentMarks={studentMarks}
            collapsedMarksPhases={collapsedMarksPhases}
            setCollapsedMarksPhases={setCollapsedMarksPhases}
          />
        )}
      </main>
    </div>
  );
}
