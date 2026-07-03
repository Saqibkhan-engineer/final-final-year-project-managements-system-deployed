import { useState, useEffect, useRef } from "react";
import React from "react";
import { Sidebar } from "./Sidebar";
import io from "socket.io-client";
import * as pdfjsLib from 'pdfjs-dist';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/* ── Socket singleton ── */
let studentSocket = null;
function getStudentSocket() {
  if (!studentSocket) {
    studentSocket = io("/", { transports: ["websocket", "polling"] });
  }
  return studentSocket;
}

export function StudentDashboard({ user, supervisors, onLogout }) {
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

  // NOTE: Group fetch is now done inside fetchMyProposal() via /api/students/dashboard
  // which returns both proposal data AND groupId in a single call.

  // ── Socket: Join group room as soon as myGroupId is known ──
  useEffect(() => {
    if (!myGroupId) return;
    const s = getStudentSocket();
    const joinRoom = () => {
      s.emit('joinRoom', myGroupId);
      console.log('✅ Student joined group room:', myGroupId);
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
        const msgRes = await fetch(`/api/chat/messages/${myGroupId}`);
        if (msgRes.ok) {
          const history = await msgRes.json();
          setChatMessages(Array.isArray(history) ? history : []);
        }
        
        // Join socket room
        const s = getStudentSocket();
        const joinRoom = () => {
          s.emit('joinRoom', myGroupId);
          console.log('✅ Student joined room:', myGroupId, '| socket id:', s.id);
        };
        
        if (s.connected) {
          joinRoom();
        } else {
          s.once('connect', joinRoom);
        }
        // ❌ REMOVED: s.on('connect', joinRoom) — duplicate listener removed (memory leak fix)
        
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
        console.error('❌ Chat init error:', err);
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
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        // Re-fetch chat history to show the newly sent message
        const res = await fetch(`/api/chat/messages/${myGroupId}`);
        if (res.ok) {
          const history = await res.json();
          setChatMessages(Array.isArray(history) ? history : []);
        }
      }
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
          const res = await fetch(`/api/evaluation/evaluation-form/${myGroupId}`);
          const data = await res.json();
          if (res.ok) {
            const phasesData = Array.isArray(data) ? data : (data.phases || data.data || []);
            setEvalPhases(phasesData);
            
            if (activeView === "documents") {
              // Fetch document status for each phase
              const statusMap = {};
              await Promise.all(phasesData.map(async (phase) => {
                const pId = phase.id || phase.phaseId || phase._id;
                if (pId) {
                  try {
                    const docRes = await fetch(`/api/evaluation/view-document/${myGroupId}/${pId}`);
                    if (docRes.ok) {
                      const docData = await docRes.json();
                      if (docData && (docData.documentUrl || docData.fileName)) {
                        statusMap[pId] = { isSubmitted: true, ...docData };
                      }
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
                    const marksRes = await fetch(`/api/evaluation/marks/${myGroupId}/${pId}`);
                    if (marksRes.ok) {
                      const marksData = await marksRes.json();
                      if (marksData && marksData.success) {
                        marksMap[pId] = marksData;
                      }
                    }
                  } catch (e) {}
                }
              }));
              setStudentMarks(marksMap);
              setMarksLoading(false);
            }
          } else {
            setEvalPhasesError(data.message || "Failed to fetch phases.");
          }
        } catch (err) {
          setEvalPhasesError("Network error.");
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
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("githubLink", githubUrls[phaseId].trim());
    
    try {
      const studentId = user?.studentId || user?.id || 0;
      const res = await fetch(`/api/evaluation/submit-document/${myGroupId}/${phaseId}/${studentId}`, {
        method: "POST",
        body: formData,
      });
      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch (e) {}
      
      if (res.ok) {
        alert("Document submitted successfully!");
        setDocumentStatus(prev => ({ ...prev, [phaseId]: { isSubmitted: true } }));
        setSelectedFile(null);
        document.getElementById(`file-upload-${phaseId}`).value = "";
      } else {
        alert(data.message || "Failed to submit document.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setUploadingPhase(null);
    }
  };

  // =========================================================================
  // fetchMyProposal — FIXED
  // Ab /api/students/dashboard use karta hai jo:
  //   1. Teeno students (leader + members) ka proposal dikhata hai
  //   2. groupId bhi return karta hai (ek hi call mein sab)
  // =========================================================================
  const fetchMyProposal = async () => {
    if (!user?.studentId) {
      console.log('❌ No studentId found on user object:', user);
      return;
    }
    console.log('🔍 Fetching dashboard for studentId:', user.studentId);

    try {
      setProposalLoading(true);
      // ✅ FIXED: Correct endpoint — works for all students (leader + members)
      const res = await fetch(`/api/students/dashboard?studentId=${user.studentId}`);
      console.log('🔍 Dashboard fetch status:', res.status);

      if (res.ok) {
        const dashboardData = await res.json();
        console.log('🔍 Dashboard data:', dashboardData);

        // Set proposal (works for all students via proposalId lock)
        if (dashboardData.hasProposal && dashboardData.data) {
          setExistingProposal(dashboardData.data);
        } else {
          setExistingProposal(null);
        }

        // ✅ Set groupId from dashboard response (no separate API call needed)
        if (dashboardData.groupId) {
          setMyGroupId(dashboardData.groupId);
          console.log('✅ GroupId set from dashboard:', dashboardData.groupId);
        }
      } else {
        console.log('🔍 Dashboard fetch failed with status:', res.status);
        setExistingProposal(null);
      }
    } catch (err) {
      console.log('❌ Error fetching dashboard:', err);
      setExistingProposal(null);
    } finally {
      setProposalLoading(false);
    }
  };

  const fetchSupervisors = async () => {
    try {
      setSupervisorsLoading(true);
      const domain = existingProposal?.domain || "";
      const res = await fetch(`/api/supervisor/all?domain=${encodeURIComponent(domain)}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSupervisors(data);
        setShowSupervisors(true);
      } else {
        alert("Failed to load supervisors");
      }
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
      const res = await fetch(`/api/students/my-committee/${studentId}`);
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(data?.message || 'Failed to fetch committee');
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
      const res = await fetch(`/api/ideas/students/available`);
      if (res.ok) {
        const data = await res.json();
        setAvailableIdeas(data);
      } else {
        const err = await res.json();
        setIdeasError(err.message || "Failed to fetch ideas");
      }
    } catch (e) {
      setIdeasError("Network error fetching ideas");
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
      // Try both possible API paths
      const url = query.trim()
        ? `/api/supervisor/students/search?name=${encodeURIComponent(query)}`
        : `/api/supervisor/students/search`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Exclude current logged-in student and already selected members
        const filtered = data.filter(s =>
          s.id !== user?.studentId &&
          !selectedTeamMembers.find(m => m.id === s.id)
        );
        setMemberSearchResults(filtered);
      } else {
        setMemberSearchResults([]);
      }
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

      const res = await fetch('/api/supervisor/send-supervisor-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user?.studentId,
          proposalId,
          supervisorId,
        }),
      });

      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (e) {}

      if (res.ok) {
        alert(data.message || 'Supervisor request sent successfully!');
        setSelectedSupervisorId(null);
      } else {
        alert((data && data.message) || data.error || 'Failed to send request. ' + text);
      }
    } catch (err) {
      console.error(err);
      alert('Error sending supervisor request');
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
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("domain", formData.domain);
    data.append("file", formData.file);
    data.append("studentId", String(user?.studentId || ""));

    try {
      // Call check-similarity endpoint - does NOT save to DB
      const res = await fetch("/api/proposal/check-similarity", {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      console.log("Backend Response:", result);

      // Check for error response (from Flask validation or other errors)
      if (result.success === false || result.error) {
        const errorMessage = result.error || "Failed to process document";
        alert("❌ Document Error:\n\n" + errorMessage);
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error("Failed to check similarity");

      const sortedSimilar = (result.similarProjects || []).sort(
        (a, b) => (b.similarities?.weightedSimilarity || 0) - (a.similarities?.weightedSimilarity || 0)
      );

      // Store proposal data from backend (NOT saved to DB yet)
      const newProposal = {
        // proposalData contains everything needed to save later
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
      alert("❌ Similarity check failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnhance = async () => {
    if (!submittedProposal) return;
    setLoading(true);

    try {
      // Send the text data from AI server (5000) to Gemini for enhancement
      // This text was stored in submittedProposal after similarity check
      console.log('Sending to Gemini:', {
        title: submittedProposal.title,
        scope: submittedProposal.scope,
        modules: submittedProposal.modules,
      });

      const res = await fetch("/api/proposal/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: submittedProposal.title,
          description: submittedProposal.description,
          // Pass the scope and modules text from AI server (5000)
          scope: submittedProposal.scope,
          modules: submittedProposal.modules,
        }),
      });

      if (!res.ok) {
        // Try to get error details from response
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.message || '';

        // Check for quota/rate limit errors
        if (errorMsg.includes('QUOTA_EXCEEDED') || errorMsg.includes('429') || errorMsg.includes('quota')) {
          alert("⏰ AI Enhancement Temporarily Unavailable\n\nThe AI service is experiencing high demand. Please wait a few minutes and try again.\n\nAlternatively, you can:\n• Discard this proposal and revise it manually\n• Wait for the quota to reset and try again");
          return;
        }

        // Check for model unavailable
        if (errorMsg.includes('MODEL_UNAVAILABLE') || errorMsg.includes('404')) {
          alert("🔧 AI Service Unavailable\n\nThe AI enhancement model is currently unavailable. Please try again later.");
          return;
        }

        throw new Error("Enhancement failed");
      }

      const result = await res.json();
      setEnhancedData(result);
      setCurrentStep("enhancement");

      // Text is now used - will be discarded when user takes next action
    } catch (error) {
      console.error(error);
      alert("❌ Enhancement failed. Please try again or proceed with your current proposal.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendToCommittee = async () => {
    if (!submittedProposal?.proposalData) return;
    setLoading(true);

    try {
      // Add memberRegNos array to the submitted proposal payload
      const payloadToSubmit = {
        ...submittedProposal.proposalData,
        memberRegNos: selectedTeamMembers.map(m => m.regNo),
      };

      // Send full proposal data to submit-to-pec endpoint - THIS saves to DB
      const res = await fetch("/api/pec/submit-to-pec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadToSubmit),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit to PEC");
      }

      alert("✅ Proposal sent to Proposal Evaluation Committee!");
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

      // ✅ FIXED: Re-fetch dashboard (gets updated proposal + groupId in one call)
      await fetchMyProposal();

      // 📡 NOTE: proposal_submitted socket event is only relevant AFTER supervisor
      // accepts and group is created. At proposal submission time, no group exists yet.
      // Group members will see updated status when THEY also call fetchMyProposal()
      // (triggered by their own proposalId being locked in the DB).
      console.log('✅ Proposal submitted. Other group members will see status on next load.');

    } catch (error) {
      console.error(error);
      alert("❌ Failed to submit: " + error.message);
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
        {/* Dashboard View */}
        {activeView === "dashboard" && (
          <div className="dashboard-home">
            {/* Welcome Banner */}
            <div className="welcome-banner">
              <h1>Welcome back, {student.name}</h1>
              <p>Track your FYP progress and manage your proposals.</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">P</div>
                <div className="stat-info">
                  <p className="stat-label">Proposal Status</p>
                  <p className="stat-value">
                    {existingProposal ? getStatusBadge(existingProposal.status) : 'Not Submitted'}
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">%</div>
                <div className="stat-info">
                  <p className="stat-label">Similarity Score</p>
                  <p className="stat-value">
                    {existingProposal?.highestSimilarity
                      ? `${existingProposal.highestSimilarity}%`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">S</div>
                <div className="stat-info">
                  <p className="stat-label">Supervisor</p>
                  <p className="stat-value">
                    {existingProposal?.status === 'approved' ? 'Select Now' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="section-card">
              <h3 className="section-title">Quick Actions</h3>
              <div className="action-buttons">
                <button
                  className="action-btn-new primary"
                  onClick={() => setActiveView("submit")}
                  disabled={!canSubmitProposal()}
                >
                  <span>Submit Proposal</span>
                </button>
                <button
                  className="action-btn-new"
                  onClick={() => setActiveView("status")}
                >
                  <span>Check Status</span>
                </button>
                <button
                  className="action-btn-new"
                  onClick={() => setActiveView("templates")}
                >
                  <span>Download Templates</span>
                </button>
                <button
                  className="action-btn-new"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                  onClick={() => { setActiveView('committee'); fetchMyCommittee(); }}
                >
                  <span>🏛️ View My Committee</span>
                </button>
              </div>
            </div>

            {/* Student Info */}
            <div className="section-card">
              <h3 className="section-title">Your Profile</h3>
              <div className="profile-grid">
                <div className="profile-item">
                  <span className="profile-label">Name</span>
                  <span className="profile-value">{student.name}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Email</span>
                  <span className="profile-value">{student.email}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Program</span>
                  <span className="profile-value">{student.program}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Semester</span>
                  <span className="profile-value">{student.semester}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ IDEAS VIEW ═══════════════ */}
        {activeView === "ideas" && (
          <div className="ideas-container">
            <div className="welcome-banner" style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💡 Supervisor Ideas</h1>
              <p>Explore project ideas posted by faculty members that are available for you to work on.</p>
            </div>

            {ideasLoading ? (
              <div className="center-state">
                <div className="loading-spinner-lg" />
                <p>Loading available ideas...</p>
              </div>
            ) : ideasError ? (
              <div className="center-state">
                <div className="state-icon">⚠️</div>
                <h3 style={{ color: '#dc2626' }}>{ideasError}</h3>
              </div>
            ) : availableIdeas.length === 0 ? (
              <div className="center-state" style={{ padding: '3rem', background: '#fff', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <h3 style={{ color: '#64748b' }}>No Ideas Available</h3>
                <p style={{ color: '#94a3b8' }}>Check back later for new project ideas from supervisors.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {availableIdeas.map((idea) => {
                  const supervisorObj = supervisors?.find(s => s.id === idea.supervisorId);
                  const supervisorName = idea.supervisorName || supervisorObj?.user?.name || 'Faculty Member';
                  return (
                  <div key={idea.id} style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#0f172a', lineHeight: '1.4' }}>{idea.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                          {(supervisorName).charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', textTransform: 'capitalize' }}>{supervisorName}</span>
                      </div>
                    </div>
                    <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', flexGrow: 1, whiteSpace: 'pre-wrap' }}>
                      {idea.description}
                    </p>
                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Posted on {new Date(idea.createdAt || Date.now()).toLocaleDateString()}</span>
                      <span style={{ background: '#ecfdf5', color: '#10b981', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>AVAILABLE</span>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Submit Proposal View */}
        {activeView === "submit" && (
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
                        <option value="AI">Artificial Intelligence</option>
                        <option value="Web">Web Development</option>
                        <option value="Mobile">Mobile Development</option>
                        <option value="Cyber">Cybersecurity</option>
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
        )}

        {/* Check Status View */}
        {activeView === "status" && (
          <div className="status-container">
            <div className="section-card">
              <h2 className="section-title">Proposal Status</h2>

              {proposalLoading ? (
                <div className="loading-state">
                  <span className="spinner"></span>
                  <p>Loading proposal status...</p>
                </div>
              ) : existingProposal ? (
                <div className="status-details">
                  <div className="status-header">
                    <h3>{existingProposal.title}</h3>
                    {getStatusBadge(existingProposal.status)}
                  </div>

                  <div className="status-grid">
                    <div className="status-item">
                      <span className="status-label">Domain</span>
                      <span className="status-value">{existingProposal.domain || 'N/A'}</span>
                    </div>
                    <div className="status-item">
                      <span className="status-label">Similarity Score</span>
                      <span className="status-value">{existingProposal.highestSimilarity || 0}%</span>
                    </div>
                    <div className="status-item">
                      <span className="status-label">Submitted On</span>
                      <span className="status-value">
                        {existingProposal.createdAt
                          ? new Date(existingProposal.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {existingProposal.description && (
                    <div className="status-section">
                      <h4>Description</h4>
                      <p>{existingProposal.description}</p>
                    </div>
                  )}

                  {existingProposal.pecFeedback && (
                    <div className={`feedback-box ${existingProposal.status}`}>
                      <h4>PEC Feedback</h4>
                      <p>{existingProposal.pecFeedback}</p>
                    </div>
                  )}

                  {existingProposal.status === 'approved' && (
                    <div className="supervisor-selection">
                      <h4>Congratulations! Your proposal has been approved.</h4>
                      <p>Please select a supervisor from the available options below:</p>
                      
                      {!showSupervisors ? (
                        <button 
                          className="action-btn-new primary" 
                          onClick={fetchSupervisors}
                          disabled={supervisorsLoading}
                        >
                          {supervisorsLoading ? "Loading Supervisors..." : "Show Available Supervisors"}
                        </button>
                      ) : (
                        <div className="supervisor-grid">
                          {availableSupervisors.length === 0 ? (
                            <p>No supervisors found.</p>
                          ) : (
                            availableSupervisors.map((sup) => (
                              <div key={sup.id} className="supervisor-card">
                                {/* Avatar + Name */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                  <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                                    background: sup.designation?.toLowerCase().includes('prof')
                                      ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                                      : 'linear-gradient(135deg,#3b82f6,#06b6d4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: '1rem', fontWeight: 700,
                                  }}>
                                    {(sup.user?.name || 'S').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <h5 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                                      {sup.user?.name || `Supervisor #${sup.id}`}
                                    </h5>
                                    <span style={{
                                      fontSize: '0.68rem', fontWeight: 600, textTransform: 'capitalize',
                                      color: sup.designation?.toLowerCase().includes('prof') ? '#6366f1' : '#0ea5e9',
                                    }}>
                                      {sup.designation || 'Supervisor'}
                                    </span>
                                  </div>
                                </div>

                                {/* Expertise chips */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                                  {(Array.isArray(sup.expertise) ? sup.expertise : [sup.expertise || 'General']).map((ex, ei) => (
                                    <span key={ei} style={{
                                      fontSize: '0.65rem', fontWeight: 600,
                                      background: '#eff6ff', color: '#2563eb',
                                      border: '1px solid #bfdbfe',
                                      padding: '2px 8px', borderRadius: '10px',
                                    }}>🏷️ {ex}</span>
                                  ))}
                                </div>

                                {selectedSupervisorId === sup.id ? (
                                  <div style={{ marginTop: '10px' }}>
                                    <p style={{ fontSize: '0.8rem', color: '#374151', marginBottom: '8px' }}>
                                      Are you sure you want to request this supervisor?
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                      <button
                                        className="select-btn"
                                        onClick={() => handleSelectSupervisor(sup.id)}
                                        disabled={loading}
                                      >
                                        {loading ? '...' : 'Send Request'}
                                      </button>
                                      <button
                                        className="back-btn"
                                        style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                                        onClick={() => setSelectedSupervisorId(null)}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    className="select-btn"
                                    onClick={() => setSelectedSupervisorId(sup.id)}
                                  >
                                    Select
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {existingProposal.status === 'rejected' && (
                    <div className="resubmit-notice">
                      <p>Your proposal was rejected. You can submit a revised proposal.</p>
                      <button
                        className="action-btn-new primary"
                        onClick={() => setActiveView("submit")}
                      >
                        Submit New Proposal
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">—</div>
                  <h3>No Proposal Submitted</h3>
                  <p>You haven't submitted any proposal yet.</p>
                  <button
                    className="action-btn-new primary"
                    onClick={() => setActiveView("submit")}
                  >
                    Submit Your First Proposal
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Templates View */}
        {activeView === "templates" && (
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
        )}
        {/* Chat View - Dynamic group-based */}
        {activeView === "chat" && (
          <div className="chat-layout">
            {/* Sidebar */}
            <div className="chat-sidebar" style={{ minWidth: '220px', maxWidth: '220px' }}>
              <div className="chat-sidebar-header">
                <span>💬</span>
                <h4>My Chat</h4>
              </div>
              {chatLoading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                  🔄 Loading group...
                </div>
              ) : chatError ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444', fontSize: '0.8rem' }}>
                  {chatError}
                </div>
              ) : (
                <div className="chat-group-item active" style={{ cursor: 'default' }}>
                  <div className="chat-group-avatar" style={{ fontSize: '1.2rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>👨‍🏫</div>
                  <div className="chat-group-info">
                    <p className="chat-group-name">{myGroupInfo?.name || myGroupInfo?.proposal?.title || 'FYP Group Chat'}</p>
                    <p className="chat-group-preview">Group #{myGroupId}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Panel */}
            <div className="chat-panel">
              <div className="chat-panel-header">
                <div className="chat-panel-avatar" style={{ fontSize: '1.2rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>👨‍🏫</div>
                <div>
                  <h4>{myGroupInfo?.name || myGroupInfo?.proposal?.title || 'FYP Group Chat'}</h4>
                  {myGroupId && (
                    <>
                      <span className="chat-online-dot" />
                      <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>Connected · Group #{myGroupId}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="chat-messages-box" ref={chatBoxRef}>
                {chatLoading ? (
                  <div className="chat-no-messages">🔄 Loading chat...</div>
                ) : chatError ? (
                  <div className="chat-no-messages" style={{ color: '#ef4444' }}>{chatError}</div>
                ) : chatMessages.length === 0 ? (
                  <div className="chat-no-messages">No messages yet. Say hello! 👋</div>
                ) : (
                  chatMessages.map((msg, i) => {
                    const isMine = msg.senderName === (user?.name || 'Student');
                    return (
                      <div key={i} className={`chat-bubble-wrap ${isMine ? 'mine' : 'theirs'}`}>
                        {!isMine && <div className="chat-bubble-name">{msg.senderName}</div>}
                        <div className={`chat-bubble ${isMine ? 'bubble-sent' : 'bubble-received'}`}>
                          {msg.message}
                        </div>
                        <div className="chat-bubble-time">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="chat-input-area">
                <input
                  className="chat-text-input"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendStudentMessage()}
                  placeholder={myGroupId ? "Type a message…" : "Join a group to chat..."}
                  disabled={!myGroupId}
                />
                <button className="chat-send-button" onClick={sendStudentMessage} disabled={!myGroupId}>➤</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ MY COMMITTEE VIEW ═══════════════ */}
        {activeView === 'committee' && (
          <div className="dashboard-home">

            {/* Header */}
            <div className="welcome-banner" style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.4rem' }}>🏛️ My Evaluation Committee</h1>
              <p>The committee assigned to evaluate your final year project</p>
            </div>

            <button
              onClick={fetchMyCommittee}
              disabled={committeeLoading}
              style={{
                marginBottom: '1.5rem', padding: '8px 20px',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontWeight: 600, fontSize: '0.85rem', cursor: committeeLoading ? 'not-allowed' : 'pointer',
                opacity: committeeLoading ? 0.7 : 1,
              }}
            >
              {committeeLoading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>

            {/* Loading */}
            {committeeLoading && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6366f1' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⏳</div>
                <p style={{ fontWeight: 600 }}>Fetching your committee...</p>
              </div>
            )}

            {/* Error */}
            {committeeError && !committeeLoading && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#dc2626',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>?</div>
                <p style={{ fontWeight: 600 }}>{committeeError}</p>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                  Committee may not be assigned yet. Please check back later.
                </p>
              </div>
            )}

            {/* Not assigned */}
            {!committeeLoading && !committeeError && !myCommittee && (
              <div style={{
                background: '#f8faff', border: '2px dashed #c7d2fe',
                borderRadius: '16px', padding: '3rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>??</div>
                <h3 style={{ color: '#4338ca', marginBottom: '0.5rem' }}>No Committee Assigned Yet</h3>
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                  Your evaluation committee will be assigned after proposal approval.
                </p>
              </div>
            )}

            {/* Committee Data */}
            {!committeeLoading && myCommittee && (() => {
              const com = myCommittee.committee || myCommittee;
              const members = com.members || [];
              return (
                <div>
                  <div style={{
                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    borderRadius: '16px', padding: '1.25rem 1.5rem',
                    marginBottom: '1.5rem', color: '#fff',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                  }}>
                    <div style={{
                      width: '50px', height: '50px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.6rem',
                    }}>???</div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                        {com.name || 'Evaluation Committee'}
                      </h2>
                      <p style={{ margin: '3px 0 0', fontSize: '0.78rem', opacity: 0.82 }}>
                        {members.length} member{members.length !== 1 ? 's' : ''} � Assigned for your FYP evaluation
                      </p>
                    </div>
                  </div>

                  <div className="section-card">
                    <h3 className="section-title">????? Committee Members</h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                      gap: '1rem',
                    }}>
                      {members.map((m, i) => {
                        const isProf = m.designation?.toLowerCase().includes('prof');
                        return (
                          <div key={i} style={{
                            background: isProf ? '#f5f3ff' : '#f0f9ff',
                            border: `1px solid ${isProf ? '#c4b5fd' : '#bae6fd'}`,
                            borderRadius: '12px', padding: '1rem',
                            display: 'flex', gap: '0.85rem', alignItems: 'flex-start',
                          }}>
                            <div style={{
                              width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                              background: isProf
                                ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                                : 'linear-gradient(135deg,#3b82f6,#06b6d4)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: '1.1rem', fontWeight: 700,
                            }}>
                              {(m.user?.name || 'M').charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>
                                {m.user?.name || `Member #${m.id}`}
                              </p>
                              <p style={{
                                margin: '3px 0', fontSize: '0.72rem', fontWeight: 600,
                                textTransform: 'capitalize',
                                color: isProf ? '#6366f1' : '#0ea5e9',
                              }}>
                                {m.designation || 'Faculty Member'}
                              </p>
                              {m.user?.email && (
                                <p style={{ margin: '3px 0 0', fontSize: '0.68rem', color: '#94a3b8' }}>
                                  ?? {m.user.email}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══════════════ DOCUMENTS VIEW ═══════════════ */}
        {activeView === 'documents' && (
          <div className="dashboard-home">
            <div className="welcome-banner" style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.4rem' }}>📄 Document Uploads</h1>
              <p>Upload your documents for each evaluation phase.</p>
            </div>
            
            {evalPhasesLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6366f1' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⏳</div>
                <p style={{ fontWeight: 600 }}>Fetching evaluation phases...</p>
              </div>
            ) : evalPhasesError ? (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
                <p style={{ fontWeight: 600 }}>{evalPhasesError}</p>
              </div>
            ) : evalPhases.length === 0 ? (
              <div style={{ background: '#f8faff', border: '2px dashed #c7d2fe', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
                <h3 style={{ color: '#4338ca', marginBottom: '0.5rem' }}>No Phases Found</h3>
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>No evaluation phases have been created yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {evalPhases.map((phase, idx) => {
                  const phaseId = phase.id || phase.phaseId || phase._id;
                  const isSubmitted = documentStatus[phaseId]?.isSubmitted;
                  return (
                    <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div>
                        <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b', fontSize: '1.1rem' }}>{phase.name || phase.phaseName || phase.title || `Phase ${idx + 1}`}</h3>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>{phase.description || 'Upload your document for this phase.'}</p>
                      </div>
                      
                      {isSubmitted ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', color: '#059669', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                          <span style={{ fontSize: '1.2rem' }}>✅</span>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Already Submitted</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input 
                            type="file" 
                            id={`file-upload-${phaseId}`}
                            onChange={(e) => setSelectedFile(e.target.files[0])}
                            style={{ fontSize: '0.85rem' }}
                          />
                          <input 
                            type="text" 
                            placeholder="GitHub URL (Required)" 
                            value={githubUrls[phaseId] || ''}
                            onChange={(e) => setGithubUrls(prev => ({...prev, [phaseId]: e.target.value}))}
                            style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '200px' }}
                          />
                          <button 
                            onClick={() => handleDocumentSubmit(phaseId)}
                            disabled={uploadingPhase === phaseId}
                            style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: uploadingPhase === phaseId ? 'not-allowed' : 'pointer' }}
                          >
                            {uploadingPhase === phaseId ? 'Uploading...' : 'Upload'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ MARKS VIEW ═══════════════ */}
        {activeView === 'marks' && (
          <div className="dashboard-home">
            <div className="welcome-banner" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <h1 style={{ fontSize: '1.4rem' }}>📊 Evaluation Marks</h1>
              <p>View your obtained marks for all evaluation phases.</p>
            </div>
            
            {evalPhasesLoading || marksLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#059669' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⏳</div>
                <p style={{ fontWeight: 600 }}>Fetching your marks...</p>
              </div>
            ) : evalPhasesError ? (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
                <p style={{ fontWeight: 600 }}>{evalPhasesError}</p>
              </div>
            ) : evalPhases.length === 0 ? (
              <div style={{ background: '#f0fdf4', border: '2px dashed #a7f3d0', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
                <h3 style={{ color: '#047857', marginBottom: '0.5rem' }}>No Phases Found</h3>
                <p style={{ color: '#064e3b', fontSize: '0.88rem' }}>Evaluation phases have not been set up yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {evalPhases.filter(phase => {
                  const phaseId = phase.id || phase.phaseId || phase._id;
                  const marksInfo = studentMarks[phaseId];
                  return marksInfo && marksInfo.data && marksInfo.data.length > 0;
                }).map((phase, idx) => {
                  const phaseId = phase.id || phase.phaseId || phase._id;
                  const marksInfo = studentMarks[phaseId];
                  const isCollapsed = collapsedMarksPhases[idx] || false;
                  
                  return (
                    <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      {/* Header */}
                      <div 
                        onClick={() => setCollapsedMarksPhases(prev => ({...prev, [idx]: !prev[idx]}))}
                        style={{ padding: '1.5rem', background: '#f8fafc', borderBottom: isCollapsed ? 'none' : '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', cursor: 'pointer', transition: 'background 0.2s' }}
                      >
                        <div>
                          <h3 style={{ margin: '0 0 0.25rem', color: '#1e293b', fontSize: '1.15rem' }}>
                            {phase.name || phase.phaseName || phase.title || `Phase ${idx + 1}`}
                          </h3>
                          <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {marksInfo?.phaseWeight || phase.weight || 0}% Total Weight
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Evaluator Marks</p>
                              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#334155' }}>
                                {marksInfo.totalRawObtained} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>/ {marksInfo.totalRawMax}</span>
                              </p>
                            </div>
                            <svg width="36" height="36" viewBox="0 0 36 36" style={{marginLeft: '0.75rem', transform: 'rotate(-90deg)'}}>
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray={`${marksInfo.totalRawMax ? (marksInfo.totalRawObtained / marksInfo.totalRawMax) * 100 : 0}, 100`} />
                            </svg>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '1.5rem', borderLeft: '2px solid #e2e8f0' }}>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Weighted Solid Marks</p>
                              <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>
                                {Number(marksInfo.solidMarksObtained).toFixed(2)}
                              </p>
                            </div>
                            <svg width="36" height="36" viewBox="0 0 36 36" style={{marginLeft: '0.75rem', transform: 'rotate(-90deg)'}}>
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray={`${marksInfo.phaseWeight ? (marksInfo.solidMarksObtained / marksInfo.phaseWeight) * 100 : 0}, 100`} />
                            </svg>
                          </div>
                          
                          {/* Collapse Arrow */}
                          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '1rem' }}>
                            <svg 
                              viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                              style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s ease' }}
                            >
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      {/* Body */}
                      {!isCollapsed && (
                        <div style={{ padding: '1.5rem' }}>
                          <div>
                            <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evaluator Breakdown</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {marksInfo.data.map((markItem, mIdx) => (
                              <div key={mIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f1f5f9', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                                <div>
                                  <p style={{ margin: '0 0 0.25rem', fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', textTransform: 'capitalize' }}>
                                    {markItem.evaluator?.user?.name || 'Evaluator'}
                                  </p>
                                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>
                                    Rubric Max Marks: {markItem.rubric?.maxMarks || 0}
                                  </p>
                                  {markItem.feedback && (
                                    <div style={{ marginTop: '0.75rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.75rem' }}>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                        Feedback
                                      </span>
                                      <p style={{ margin: 0, color: '#334155', fontSize: '0.85rem', fontStyle: 'italic', lineHeight: '1.4' }}>
                                        "{markItem.feedback}"
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '6px', textAlign: 'center', minWidth: '80px' }}>
                                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>OBTAINED</span>
                                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563eb' }}>{markItem.marks}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      )}
                    </div>
                  );
                })}
                {evalPhases.filter(phase => {
                  const phaseId = phase.id || phase.phaseId || phase._id;
                  const marksInfo = studentMarks[phaseId];
                  return marksInfo && marksInfo.data && marksInfo.data.length > 0;
                }).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⏳</div>
                    <p style={{ fontWeight: 600 }}>No marks have been uploaded or evaluated yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
