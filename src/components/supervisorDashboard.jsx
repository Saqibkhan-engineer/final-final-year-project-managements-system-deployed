import { useState, useEffect, useRef } from "react";
import React from "react";
import { Sidebar } from "./Sidebar";
import io from "socket.io-client";
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter, ZAxis
} from "recharts";

/* ── Socket.IO singleton (connects once) ── */
let socket = null;
function getSocket() {
  if (!socket) {
    socket = io("/", { transports: ["websocket", "polling"] });
  }
  return socket;
}


export function SupervisorDashboard({ user, supervisors, onLogout, originalRole, onSwitchRole }) {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInPecCommittee, setIsInPecCommittee] = useState(false);

  // Resolve the supervisor's own ID from the login response.
  // Backend must return supervisorId in the user payload (auth.service.ts → signIn).
  const resolvedSupervisorId = user?.supervisorId ?? user?.supervisorid ?? null;

  // Debug: log the user object so you can verify field names in the console
  useEffect(() => {
    console.log("🔍 Supervisor user object:", JSON.stringify(user, null, 2));
    if (!resolvedSupervisorId) {
      console.error("❌ supervisorId is missing from login response! Check auth.service.ts → signIn method.");
    } else {
      console.log("✅ Resolved supervisorId:", resolvedSupervisorId);
    }
  }, [user]);

  // ── Requests state ──
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  // ── Groups state ──
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState("");
  const [addingRepoFor, setAddingRepoFor] = useState(null);
  const [repoForm, setRepoForm] = useState({ repoUrl: "" });
  const [checkingPerf, setCheckingPerf] = useState({});
  const [performanceData, setPerformanceData] = useState({});
  const [groupRepos, setGroupRepos] = useState({}); // { [groupId]: repoUrl }
  const [fetchingRepo, setFetchingRepo] = useState({}); // { [groupId]: bool }
  const [repoError, setRepoError] = useState({}); // { [groupId]: error string }
  const [perfError, setPerfError] = useState({}); // { [groupId]: error string }

  // GitHub PAT from environment
  const GITHUB_PAT = import.meta.env.VITE_GITHUB_PAT;

  // ── Evaluation Groups state ──
  const [evalGroups, setEvalGroups] = useState([]);
  const [evalGroupsLoading, setEvalGroupsLoading] = useState(false);
  const [evalGroupsError, setEvalGroupsError] = useState("");

  // ── Evaluate Form Modal state ──
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [evalSelectedGroupId, setEvalSelectedGroupId] = useState(null);
  const [evalFormData, setEvalFormData] = useState(null);
  const [evalFormLoading, setEvalFormLoading] = useState(false);
  const [evalFormError, setEvalFormError] = useState("");
  const [evalSelectedPhase, setEvalSelectedPhase] = useState(null);
  const [rubricScores, setRubricScores] = useState({});
  const [phaseFeedback, setPhaseFeedback] = useState("");
  const [submittingMarks, setSubmittingMarks] = useState(false);
  const [evaluatingRole, setEvaluatingRole] = useState(null); // 'supervisor' or 'committee'
  const [phaseLockStatus, setPhaseLockStatus] = useState(null);
  const [allPhasesStatus, setAllPhasesStatus] = useState({});
  const [phaseDocument, setPhaseDocument] = useState(null);
  const [phaseExistingMarks, setPhaseExistingMarks] = useState({});

  // Speech Recognition State
  const [isMicActive, setIsMicActive] = useState(false);
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  useEffect(() => {
    if (listening && isMicActive) {
      setPhaseFeedback(transcript);
    }
  }, [transcript, listening, isMicActive]);

  // ── Chat state ──
  const [selectedChatGroupId, setSelectedChatGroupId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBoxRef = useRef(null);

  // ── Ideas state ──
  const [ideas, setIdeas] = useState([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasError, setIdeasError] = useState("");
  const [newIdeaTitle, setNewIdeaTitle] = useState("");
  const [newIdeaDescription, setNewIdeaDescription] = useState("");
  const [postingIdea, setPostingIdea] = useState(false);
  // ── Fetch requests & check PEC on mount ──
  useEffect(() => {
    if (resolvedSupervisorId) {
      fetchRequests();
      checkPecCommitteeStatus();
    }
  }, [resolvedSupervisorId]);

  const checkPecCommitteeStatus = async () => {
    try {
      const res = await fetch(`/api/pec/check-supervisor/${resolvedSupervisorId}`);
      if (res.ok) {
        const data = await res.json();
        setIsInPecCommittee(data.inCommittee);
      }
    } catch (e) {
      console.error("Failed to check PEC status:", e);
    }
  };

  // ── Fetch groups when tab activates ──
  useEffect(() => {
    if (activeView === "groups" || activeView === "github") fetchGroups();
    if (activeView === "committee") fetchEvalGroups();
    if (activeView === "ideas") fetchIdeas();
  }, [activeView]);

  const fetchIdeas = async () => {
    if (!resolvedSupervisorId) return;
    setIdeasLoading(true);
    setIdeasError("");
    try {
      const res = await fetch(`/api/ideas/supervisor/${resolvedSupervisorId}`);
      if (res.ok) {
        const data = await res.json();
        setIdeas(data);
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

  const handlePostIdea = async () => {
    if (!newIdeaTitle.trim() || !newIdeaDescription.trim()) {
      alert("Title and description are required.");
      return;
    }
    setPostingIdea(true);
    try {
      const res = await fetch(`/api/ideas/supervisor/${resolvedSupervisorId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newIdeaTitle, description: newIdeaDescription })
      });
      if (res.ok) {
        setNewIdeaTitle("");
        setNewIdeaDescription("");
        fetchIdeas(); // refresh list
      } else {
        const err = await res.json();
        alert(err.message || "Failed to post idea.");
      }
    } catch (e) {
      alert("Network error while posting idea.");
    } finally {
      setPostingIdea(false);
    }
  };

  // ── Socket.IO for chat ──
  useEffect(() => {
    if (activeView !== 'chat') return;
    // Fetch groups when chat tab opens so supervisor can pick one
    if (resolvedSupervisorId) fetchGroups();
  }, [activeView]);

  // Load messages when a group is selected
  useEffect(() => {
    if (!selectedChatGroupId) return;
    const s = getSocket();
    
    const loadMessages = async () => {
      setChatLoading(true);
      try {
        const res = await fetch(`/api/chat/messages/${selectedChatGroupId}`);
        if (res.ok) {
          const history = await res.json();
          setChatMessages(Array.isArray(history) ? history : []);
        }
      } catch (e) {
        console.error('❌ History fetch error:', e);
      } finally {
        setChatLoading(false);
      }
    };
    loadMessages();

    // Join socket room
    const joinRoom = () => {
      s.emit('joinRoom', selectedChatGroupId);
      console.log('✅ Supervisor joined room:', selectedChatGroupId, '| socket id:', s.id);
    };

    if (s.connected) {
      joinRoom();
    } else {
      s.once('connect', joinRoom);
    }
    s.on('connect', joinRoom);

    const handleMsg = (msg) => {
      console.log('📬 Supervisor receiveMessage:', msg);
      setChatMessages(prev => [...prev, msg]);
    };
    s.on('receiveMessage', handleMsg);

    return () => {
      s.off('receiveMessage', handleMsg);
      s.off('connect', joinRoom);
    };
  }, [selectedChatGroupId]);

  // Auto-scroll
  useEffect(() => {
    if (chatBoxRef.current)
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [chatMessages]);

  // Send message
  const sendChatMessage = async () => {
    if (!chatInput.trim() || !selectedChatGroupId) return;
    const data = {
      groupId: selectedChatGroupId,
      senderId: user?.id || 0,
      senderName: user?.name || 'Supervisor',
      senderRole: 'supervisor',
      message: chatInput,
    };
    console.log('📤 Supervisor sending:', data);
    
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
        const res = await fetch(`/api/chat/messages/${selectedChatGroupId}`);
        if (res.ok) {
          const history = await res.json();
          setChatMessages(Array.isArray(history) ? history : []);
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  /* ── API: Fetch Requests ── */
  const fetchRequests = async () => {
    setRequestsLoading(true);
    setRequestsError("");
    // Backend controller: GET requests/:supervisorId  (proxied via /api/supervisor/requests/:supervisorId)
    const url = `/api/supervisor/requests/${resolvedSupervisorId}`;
    console.log("📡 Fetching requests from:", url);
    try {
      const res = await fetch(url);
      console.log("📡 Response status:", res.status);
      const text = await res.text();
      console.log("📡 Raw response body:", text);
      if (res.ok) {
        const data = text ? JSON.parse(text) : [];
        console.log("✅ Parsed requests:", data);
        setRequests(Array.isArray(data) ? data : []);
      } else {
        console.error("❌ API error:", res.status, text);
        setRequestsError(`Failed to load requests (${res.status}).`);
      }
    } catch (err) {
      console.error("❌ Network error:", err);
      setRequestsError("Cannot reach server.");
    } finally {
      setRequestsLoading(false);
    }
  };

  /* ── API: Accept Request ── */
  // Backend: PATCH accept-request/:id
  // Returns: { message: 'Request accepted, group created successfully', group }
  // Side effect: backend also creates a group record — so we refresh groups after accept
  const handleAcceptRequest = async (requestId) => {
    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/supervisor/accept-request/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (e) { }

      if (res.ok) {
        // Remove from pending requests list
        setRequests((prev) => prev.filter((r) => r.id !== requestId));

        // Backend created a group — refresh groups list so Groups tab is up to date
        fetchGroups();

        // Show the backend's message (includes group info)
        const groupInfo = data.group
          ? `\nGroup ID: ${data.group.id} | Students: ${(data.group.studentRegs || []).join(", ") || "—"}`
          : "";
        alert(`✅ ${data.message || "Request accepted, group created successfully!"}${groupInfo}`);
      } else {
        alert(data.message || data.error || `Failed to accept request (${res.status}).`);
      }
    } catch (err) {
      console.error("❌ Accept request error:", err);
      alert("Server error. Try again.");
    } finally {
      setActionLoading(null);
    }
  };

  /* ── API: Reject Request ── */
  const handleRejectRequest = async (requestId) => {
    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/supervisor/reject-request/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        alert("Request declined.");
      } else {
        // Fallback: remove locally if no API exists
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      }
    } catch {
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } finally {
      setActionLoading(null);
    }
  };

  /* ── API: Fetch Groups ── */
  const fetchGroups = async () => {
    if (!resolvedSupervisorId) return;
    setGroupsLoading(true);
    setGroupsError("");
    try {
      const res = await fetch(`/api/groups/my-groups/${resolvedSupervisorId}`);
      const data = await res.json();
      if (res.ok) {
        const loadedGroups = Array.isArray(data) ? data : (data.groups || []);
        setGroups(loadedGroups);
        // Pre-seed groupRepos from existing group data, then fetch fresh from backend
        const seedRepos = {};
        loadedGroups.forEach(g => {
          const gId = g.id || g._id;
          if (g.repoUrl) seedRepos[gId] = g.repoUrl;
        });
        setGroupRepos(prev => ({ ...prev, ...seedRepos }));
        // Also fetch fresh from backend endpoint for each group
        loadedGroups.forEach(g => {
          const gId = g.id || g._id;
          if (gId) fetchGroupRepo(gId);
        });
      } else {
        setGroupsError(data.message || "Failed to fetch groups.");
      }
    } catch {
      setGroupsError("Network error. Could not reach server.");
    } finally {
      setGroupsLoading(false);
    }
  };

  /* ── API: Fetch Evaluation Groups ── */
  const fetchEvalGroups = async () => {
    if (!resolvedSupervisorId) return;
    setEvalGroupsLoading(true);
    setEvalGroupsError("");
    try {
      const res = await fetch(`/api/groups/my-evaluation-groups/${resolvedSupervisorId}`);
      const data = await res.json();
      if (res.ok) {
        setEvalGroups(Array.isArray(data) ? data : (data.groups || []));
      } else {
        setEvalGroupsError(data.message || "Failed to fetch evaluation groups.");
      }
    } catch {
      setEvalGroupsError("Network error. Could not reach server.");
    } finally {
      setEvalGroupsLoading(false);
    }
  };

  /* ── API: Fetch Evaluation Form ── */
  const handleOpenEvaluate = async (groupId, role = 'committee') => {
    setEvaluatingRole(role);
    setPhaseLockStatus(null);
    setEvalSelectedGroupId(groupId);
    setEvalModalOpen(true);
    setEvalFormLoading(true);
    setEvalFormError("");
    setEvalFormData(null);
    setEvalSelectedPhase(null);
    try {
      const res = await fetch(`/api/evaluation/evaluation-form/${groupId}`);
      const data = await res.json();
      if (res.ok) {
        setEvalFormData(data);
        const phasesData = Array.isArray(data) ? data : (data.phases || data.data || []);
        const statusMap = {};
        await Promise.all(phasesData.map(async (phase) => {
          const pId = phase.id || phase.phaseId || phase._id;
          if (pId) {
            try {
              const sRes = await fetch(`/api/evaluation/status/${groupId}/${pId}`);
              if (sRes.ok) {
                statusMap[pId] = await sRes.json();
              }
            } catch (e) {}
          }
        }));
        setAllPhasesStatus(statusMap);
      } else {
        setEvalFormError(data.message || "Failed to fetch evaluation form.");
      }
    } catch (err) {
      setEvalFormError("Network error. Could not reach server.");
    } finally {
      setEvalFormLoading(false);
    }
  };

  const handleSelectPhase = async (phase) => {
    setEvalSelectedPhase(phase);
    setPhaseLockStatus(null);
    setRubricScores({});
    setPhaseFeedback("");
    setIsMicActive(false);
    if (listening) {
      SpeechRecognition.stopListening();
    }
    setPhaseDocument(null);
    setPhaseExistingMarks({});
    
    // Fetch lock status from backend
    try {
      const phaseId = phase.id || phase._id || phase.phaseId;
      if (phaseId && evalSelectedGroupId) {
        const res = await fetch(`/api/evaluation/status/${evalSelectedGroupId}/${phaseId}`);
        if (res.ok) {
          const data = await res.json();
          setPhaseLockStatus(data);
          setAllPhasesStatus(prev => ({ ...prev, [phaseId]: data }));
        }
        
        // Fetch document for this phase
        const docRes = await fetch(`/api/evaluation/view-document/${evalSelectedGroupId}/${phaseId}`);
        if (docRes.ok) {
          const docData = await docRes.json();
          if (docData && (docData.documentUrl || docData.fileName || docData.hasSubmitted)) {
            setPhaseDocument(docData);
          }
        }
        
        // Fetch existing marks
        try {
          const marksRes = await fetch(`/api/evaluation/marks/${evalSelectedGroupId}/${phaseId}`);
          if (marksRes.ok) {
            const marksData = await marksRes.json();
            if (marksData.success && Array.isArray(marksData.data)) {
              const myMarks = {};
              marksData.data.forEach(item => {
                // Check if evaluator ID matches, using Number() to prevent string/int mismatch
                if (item.evaluator && Number(item.evaluator.id) === Number(resolvedSupervisorId)) {
                  myMarks[item.rubric.id] = item.marks;
                } else if (item.rubric && !myMarks[item.rubric.id]) {
                  // Fallback: If it doesn't strictly match but the rubric has marks, show them
                  myMarks[item.rubric.id] = item.marks;
                }
              });
              setPhaseExistingMarks(myMarks);
            }
          }
        } catch (e) {
          console.error("Failed to fetch existing marks", e);
        }
      }
    } catch (e) {
      console.error("Failed to fetch phase status or document", e);
    }
  };

  const isPhaseEvaluated = (phase) => {
    if (phase.isEvaluated || phase.isCompleted || phase.isActive === false) return true;
    if (Array.isArray(phase.rubrics)) {
      return phase.rubrics.some(r => (r.obtainedMarks ?? r.score ?? r.givenMarks ?? r.marksObtained) !== undefined);
    }
    return false;
  };

  /* ── API: Submit Phase Marks ── */
  const handleSubmitPhaseMarks = async () => {
    if (!evalSelectedGroupId || !resolvedSupervisorId || !evalSelectedPhase) return;

    const rubrics = Array.isArray(evalSelectedPhase.rubrics) ? evalSelectedPhase.rubrics : [];

    // Filter out empty scores
    const validEntries = Object.entries(rubricScores).filter(([_, marks]) => marks !== "" && marks !== undefined);

    if (validEntries.length === 0) {
      alert("Please enter marks for at least one rubric before submitting.");
      return;
    }

    // Validation & Array Building
    const scoresArray = [];
    let isFirstValid = true;
    for (const [rIdxStr, marks] of validEntries) {
      const rIdx = Number(rIdxStr);
      const rubric = rubrics[rIdx];
      if (rubric) {
        const maxMarks = Number(rubric.maxMarks || rubric.marks || rubric.totalMarks || 100);
        if (Number(marks) > maxMarks || Number(marks) < 0) {
          alert(`Error: Marks for "${rubric.name || rubric.rubricName || rubric.title || 'Rubric'}" cannot exceed its maximum marks (${maxMarks}) or be negative.`);
          return;
        }
        scoresArray.push({
          rubricId: Number(rubric.id || rubric._id || rubric.rubricId || 0),
          marks: Number(marks),
          feedback: isFirstValid ? phaseFeedback : ""
        });
        isFirstValid = false;
      }
    }

    setSubmittingMarks(true);
    try {
      const phaseId = evalSelectedPhase.id || evalSelectedPhase._id || evalSelectedPhase.phaseId;
      if (phaseId === undefined || phaseId === null) {
        alert("Error: Phase ID is missing. Cannot submit marks to the server.");
        setSubmittingMarks(false);
        return;
      }

      const endpoint = evaluatingRole === 'supervisor' 
        ? `/api/evaluation/submit/supervisor/${evalSelectedGroupId}/${resolvedSupervisorId}/${phaseId}`
        : `/api/evaluation/submit/committee/${evalSelectedGroupId}/${resolvedSupervisorId}/${phaseId}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: scoresArray })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert(data.message || "Marks submitted successfully!");
        handleSelectPhase(evalSelectedPhase); // Refresh the status to lock UI
      } else {
        alert(data.message || data.error || "Failed to submit marks.");
      }
    } catch (err) {
      alert("Network error. Could not reach server.");
    } finally {
      setSubmittingMarks(false);
    }
  };

  /* ── API: Fetch Repo URL from backend ── */
  const fetchGroupRepo = async (groupId) => {
    setFetchingRepo(prev => ({ ...prev, [groupId]: true }));
    setRepoError(prev => ({ ...prev, [groupId]: '' }));
    try {
      const res = await fetch(`/api/groups/repo/${groupId}`);
      const data = await res.json().catch(() => ({}));
      const url = data.repoUrl || data.repo_url || data.url || data.githubUrl || null;
      if (res.ok && url) {
        setGroupRepos(prev => ({ ...prev, [groupId]: url }));
      } else {
        setGroupRepos(prev => ({ ...prev, [groupId]: null }));
        setRepoError(prev => ({ ...prev, [groupId]: data.message || 'No repository linked yet.' }));
      }
    } catch (err) {
      setGroupRepos(prev => ({ ...prev, [groupId]: null }));
      setRepoError(prev => ({ ...prev, [groupId]: 'Could not reach server.' }));
    } finally {
      setFetchingRepo(prev => ({ ...prev, [groupId]: false }));
    }
  };

  /* ── API: Save Repo URL to backend ── */
  const handleUpdateRepo = async (groupId) => {
    if (!repoForm.repoUrl) {
      alert("Please enter a Repository URL.");
      return;
    }
    try {
      const res = await fetch(`/api/groups/update-repo/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoForm.repoUrl, githubUsernames: [] }),
      });
      if (res.ok) {
        const savedUrl = repoForm.repoUrl;
        setGroupRepos(prev => ({ ...prev, [groupId]: savedUrl }));
        setGroups(prev => prev.map(g =>
          (g.id || g._id) === groupId ? { ...g, repoUrl: savedUrl } : g
        ));
        setAddingRepoFor(null);
        setRepoForm({ repoUrl: '' });
        // Clear any old perf data so user sees fresh Evaluate button
        setPerformanceData(prev => { const n = { ...prev }; delete n[groupId]; return n; });
        setPerfError(prev => { const n = { ...prev }; delete n[groupId]; return n; });
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.message || "Failed to update repository.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  /* ── Helper: Parse owner/repo from GitHub URL ── */
  const parseGitHubRepo = (url) => {
    if (!url) return null;
    try {
      const clean = url.replace(/\.git$/, '').replace(/\/$/, '');
      const match = clean.match(/github\.com[/:]([^/]+)\/([^/]+)/);
      if (match) return { owner: match[1], repo: match[2] };
    } catch (e) { /* ignore */ }
    return null;
  };

  /* ── API: Fetch GitHub Performance via Vite proxy → GitHub API ── */
  const handleCheckPerformance = async (groupId, overrideUrl) => {
    let repoUrl = overrideUrl || groupRepos[groupId] || groups.find(g => (g.id || g._id) === groupId)?.repoUrl || evalGroups.find(g => (g.id || g._id) === groupId)?.repoUrl;
    
    setCheckingPerf(prev => ({ ...prev, [groupId]: true }));
    setPerfError(prev => ({ ...prev, [groupId]: '' }));

    // If repoUrl isn't known, fetch it from backend (especially useful for committee groups)
    if (!repoUrl) {
      try {
        const res = await fetch(`/api/groups/repo/${groupId}`);
        const data = await res.json().catch(() => ({}));
        repoUrl = data.repoUrl || data.repo_url || data.url || data.githubUrl || null;
        if (repoUrl) {
          setGroupRepos(prev => ({ ...prev, [groupId]: repoUrl }));
        }
      } catch (e) {
        // silently ignore, it will fail in the parse step next
      }
    }

    const parsed = parseGitHubRepo(repoUrl);
    if (!parsed) {
      setPerfError(prev => ({ ...prev, [groupId]: 'Invalid or missing GitHub repository URL.' }));
      setCheckingPerf(prev => ({ ...prev, [groupId]: false }));
      return;
    }
    const { owner, repo } = parsed;

    // Use /github-api proxy (Vite forwards to https://api.github.com)
    const BASE = '/github-api';
    const headers = {
      'Authorization': `token ${GITHUB_PAT}`,
      'Accept': 'application/vnd.github+json',
    };

    const ghFetch = async (path) => {
      const res = await fetch(`${BASE}${path}`, { headers });
      if (res.status === 401) throw new Error('GitHub token is invalid or expired (401).');
      if (res.status === 403) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'GitHub API rate limit exceeded (403). Try again later.');
      }
      if (res.status === 404) throw new Error(`Repository not found: ${owner}/${repo}`);
      return res;
    };

    try {
      // 1. Fetch repo info first (fast, validates access)
      const repoInfoRes = await ghFetch(`/repos/${owner}/${repo}`);
      const repoInfo = repoInfoRes.ok ? await repoInfoRes.json() : {};

      // 2. Fetch contributor stats (may return 202 while GitHub computes)
      let contributors = [];
      let contribRes = await ghFetch(`/repos/${owner}/${repo}/stats/contributors`);
      if (contribRes.status === 202) {
        // GitHub is computing stats — wait up to 2 retries
        for (let attempt = 0; attempt < 2; attempt++) {
          await new Promise(r => setTimeout(r, 3500));
          contribRes = await ghFetch(`/repos/${owner}/${repo}/stats/contributors`);
          if (contribRes.status !== 202) break;
        }
      }
      if (contribRes.ok) {
        const raw = await contribRes.json();
        contributors = Array.isArray(raw) ? raw : [];
      }

      // 3. Fetch recent commits (last 30 days), up to 3 pages
      const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const since14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      let allCommits = [];
      for (let page = 1; page <= 3; page++) {
        const cRes = await fetch(
          `${BASE}/repos/${owner}/${repo}/commits?since=${since30}&per_page=100&page=${page}`,
          { headers }
        );
        if (!cRes.ok) break;
        const pageData = await cRes.json();
        if (!Array.isArray(pageData)) break;
        allCommits = [...allCommits, ...pageData];
        if (pageData.length < 100) break;
      }

      // 4. Fetch Issues for Task Burndown (up to 100 recent issues, state=all)
      let allIssues = [];
      const issuesRes = await fetch(`${BASE}/repos/${owner}/${repo}/issues?state=all&per_page=100`, { headers });
      if (issuesRes.ok) {
        allIssues = await issuesRes.json();
      }

      // Process contributors
      const processedContributors = contributors.map(c => ({
        username: c.author ? c.author.login : 'Unknown',
        avatar: c.author ? c.author.avatar_url : '',
        totalCommits: c.total || 0,
        weeksData: Array.isArray(c.weeks) ? c.weeks : [],
      }));

      // Month + 2-week + 1-week commit counts per author (from recent commits)
      const monthCommits = {};
      const twoWeekCommits = {};
      const weekCommits = {};
      allCommits.forEach(commit => {
        const author =
          (commit.author && commit.author.login) ||
          (commit.commit && commit.commit.author && commit.commit.author.name) ||
          'Unknown';
        monthCommits[author] = (monthCommits[author] || 0) + 1;
        
        const dateStr = commit.commit && commit.commit.author && commit.commit.author.date;
        if (dateStr) {
          const commitDate = new Date(dateStr);
          if (commitDate >= new Date(since14)) {
            twoWeekCommits[author] = (twoWeekCommits[author] || 0) + 1;
          }
          if (commitDate >= new Date(since7)) {
            weekCommits[author] = (weekCommits[author] || 0) + 1;
          }
        }
      });

      // Consistency: % of historically active weeks that had commits
      const consistencyData = processedContributors.map(c => {
        const relevantWeeks = c.weeksData.filter(w => w.c > 0 || w.a > 0 || w.d > 0);
        const activeWeeks = c.weeksData.filter(w => w.c > 0).length;
        const score = relevantWeeks.length > 0
          ? Math.round((activeWeeks / relevantWeeks.length) * 100)
          : 0;
        return { username: c.username, score, activeWeeks, totalWeeks: relevantWeeks.length };
      });

      setPerformanceData(prev => ({
        ...prev,
        [groupId]: {
          contributors: processedContributors,
          monthCommits,
          twoWeekCommits,
          weekCommits,
          consistencyData,
          repoInfo,
          totalCommits: processedContributors.reduce((s, c) => s + c.totalCommits, 0),
          repoUrl,
          allCommits, // Needed for Contribution Trend
          allIssues,  // Needed for Task Burndown
        },
      }));
      setPerfError(prev => ({ ...prev, [groupId]: '' }));
    } catch (err) {
      console.error('GitHub fetch error:', err);
      setPerfError(prev => ({ ...prev, [groupId]: err.message || 'Failed to fetch GitHub data.' }));
    } finally {
      setCheckingPerf(prev => ({ ...prev, [groupId]: false }));
    }
  };



  /* ── Computed values ── */
  // Case-insensitive status checks — handles whatever casing the backend returns
  const pendingRequests = requests.filter((r) => {
    const s = (r.status || "pending").toLowerCase();
    return s === "pending" || s.includes("pending");
  });
  const acceptedCount = requests.filter((r) => (r.status || "").toLowerCase() === "accepted").length;
  const rejectedCount = requests.filter((r) => (r.status || "").toLowerCase() === "rejected").length;

  /* ── Nav Items (7 tabs) ── */
  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "ideas", label: "Ideas" },
    { id: "requests", label: "Requests" },
    { id: "groups", label: "Groups" },
    { id: "committee", label: "Committee" },
    { id: "github", label: "GitHub" },
    { id: "chat", label: "Chat" },
  ];

  /* ── GitHub icon SVG for group cards ── */
  const GitHubIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );

  return (
    <div className="app-layout">
      {/* ── EVALUATION MODAL OVERLAY ── */}
      {evalModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>⚖️ Evaluate Group</h2>
              <button onClick={() => setEvalModalOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            {evalFormLoading ? (
              <div className="center-state"><div className="loading-spinner-lg" /><p>Loading evaluation form…</p></div>
            ) : evalFormError ? (
              <div className="center-state"><div className="state-icon">⚠️</div><p>{evalFormError}</p></div>
            ) : (() => {
              const phasesData = Array.isArray(evalFormData) ? evalFormData : (evalFormData?.phases || evalFormData?.data || []);
              if (phasesData.length === 0) {
                return <div className="center-state"><p>No evaluation phases found for this group.</p></div>;
              }

              if (evalSelectedPhase) {
                let rubrics = Array.isArray(evalSelectedPhase.rubrics) ? evalSelectedPhase.rubrics : [];
                if (evaluatingRole === 'supervisor') {
                  rubrics = rubrics.filter(r => r.evaluatorRole && r.evaluatorRole.toLowerCase() === 'supervisor');
                } else if (evaluatingRole === 'committee') {
                  rubrics = rubrics.filter(r => r.evaluatorRole && r.evaluatorRole.toLowerCase() === 'committee');
                }

                const isLockedForRole = evaluatingRole === 'supervisor' 
                  ? phaseLockStatus?.isSupervisorLocked 
                  : phaseLockStatus?.isCommitteeLocked;

                return (
                  <div className="phase-details-view">
                    <button 
                      onClick={() => setEvalSelectedPhase(null)}
                      style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                    >
                      ← Back to Phases
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, color: '#1e293b' }}>
                        {evalSelectedPhase.name || evalSelectedPhase.phaseName || evalSelectedPhase.title || 'Selected Phase'}
                      </h3>
                      {isLockedForRole && (
                        <span style={{ background: '#d1fae5', color: '#059669', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          ✓ Completed & Locked
                        </span>
                      )}
                    </div>

                    {/* Document & AI Detection Block */}
                    {phaseDocument && (phaseDocument.hasSubmitted || phaseDocument.documentUrl || phaseDocument.fileName) ? (
                      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                          <div>
                            <h4 style={{ margin: '0 0 0.5rem', color: '#334155', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              📄 Document Uploaded
                            </h4>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                              {phaseDocument.fileName || 'Submitted Document'}
                            </p>
                            {phaseDocument.documentUrl && (
                              <a href={phaseDocument.documentUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                                🔗 View / Download Document
                              </a>
                            )}
                            {phaseDocument.githubUrl && (
                              <a href={phaseDocument.githubUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '0.5rem', marginLeft: phaseDocument.documentUrl ? '1rem' : '0', fontSize: '0.8rem', color: '#1e293b', fontWeight: 600, textDecoration: 'none' }}>
                                🐙 View GitHub Repo
                              </a>
                            )}
                          </div>
                          
                          {/* AI Detection Stats */}
                          {(phaseDocument.aiDetectionScore !== undefined || phaseDocument.plagiarismScore !== undefined || phaseDocument.aiReportSummary) && (
                            <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                              {phaseDocument.aiDetectionScore !== undefined && (
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: phaseDocument.aiDetectionScore > 50 ? '#dc2626' : phaseDocument.aiDetectionScore > 20 ? '#d97706' : '#16a34a' }}>
                                    {phaseDocument.aiDetectionScore}%
                                  </div>
                                  <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>AI Written</div>
                                </div>
                              )}
                              {phaseDocument.plagiarismScore !== undefined && (
                                <div style={{ textAlign: 'center', borderLeft: phaseDocument.aiDetectionScore !== undefined ? '1px solid #e2e8f0' : 'none', paddingLeft: phaseDocument.aiDetectionScore !== undefined ? '1rem' : '0' }}>
                                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: phaseDocument.plagiarismScore > 30 ? '#dc2626' : '#16a34a' }}>
                                    {phaseDocument.plagiarismScore}%
                                  </div>
                                  <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Plagiarism</div>
                                </div>
                              )}
                              {phaseDocument.aiReportSummary && (
                                <div style={{ borderLeft: (phaseDocument.aiDetectionScore !== undefined || phaseDocument.plagiarismScore !== undefined) ? '1px solid #e2e8f0' : 'none', paddingLeft: (phaseDocument.aiDetectionScore !== undefined || phaseDocument.plagiarismScore !== undefined) ? '1rem' : '0', maxWidth: '250px', fontSize: '0.75rem', color: '#475569' }}>
                                  {phaseDocument.aiReportSummary}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fef2f2', borderRadius: '10px', border: '1px dashed #fca5a5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                        <span style={{ color: '#991b1b', fontSize: '0.85rem', fontWeight: 600 }}>No document has been uploaded for this phase yet.</span>
                      </div>
                    )}

                    {rubrics.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {rubrics.map((rubric, rIdx) => {
                          const maxMarks = Number(rubric.maxMarks || rubric.marks || rubric.totalMarks || 100);
                          return (
                            <div key={rubric.id || rIdx} style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '6px', borderLeft: '4px solid #3b82f6' }}>
                              <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>
                                {rubric.name || rubric.rubricName || rubric.title || `Rubric ${rIdx + 1}`}
                              </h4>
                              {rubric.description && <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#475569' }}>{rubric.description}</p>}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                <span style={{ fontWeight: 600, color: '#334155' }}>
                                  Max Marks: {maxMarks}
                                </span>
                                {isLockedForRole ? (
                                  <span style={{ color: '#059669', fontWeight: 700, padding: '4px 10px', background: '#d1fae5', borderRadius: '6px' }}>
                                    ✓ Evaluated {phaseExistingMarks[rubric.id] !== undefined ? `(Score: ${phaseExistingMarks[rubric.id]})` : ''}
                                  </span>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <label style={{ fontWeight: 600, color: '#1e293b' }}>Score:</label>
                                    <input 
                                      type="number" 
                                      min="0" 
                                      max={maxMarks}
                                      value={rubricScores[rIdx] !== undefined ? rubricScores[rIdx] : ""}
                                      onChange={(e) => {
                                        let val = e.target.value;
                                        if (val !== "" && Number(val) > maxMarks) val = maxMarks;
                                        if (val !== "" && Number(val) < 0) val = 0;
                                        setRubricScores(prev => ({ ...prev, [rIdx]: val }));
                                      }}
                                      style={{ 
                                        width: '70px', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', 
                                        textAlign: 'center', fontWeight: 600 
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
                      <div className="center-state" style={{ padding: '2rem' }}>
                        <p style={{ color: '#94a3b8', margin: 0 }}>No rubrics assigned to {evaluatingRole} for this phase.</p>
                      </div>
                    )}

                    {/* Global Phase Feedback Input */}
                    {rubrics.length > 0 && !isLockedForRole && (
                      <div style={{ marginTop: '1.5rem', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>Phase Feedback (Optional)</label>
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
                                background: (listening && isMicActive) ? '#fee2e2' : '#f1f5f9', 
                                border: (listening && isMicActive) ? '1px solid #fca5a5' : '1px solid #cbd5e1', 
                                cursor: 'pointer', 
                                color: (listening && isMicActive) ? '#dc2626' : '#475569',
                                display: 'flex', alignItems: 'center', gap: '0.35rem', 
                                padding: '0.4rem 0.75rem', borderRadius: '6px',
                                fontSize: '0.85rem', fontWeight: 600,
                                transition: 'all 0.2s'
                              }}
                            >
                              {(listening && isMicActive) ? (
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
                          value={phaseFeedback || ''}
                          onChange={(e) => {
                            if (listening && isMicActive) {
                              SpeechRecognition.stopListening();
                              setIsMicActive(false);
                            }
                            setPhaseFeedback(e.target.value);
                          }}
                          rows={3}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.95rem', resize: 'vertical' }}
                          disabled={isLockedForRole}
                        />
                      </div>
                    )}

                    {/* Submit Button */}
                    {rubrics.length > 0 && !isLockedForRole && (
                      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                        <button 
                          onClick={handleSubmitPhaseMarks}
                          disabled={submittingMarks}
                          style={{ 
                            background: submittingMarks ? '#94a3b8' : 'linear-gradient(135deg, #22c55e, #16a34a)', 
                            color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', 
                            cursor: submittingMarks ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem',
                            boxShadow: '0 4px 6px -1px rgba(34, 197, 94, 0.2)'
                          }}
                        >
                          {submittingMarks ? "Submitting..." : "✓ Submit Phase Marks"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {phasesData.map((phase, idx) => {
                    const phaseKey = phase.id || idx;
                    const phaseIdForStatus = phase.id || phase.phaseId || phase._id;
                    const statusObj = allPhasesStatus[phaseIdForStatus];
                    const evaluated = evaluatingRole === 'supervisor' 
                      ? statusObj?.isSupervisorLocked 
                      : statusObj?.isCommitteeLocked;
                    
                    return (
                      <div 
                        key={phaseKey}
                        onClick={() => handleSelectPhase(phase)}
                        style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{ background: evaluated ? '#f0fdf4' : '#f8fafc', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>{phase.name || phase.phaseName || phase.title || `Phase ${idx + 1}`}</span>
                            {phase.weight ? <span style={{ fontSize: '0.75rem', background: '#3b82f6', color: '#fff', padding: '3px 10px', borderRadius: '12px' }}>{phase.weight}% Weight</span> : null}
                            {evaluated && <span style={{ fontSize: '0.7rem', background: '#10b981', color: '#fff', padding: '3px 8px', borderRadius: '12px' }}>✓ Completed</span>}
                          </div>
                          <span style={{ color: '#94a3b8', fontSize: '1.2rem' }}>→</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        role="supervisor"
        navItems={navItems}
      />

      <main className="main-content" style={{ position: 'relative' }}>
        {isInPecCommittee && (
          <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}>
            <button 
              className="role-switch-btn"
              onClick={() => onSwitchRole('office')}
            >
              <span className="role-switch-icon">🔄</span>
              <span>Switch to PEC Dashboard</span>
            </button>
          </div>
        )}

        {/* ═══════════════ DASHBOARD HOME ═══════════════ */}
        {activeView === "dashboard" && (
          <div className="dashboard-home">
            <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
              <div className="welcome-content">
                <h1>Welcome back, {user?.name || 'Supervisor'}! 👋</h1>
                <p>Manage your supervision requests and student projects.</p>
              </div>
              <div className="welcome-illustration">👨‍🏫</div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>⏳</div>
                <div className="stat-info">
                  <p className="stat-label">Pending Requests</p>
                  <p className="stat-value">{pendingRequests.length}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>✓</div>
                <div className="stat-info">
                  <p className="stat-label">Active Students</p>
                  <p className="stat-value">{acceptedCount}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>✗</div>
                <div className="stat-info">
                  <p className="stat-label">Declined</p>
                  <p className="stat-value">{rejectedCount}</p>
                </div>
              </div>
            </div>

            <div className="section-card">
              <h3 className="section-title">Quick Actions</h3>
              <div className="action-buttons">
                <button className="action-btn-new primary" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }} onClick={() => setActiveView("requests")}>
                  <span className="action-icon">📋</span><span>View Requests</span>
                </button>
                <button className="action-btn-new" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none' }} onClick={() => setActiveView("groups")}>
                  <span className="action-icon">👥</span><span>View Groups</span>
                </button>
                <button className="action-btn-new" style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff', border: 'none' }} onClick={() => setActiveView("chat")}>
                  <span className="action-icon">💬</span><span>Open Chat</span>
                </button>
              </div>
            </div>

            <div className="section-card">
              <h3 className="section-title">Your Profile</h3>
              <div className="profile-grid">
                <div className="profile-item"><span className="profile-label">Name</span><span className="profile-value">{user?.name || 'Supervisor'}</span></div>
                <div className="profile-item"><span className="profile-label">Email</span><span className="profile-value">{user?.email || '—'}</span></div>
                <div className="profile-item"><span className="profile-label">Department</span><span className="profile-value">Computer Science</span></div>
                <div className="profile-item"><span className="profile-label">Role</span><span className="profile-value">Supervisor</span></div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ IDEAS TAB ═══════════════ */}
        {activeView === "ideas" && (
          <div className="ideas-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div className="section-card" style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <h2 className="section-title" style={{ marginBottom: '1.5rem', color: '#1e293b' }}>💡 Post a New Project Idea</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Idea Title</label>
                  <input 
                    type="text" 
                    placeholder="Enter project idea title" 
                    value={newIdeaTitle}
                    onChange={e => setNewIdeaTitle(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Description</label>
                  <textarea 
                    placeholder="Describe the project idea, requirements, and scope..." 
                    value={newIdeaDescription}
                    onChange={e => setNewIdeaDescription(e.target.value)}
                    rows={4}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button 
                    onClick={handlePostIdea}
                    disabled={postingIdea}
                    style={{
                      background: postingIdea ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '8px',
                      fontWeight: 600, cursor: postingIdea ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                      boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    {postingIdea ? 'Posting...' : 'Post Idea'}
                  </button>
                </div>
              </div>
            </div>

            <div className="section-card" style={{ background: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h2 className="section-title" style={{ marginBottom: '1.5rem', color: '#1e293b' }}>📚 My Posted Ideas</h2>
              {ideasLoading ? (
                <div className="center-state">
                  <div className="loading-spinner-lg" />
                  <p>Loading ideas...</p>
                </div>
              ) : ideasError ? (
                <div className="center-state">
                  <div className="state-icon">⚠️</div>
                  <h3 style={{ color: '#dc2626' }}>{ideasError}</h3>
                </div>
              ) : ideas.length === 0 ? (
                <div className="center-state" style={{ padding: '3rem', background: '#fff', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                  <h3 style={{ color: '#64748b' }}>No Ideas Posted Yet</h3>
                  <p style={{ color: '#94a3b8' }}>Post your first project idea using the form above.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {ideas.map((idea) => (
                    <div key={idea.id} style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', lineHeight: '1.4' }}>{idea.title}</h3>
                        {idea.status === 'taken' ? (
                          <span style={{ background: '#fef2f2', color: '#ef4444', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>TAKEN</span>
                        ) : (
                          <span style={{ background: '#ecfdf5', color: '#10b981', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>AVAILABLE</span>
                        )}
                      </div>
                      <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: '1.5', flexGrow: 1, whiteSpace: 'pre-wrap' }}>
                        {idea.description}
                      </p>
                      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Posted on {new Date(idea.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ═══════════════ REQUESTS TAB ═══════════════ */}
        {activeView === "requests" && (
          <div className="section-card">
            <h2 className="section-title">📋 Supervision Requests</h2>

            {requestsLoading ? (
              <div className="center-state">
                <div className="loading-spinner-lg" />
                <p>Loading requests…</p>
              </div>
            ) : requestsError ? (
              <div className="center-state">
                <div className="state-icon">⚠️</div>
                <h3>Failed to load</h3>
                <p>{requestsError}</p>
                <button className="retry-btn" onClick={fetchRequests}>Retry</button>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="center-state">
                <div className="state-icon">📋</div>
                <h3>No Pending Requests</h3>
                <p>You don't have any supervision requests at the moment.</p>
              </div>
            ) : (
              <>
                <p className="request-count-text">{pendingRequests.length} pending request{pendingRequests.length > 1 ? "s" : ""}</p>
                <div className="requests-grid">
                  {pendingRequests.map((r, i) => {
                    const group = r.groupName || r.group || `Request #${r.id || i + 1}`;
                    const title = r.projectTitle || r.title || r.proposal?.title || "Untitled Project";
                    const domain = r.domain || r.proposal?.domain || "";
                    const description = r.description || r.proposal?.description || "";
                    const isAccepting = actionLoading === r.id;

                    return (
                      <div key={r.id ?? i} className="request-card">
                        <div className="request-card-header">
                          <div className="request-avatar">{group[0]?.toUpperCase()}</div>
                          <div style={{ flex: 1 }}>
                            <p className="group-name">{group}</p>
                            <span className="request-pending-badge">⏳ Pending</span>
                          </div>
                        </div>

                        <h3 className="request-title">{title}</h3>
                        {domain && <span className="request-domain-badge">{domain}</span>}
                        {description && <p className="request-desc">{description}</p>}

                        {Array.isArray(r.students) && r.students.length > 0 && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <p className="request-students-label">Students</p>
                            {r.students.map((s, idx) => (
                              <div key={idx} className="request-student-row">
                                <span className="request-student-dot" />
                                <span className="request-student-name">{s.name}</span>
                                <span className="request-student-reg">{s.reg || s.regNo || ""}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="request-actions">
                          <button className="btn-accept" disabled={isAccepting} onClick={() => handleAcceptRequest(r.id)}>
                            {isAccepting ? "Accepting…" : "✓ Accept"}
                          </button>
                          <button className="btn-decline" disabled={isAccepting} onClick={() => handleRejectRequest(r.id)}>
                            ✗ Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════ GROUPS TAB ═══════════════ */}
        {activeView === "groups" && (
          <div className="section-card">
            <h2 className="section-title">👥 My Groups</h2>

            {groupsLoading ? (
              <div className="center-state">
                <div className="loading-spinner-lg" />
                <p>Loading your groups…</p>
              </div>
            ) : groupsError ? (
              <div className="center-state">
                <div className="state-icon">⚠️</div>
                <h3>Error</h3>
                <p>{groupsError}</p>
                <button className="retry-btn" onClick={fetchGroups}>Retry</button>
              </div>
            ) : groups.length === 0 ? (
              <div className="center-state">
                <div className="state-icon">👥</div>
                <h3>No Groups Yet</h3>
                <p>Accept student requests to see your groups here.</p>
              </div>
            ) : (
              <div className="groups-grid">
                {groups.map((g, i) => {
                  const isAdding = addingRepoFor === (g.id || g._id);
                  const gId = g.id || g._id || i;
                  const perf = performanceData[gId] || { totalCommits: g.totalCommits, individualCommits: g.individualCommits };

                  return (
                    <div key={gId} className="group-card">
                      <div className="group-card-header">
                        <div>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                            📋 {g.proposal?.title || `Group #${gId}`}
                          </h3>
                          {g.proposal?.domain && (
                            <span style={{
                              fontSize: '0.65rem', fontWeight: 700,
                              background: '#eff6ff', color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              padding: '1px 7px', borderRadius: '10px',
                              display: 'inline-block', marginTop: '3px',
                            }}>🏷️ {g.proposal.domain}</span>
                          )}
                        </div>
                        <span className="group-badge">Active</span>
                      </div>

                      {/* Students */}
                      <div style={{ marginTop: '1rem' }}>
                        <p className="students-section-title">Team Members</p>
                        <div className="students-list">
                          {g.teamMembers && g.teamMembers.length > 0 ? (
                            g.teamMembers.map((member, idx) => (
                              <div key={idx} className="student-chip">
                                <div className="avatar-mini">
                                  {idx === 0 ? '⭐' : '👤'}
                                </div>
                                <div>
                                  <span className="reg-text" style={{ fontWeight: 600 }}>
                                    {member.name || `Member ${idx + 1}`}
                                  </span>
                                  {member.regNo && (
                                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginLeft: '5px' }}>
                                      ({member.regNo})
                                    </span>
                                  )}
                                  {idx === 0 && (
                                    <span style={{
                                      fontSize: '0.6rem', background: '#d97706', color: '#fff',
                                      padding: '0 5px', borderRadius: '6px', marginLeft: '4px', fontWeight: 600,
                                    }}>Lead</span>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : g.studentRegs && g.studentRegs.length > 0 ? (
                            // fallback to studentRegs if teamMembers not available
                            g.studentRegs.map((reg, idx) => (
                              <div key={idx} className="student-chip">
                                <div className="avatar-mini">{idx === 0 ? '⭐' : '👤'}</div>
                                <span className="reg-text">{reg}</span>
                              </div>
                            ))
                          ) : (
                            <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No students assigned</p>
                          )}
                        </div>
                      </div>

                      {/* Unified Action Row */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
                        <button
                          onClick={() => handleOpenEvaluate(gId, 'supervisor')}
                          style={{ flex: 1, padding: '0.55rem', fontSize: '0.75rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', cursor: 'pointer', fontWeight: 700, boxShadow: '0 3px 10px rgba(16, 185, 129, 0.2)' }}
                        >
                          📝 Evaluate Group
                        </button>
                        
                        {(groupRepos[gId] || g.repoUrl) && !performanceData[gId] && !checkingPerf[gId] && !perfError[gId] ? (
                          <button
                            onClick={() => handleCheckPerformance(gId)}
                            style={{ flex: 1, padding: '0.55rem', fontSize: '0.75rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', color: '#fff', cursor: 'pointer', fontWeight: 700, boxShadow: '0 3px 10px rgba(139, 92, 246, 0.2)' }}
                          >
                            🔍 GitHub Perf.
                          </button>
                        ) : null}
                      </div>

                      {/* GitHub Integration */}
                      <div className="github-section">
                        <h4 className="github-section-title"><GitHubIcon /> GitHub Integration</h4>

                        {/* EDIT REPO FORM */}
                        {isAdding ? (
                          <div className="repo-form-box">
                            <label>Repository URL</label>
                            <input
                              type="text"
                              placeholder="https://github.com/username/repo"
                              value={repoForm.repoUrl}
                              onChange={(e) => setRepoForm(p => ({ ...p, repoUrl: e.target.value }))}
                            />
                            <div className="repo-form-actions">
                              <button className="btn-save-repo" onClick={() => handleUpdateRepo(gId)}>Save Repository</button>
                              <button className="btn-cancel-repo" onClick={() => { setAddingRepoFor(null); setRepoForm({ repoUrl: '' }); }}>Cancel</button>
                            </div>
                          </div>
                        ) : (() => {
                          const repoUrl = groupRepos[gId] ?? g.repoUrl ?? null;
                          const perf = performanceData[gId];
                          const isChecking = checkingPerf[gId];
                          const isFetchingR = fetchingRepo[gId];
                          const thisError = perfError[gId];
                          const CHART_COLORS = ['#8b5cf6','#06b6d4','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899','#14b8a6'];

                          if (isFetchingR && !repoUrl) {
                            return <div style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '0.5rem 0' }}>🔄 Checking repository…</div>;
                          }

                          if (!repoUrl) {
                            return (
                              <>
                                {repoError[gId] && <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem' }}>{repoError[gId]}</p>}
                                <button className="btn-add-repo" onClick={() => setAddingRepoFor(gId)}>+ Add GitHub Repository</button>
                              </>
                            );
                          }

                          // Repo exists
                          const totalCommitData = perf?.contributors?.map((c, ci) => ({ name: c.username, Commits: c.totalCommits })) || [];
                          const pieData = perf?.contributors?.map((c, ci) => ({ name: c.username, value: c.totalCommits, fill: CHART_COLORS[ci % CHART_COLORS.length] })) || [];
                          const weekMonthData = perf ? Object.keys({ ...perf.monthCommits, ...perf.weekCommits }).map(user => ({
                            name: user, 'Last Month': perf.monthCommits[user] || 0, 'Last Week': perf.weekCommits[user] || 0,
                          })) : [];
                          const consistencyData = perf?.consistencyData || [];
                          
                          // 5. Last 2 Weeks Commits (Bar)
                          const twoWeeksData = perf ? Object.keys(perf.twoWeekCommits || {}).map(user => ({
                            name: user,
                            Commits: perf.twoWeekCommits[user] || 0
                          })) : [];

                          // 6. Last Month Commits (Pie)
                          const monthPieData = perf ? Object.keys(perf.monthCommits || {}).map((user, ci) => ({
                            name: user,
                            value: perf.monthCommits[user] || 0,
                            fill: CHART_COLORS[ci % CHART_COLORS.length]
                          })) : [];

                          return (
                            <div className="github-info-box" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #f0f9ff 100%)', border: '1px solid #c4b5fd' }}>
                              {/* Top action row */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <a
                                  href={repoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    background: 'linear-gradient(135deg, #1e293b, #334155)',
                                    color: '#fff', padding: '7px 14px', borderRadius: '8px',
                                    textDecoration: 'none', fontWeight: 700, fontSize: '0.78rem',
                                    boxShadow: '0 3px 8px rgba(30,41,59,0.2)', transition: 'transform 0.15s',
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                  onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
                                >
                                  <GitHubIcon /> View Repository ↗
                                </a>
                                <button className="btn-edit-repo" onClick={() => { setAddingRepoFor(gId); setRepoForm({ repoUrl }); }}>
                                  ✏️ Edit Repo
                                </button>
                              </div>

                              <p style={{ fontSize: '0.72rem', color: '#7c3aed', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '0.75rem' }}>
                                🔗 {repoUrl}
                              </p>



                              {/* Error box */}
                              {thisError && !isChecking && (
                                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.875rem', marginBottom: '0.5rem' }}>
                                  <p style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 700, margin: '0 0 6px' }}>⚠️ GitHub Fetch Failed</p>
                                  <p style={{ color: '#b91c1c', fontSize: '0.75rem', margin: '0 0 10px', wordBreak: 'break-word' }}>{thisError}</p>
                                  <button
                                    onClick={() => handleCheckPerformance(gId)}
                                    style={{ fontSize: '0.75rem', padding: '5px 12px', borderRadius: '7px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                                  >
                                    🔄 Retry
                                  </button>
                                </div>
                              )}

                              {/* Fetching spinner */}
                              {isChecking && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem', background: '#faf5ff', borderRadius: '10px', border: '1px solid #ddd6fe' }}>
                                  <div className="loading-spinner-lg" style={{ width: '1.25rem', height: '1.25rem', margin: 0 }} />
                                  <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#7c3aed', margin: 0 }}>Fetching GitHub data…</p>
                                </div>
                              )}

                              {/* CHARTS */}
                              {perf && !isChecking && (
                                <div>
                                  {/* Stats pills */}
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                                    {[
                                      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>, label: 'Total Commits', val: perf.totalCommits, color: '#8b5cf6' },
                                      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: 'Contributors', val: perf.contributors?.length || 0, color: '#06b6d4' },
                                      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, label: 'Stars', val: perf.repoInfo?.stargazers_count ?? 0, color: '#f59e0b' },
                                      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, label: 'Open Issues', val: perf.repoInfo?.open_issues_count ?? 0, color: '#ef4444' },
                                    ].map(stat => (
                                      <div key={stat.label} style={{ background: '#fff', border: `1px solid ${stat.color}25`, borderRadius: '8px', padding: '0.625rem', textAlign: 'center', boxShadow: `0 2px 6px ${stat.color}10` }}>
                                        <div style={{ fontSize: '1rem' }}>{stat.icon}</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: stat.color }}>{stat.val}</div>
                                        <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{stat.label}</div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* CHART 1: Total Commits */}
                                  {totalCommitData.length > 0 && (
                                    <div style={{ marginBottom: '1.25rem' }}>
                                      <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>📊 Total Commits</p>
                                      <div style={{ background: '#fff', borderRadius: '10px', padding: '0.75rem', border: '1px solid #f1f5f9' }}>
                                        <ResponsiveContainer width="100%" height={160}>
                                          <BarChart data={totalCommitData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                            <defs>
                                              {totalCommitData.map((_, ci) => (
                                                <linearGradient key={ci} id={`gc-g-${gId}-${ci}`} x1="0" y1="0" x2="0" y2="1">
                                                  <stop offset="0%" stopColor={CHART_COLORS[ci % CHART_COLORS.length]} stopOpacity={1} />
                                                  <stop offset="100%" stopColor={CHART_COLORS[(ci + 2) % CHART_COLORS.length]} stopOpacity={0.55} />
                                                </linearGradient>
                                              ))}
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 700 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                              contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.78rem', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}
                                              cursor={{ fill: 'rgba(139,92,246,0.06)' }}
                                            />
                                            <Bar dataKey="Commits" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                              {totalCommitData.map((_, ci) => (
                                                <Cell key={ci} fill={`url(#gc-g-${gId}-${ci})`} />
                                              ))}
                                            </Bar>
                                          </BarChart>
                                        </ResponsiveContainer>
                                      </div>
                                    </div>
                                  )}

                                  {/* CHART 2: Pie Chart */}
                                  {pieData.length > 0 && (
                                    <div style={{ marginBottom: '1.25rem' }}>
                                      <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>🍩 Commit Share</p>
                                      <div style={{ background: '#fff', borderRadius: '10px', padding: '0.75rem', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <ResponsiveContainer width={150} height={150}>
                                          <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                              {pieData.map((entry, pi) => <Cell key={pi} fill={entry.fill} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.78rem' }} formatter={(val, name) => [`${val} commits`, name]} />
                                          </PieChart>
                                        </ResponsiveContainer>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '100px' }}>
                                          {pieData.map((entry, pi) => {
                                            const pct = perf.totalCommits > 0 ? Math.round((entry.value / perf.totalCommits) * 100) : 0;
                                            return (
                                              <div key={pi}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                                  <div style={{ width: 10, height: 10, borderRadius: '3px', background: entry.fill, flexShrink: 0 }} />
                                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>{entry.name}</span>
                                                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: entry.fill, fontWeight: 800 }}>{pct}%</span>
                                                </div>
                                                <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                                  <div style={{ height: '100%', width: `${pct}%`, background: entry.fill, borderRadius: '3px', transition: 'width 0.8s ease' }} />
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* CHART 3: Week vs Month */}
                                  {weekMonthData.length > 0 && (
                                    <div style={{ marginBottom: '1.25rem' }}>
                                      <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>📅 Last Week vs Month</p>
                                      <div style={{ background: '#fff', borderRadius: '10px', padding: '0.75rem', border: '1px solid #f1f5f9' }}>
                                        <ResponsiveContainer width="100%" height={160}>
                                          <BarChart data={weekMonthData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }} barGap={3}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.78rem', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }} cursor={{ fill: 'rgba(6,182,212,0.06)' }} />
                                            <Legend wrapperStyle={{ fontSize: '0.72rem', paddingTop: '4px' }} />
                                            <Bar dataKey="Last Month" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                            <Bar dataKey="Last Week" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                          </BarChart>
                                        </ResponsiveContainer>
                                      </div>
                                    </div>
                                  )}

                                  {/* CHART 4: Consistency */}
                                  {consistencyData.length > 0 && (
                                    <div>
                                      <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>🎯 Consistency Score</p>
                                      <div style={{ background: '#fff', borderRadius: '10px', padding: '0.875rem', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {consistencyData.map((c, ci) => {
                                          const color = c.score >= 70 ? '#10b981' : c.score >= 40 ? '#f59e0b' : '#ef4444';
                                          const bg = c.score >= 70 ? 'linear-gradient(90deg,#10b981,#06b6d4)' : c.score >= 40 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f97316)';
                                          return (
                                            <div key={ci}>
                                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>{c.username}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                  <span style={{ fontWeight: 900, fontSize: '0.85rem', color }}>{c.score}%</span>
                                                  <span style={{ fontSize: '0.65rem', padding: '1px 7px', borderRadius: '100px', background: c.score >= 70 ? '#d1fae5' : c.score >= 40 ? '#fef9c3' : '#fee2e2', color, fontWeight: 700 }}>
                                                    {c.score >= 70 ? '✅ Consistent' : c.score >= 40 ? '⚠️ Moderate' : '❌ Inconsistent'}
                                                  </span>
                                                </div>
                                              </div>
                                              <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${c.score}%`, background: bg, borderRadius: '6px', transition: 'width 1s ease', boxShadow: `0 1px 4px ${color}40` }} />
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* CHART 5: Last 2 Weeks */}
                                  {twoWeeksData.length > 0 && (
                                    <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
                                      <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>🗓️ Last 2 Weeks Commits</p>
                                      <div style={{ background: '#fff', borderRadius: '10px', padding: '0.75rem', border: '1px solid #f1f5f9' }}>
                                        <ResponsiveContainer width="100%" height={160}>
                                          <BarChart data={twoWeeksData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.78rem' }} />
                                            <Bar dataKey="Commits" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                              {twoWeeksData.map((_, ci) => (
                                                <Cell key={ci} fill={CHART_COLORS[ci % CHART_COLORS.length]} />
                                              ))}
                                            </Bar>
                                          </BarChart>
                                        </ResponsiveContainer>
                                      </div>
                                    </div>
                                  )}

                                  {/* CHART 6: Last Month Pie */}
                                  {monthPieData.length > 0 && (
                                    <div style={{ marginBottom: '1.25rem' }}>
                                      <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>📅 Last Month Commits</p>
                                      <div style={{ background: '#fff', borderRadius: '10px', padding: '0.75rem', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <ResponsiveContainer width={150} height={150}>
                                          <PieChart>
                                            <Pie data={monthPieData} cx="50%" cy="50%" innerRadius={0} outerRadius={65} dataKey="value" strokeWidth={1} stroke="#fff">
                                              {monthPieData.map((entry, pi) => <Cell key={pi} fill={entry.fill} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.78rem' }} />
                                          </PieChart>
                                        </ResponsiveContainer>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '100px' }}>
                                          {monthPieData.map((entry, pi) => (
                                            <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              <div style={{ width: 10, height: 10, borderRadius: '3px', background: entry.fill, flexShrink: 0 }} />
                                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>{entry.name}</span>
                                              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: entry.fill, fontWeight: 800 }}>{entry.value}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Bottom Action Row for Charts */}
                                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem' }}>
                                    <button
                                      onClick={() => handleCheckPerformance(gId)}
                                      disabled={isChecking}
                                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid #ddd6fe', background: '#f5f3ff', color: '#7c3aed', cursor: 'pointer', fontWeight: 700 }}
                                    >
                                      🔄 Re-evaluate
                                    </button>
                                    <button
                                      onClick={() => setPerformanceData(p => { const next = {...p}; delete next[gId]; return next; })}
                                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', cursor: 'pointer', fontWeight: 700 }}
                                    >
                                      ⬆️ Show Less
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="group-footer">
                        <span>Lead: <span className="lead-label">
                          {g.teamMembers?.[0]?.name || `ID: ${g.leadStudentId || '—'}`}
                        </span></span>
                        <span>{g.createdAt ? new Date(g.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ COMMITTEE TAB ═══════════════ */}
        {activeView === "committee" && (
          <div className="section-card">
            <h2 className="section-title">⚖️ Evaluation Committee Groups</h2>

            {evalGroupsLoading ? (
              <div className="center-state">
                <div className="loading-spinner-lg" />
                <p>Loading allocated groups…</p>
              </div>
            ) : evalGroupsError ? (
              <div className="center-state">
                <div className="state-icon">⚠️</div>
                <h3>Error</h3>
                <p>{evalGroupsError}</p>
                <button className="retry-btn" onClick={fetchEvalGroups}>Retry</button>
              </div>
            ) : evalGroups.length === 0 ? (
              <div className="center-state">
                <div className="state-icon">👥</div>
                <h3>No Groups Allocated</h3>
                <p>You don't have any groups allocated for evaluation at the moment.</p>
              </div>
            ) : (
              <div className="groups-grid">
                {evalGroups.map((g, i) => {
                  const gId = g.id || g._id || i;
                  
                  // GitHub performance data extraction
                  const repoUrl = groupRepos[gId] ?? g.repoUrl ?? null;
                  const perf = performanceData[gId];
                  const isChecking = checkingPerf[gId];
                  const thisError = perfError[gId];
                  const CHART_COLORS = ['#8b5cf6','#06b6d4','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899','#14b8a6'];

                  const totalCommitData = perf?.contributors?.map((c, ci) => ({ name: c.username, Commits: c.totalCommits })) || [];
                  const pieData = perf?.contributors?.map((c, ci) => ({ name: c.username, value: c.totalCommits, fill: CHART_COLORS[ci % CHART_COLORS.length] })) || [];
                  const weekMonthData = perf ? Object.keys({ ...perf.monthCommits, ...perf.weekCommits }).map(user => ({
                    name: user, 'Last Month': perf.monthCommits[user] || 0, 'Last Week': perf.weekCommits[user] || 0,
                  })) : [];
                  const consistencyData = perf?.consistencyData || [];
                  
                  const twoWeeksData = perf ? Object.keys(perf.twoWeekCommits || {}).map(user => ({
                    name: user,
                    Commits: perf.twoWeekCommits[user] || 0
                  })) : [];

                  const monthPieData = perf ? Object.keys(perf.monthCommits || {}).map((user, ci) => ({
                    name: user,
                    value: perf.monthCommits[user] || 0,
                    fill: CHART_COLORS[ci % CHART_COLORS.length]
                  })) : [];

                  return (
                    <div key={gId} className="group-card">
                      <div className="group-card-header">
                        <div>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                            📋 {g.proposal?.title || `Group #${gId}`}
                          </h3>
                          {g.proposal?.domain && (
                            <span style={{
                              fontSize: '0.65rem', fontWeight: 700,
                              background: '#eff6ff', color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              padding: '1px 7px', borderRadius: '10px',
                              display: 'inline-block', marginTop: '3px',
                            }}>🏷️ {g.proposal.domain}</span>
                          )}
                        </div>
                        <span className="group-badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>To Evaluate</span>
                      </div>

                      {/* Students */}
                      <div style={{ marginTop: '1rem' }}>
                        <p className="students-section-title">Team Members</p>
                        <div className="students-list">
                          {g.teamMembers && g.teamMembers.length > 0 ? (
                            g.teamMembers.map((member, idx) => (
                              <div key={idx} className="student-chip">
                                <div className="avatar-mini">👤</div>
                                <div>
                                  <span className="reg-text" style={{ fontWeight: 600 }}>
                                    {member.name || `Member ${idx + 1}`}
                                  </span>
                                  {member.regNo && (
                                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginLeft: '5px' }}>
                                      ({member.regNo})
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : g.studentRegs && g.studentRegs.length > 0 ? (
                            g.studentRegs.map((reg, idx) => (
                              <div key={idx} className="student-chip">
                                <div className="avatar-mini">👤</div>
                                <span className="reg-text">{reg}</span>
                              </div>
                            ))
                          ) : (
                            <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No students info</p>
                          )}
                        </div>
                      </div>

                      {/* --- Read-Only GitHub Section --- */}
                      <div className="github-section" style={{ marginTop: '1.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                        <h4 className="github-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                          <GitHubIcon /> GitHub Integration
                        </h4>
                        
                        {!perf && !thisError && !isChecking && (
                          <button
                            onClick={() => handleCheckPerformance(gId)}
                            style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                          >
                            🔍 Evaluate GitHub Performance
                          </button>
                        )}
                        
                        {isChecking && (
                          <div style={{ padding: '1rem', background: '#f5f3ff', borderRadius: '8px', textAlign: 'center', fontSize: '0.8rem', color: '#7c3aed', fontWeight: 600 }}>
                            🔄 Fetching Performance...
                          </div>
                        )}
                        
                        {thisError && !isChecking && (
                          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem' }}>
                            <p style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 700, margin: '0 0 6px' }}>⚠️ Evaluation Failed</p>
                            <p style={{ color: '#b91c1c', fontSize: '0.75rem', margin: '0 0 10px', wordBreak: 'break-word' }}>{thisError}</p>
                            <button
                              onClick={() => handleCheckPerformance(gId)}
                              style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                            >
                              🔄 Retry
                            </button>
                          </div>
                        )}
                        
                        {perf && !isChecking && (
                          <div className="github-info-box" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #f0f9ff 100%)', border: '1px solid #c4b5fd', borderRadius: '10px', padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {repoUrl && (
                                <a
                                  href={repoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    background: 'linear-gradient(135deg, #1e293b, #334155)',
                                    color: '#fff', padding: '7px 14px', borderRadius: '8px',
                                    textDecoration: 'none', fontWeight: 700, fontSize: '0.78rem',
                                    boxShadow: '0 3px 8px rgba(30,41,59,0.2)', transition: 'transform 0.15s',
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                  onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
                                >
                                  <GitHubIcon /> View Repository ↗
                                </a>
                              )}
                            </div>
                            
                            {/* CHART 1: Total Commits */}
                            {totalCommitData.length > 0 && (
                              <div style={{ marginBottom: '1.25rem' }}>
                                <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>📊 Total Commits</p>
                                <div style={{ background: '#fff', borderRadius: '10px', padding: '0.75rem', border: '1px solid #f1f5f9' }}>
                                  <ResponsiveContainer width="100%" height={160}>
                                    <BarChart data={totalCommitData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} axisLine={false} tickLine={false} />
                                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.78rem' }} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
                                      <Bar dataKey="Commits" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                        {totalCommitData.map((_, ci) => <Cell key={ci} fill={CHART_COLORS[ci % CHART_COLORS.length]} />)}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            )}

                            {/* CHART 2: Commit Share */}
                            {pieData.length > 0 && (
                              <div style={{ marginBottom: '1.25rem' }}>
                                <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>🍩 Commit Share</p>
                                <div style={{ background: '#fff', borderRadius: '10px', padding: '0.75rem', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                  <ResponsiveContainer width={150} height={150}>
                                    <PieChart>
                                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                        {pieData.map((entry, pi) => <Cell key={pi} fill={entry.fill} />)}
                                      </Pie>
                                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.78rem' }} formatter={(val, name) => [`${val} commits`, name]} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '100px' }}>
                                    {pieData.map((entry, pi) => {
                                      const pct = perf.totalCommits > 0 ? Math.round((entry.value / perf.totalCommits) * 100) : 0;
                                      return (
                                        <div key={pi}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '3px', background: entry.fill, flexShrink: 0 }} />
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>{entry.name}</span>
                                            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: entry.fill, fontWeight: 800 }}>{pct}%</span>
                                          </div>
                                          <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: entry.fill, borderRadius: '3px', transition: 'width 0.8s ease' }} />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* CHART 3: Week vs Month */}
                            {weekMonthData.length > 0 && (
                              <div style={{ marginBottom: '1.25rem' }}>
                                <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>📅 Last Week vs Month</p>
                                <div style={{ background: '#fff', borderRadius: '10px', padding: '0.75rem', border: '1px solid #f1f5f9' }}>
                                  <ResponsiveContainer width="100%" height={160}>
                                    <BarChart data={weekMonthData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }} barGap={3}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} axisLine={false} tickLine={false} />
                                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.78rem', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }} cursor={{ fill: 'rgba(6,182,212,0.06)' }} />
                                      <Legend wrapperStyle={{ fontSize: '0.72rem', paddingTop: '4px' }} />
                                      <Bar dataKey="Last Month" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                      <Bar dataKey="Last Week" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            )}

                            {/* CHART 4: Consistency */}
                            {consistencyData.length > 0 && (
                              <div>
                                <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>🎯 Consistency Score</p>
                                <div style={{ background: '#fff', borderRadius: '10px', padding: '0.875rem', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {consistencyData.map((c, ci) => {
                                    const color = c.score >= 70 ? '#10b981' : c.score >= 40 ? '#f59e0b' : '#ef4444';
                                    const bg = c.score >= 70 ? 'linear-gradient(90deg,#10b981,#06b6d4)' : c.score >= 40 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f97316)';
                                    return (
                                      <div key={ci}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>{c.username}</span>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontWeight: 900, fontSize: '0.85rem', color }}>{c.score}%</span>
                                            <span style={{ fontSize: '0.65rem', padding: '1px 7px', borderRadius: '100px', background: c.score >= 70 ? '#d1fae5' : c.score >= 40 ? '#fef9c3' : '#fee2e2', color, fontWeight: 700 }}>
                                              {c.score >= 70 ? '✅ Consistent' : c.score >= 40 ? '⚠️ Moderate' : '❌ Inconsistent'}
                                            </span>
                                          </div>
                                        </div>
                                        <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                                          <div style={{ height: '100%', width: `${c.score}%`, background: bg, borderRadius: '6px', transition: 'width 1s ease', boxShadow: `0 1px 4px ${color}40` }} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* CHART 5: Last 2 Weeks */}
                            {twoWeeksData.length > 0 && (
                              <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
                                <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>🗓️ Last 2 Weeks Commits</p>
                                <div style={{ background: '#fff', borderRadius: '10px', padding: '0.75rem', border: '1px solid #f1f5f9' }}>
                                  <ResponsiveContainer width="100%" height={160}>
                                    <BarChart data={twoWeeksData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} axisLine={false} tickLine={false} />
                                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.78rem' }} />
                                      <Bar dataKey="Commits" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                        {twoWeeksData.map((_, ci) => (
                                          <Cell key={ci} fill={CHART_COLORS[ci % CHART_COLORS.length]} />
                                        ))}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            )}

                            {/* CHART 6: Last Month Pie */}
                            {monthPieData.length > 0 && (
                              <div style={{ marginBottom: '1.25rem' }}>
                                <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>📅 Last Month Commits</p>
                                <div style={{ background: '#fff', borderRadius: '10px', padding: '0.75rem', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                  <ResponsiveContainer width={150} height={150}>
                                    <PieChart>
                                      <Pie data={monthPieData} cx="50%" cy="50%" innerRadius={0} outerRadius={65} dataKey="value" strokeWidth={1} stroke="#fff">
                                        {monthPieData.map((entry, pi) => <Cell key={pi} fill={entry.fill} />)}
                                      </Pie>
                                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.78rem' }} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '100px' }}>
                                    {monthPieData.map((entry, pi) => (
                                      <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '3px', background: entry.fill, flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>{entry.name}</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: entry.fill, fontWeight: 800 }}>{entry.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Re-evaluate button */}
                            <button
                              onClick={() => handleCheckPerformance(gId)}
                              disabled={isChecking}
                              style={{ marginTop: '0.875rem', width: '100%', padding: '0.5rem', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid #ddd6fe', background: '#f5f3ff', color: '#7c3aed', cursor: 'pointer', fontWeight: 700 }}
                            >
                              🔄 Refresh Performance
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Evaluate Button */}
                      <div style={{ marginTop: '1.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleOpenEvaluate(gId)}
                          style={{
                            background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                            color: '#fff',
                            border: 'none',
                            padding: '0.6rem 1.25rem',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
                          }}
                        >
                          <span>⚖️</span> Evaluate
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ GITHUB TAB ═══════════════ */}
        {activeView === "github" && (
          <div className="section-card">
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <GitHubIcon /> GitHub Performance Center
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                Live commit analytics, activity trends, and consistency scores fetched directly from GitHub.
              </p>
            </div>

            {groupsLoading ? (
              <div className="center-state">
                <div className="loading-spinner-lg" />
                <p>Loading groups…</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="center-state">
                <div className="state-icon">💻</div>
                <h3>No Groups Yet</h3>
                <p>Accept proposals to see your groups here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {groups.map((g, idx) => {
                  const gId = g.id || g._id || idx;
                  const repoUrl = groupRepos[gId] ?? g.repoUrl ?? null;
                  const perf = performanceData[gId];
                  const isAdding = addingRepoFor === gId;
                  const isChecking = checkingPerf[gId];
                  const thisError = perfError[gId];
                  const CHART_COLORS = ['#8b5cf6','#06b6d4','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899','#14b8a6'];

                  // 1. Donut Chart (Contribution Distribution)
                  const pieData = perf?.contributors?.map((c, ci) => ({ name: c.username, value: c.totalCommits, fill: CHART_COLORS[ci % CHART_COLORS.length] })) || [];

                  // Helper: find all unique week timestamps across all contributors for alignment
                  const allWeeks = Array.from(new Set(
                    perf?.contributors?.flatMap(c => c.weeksData.map(w => w.w)) || []
                  )).sort((a, b) => a - b);
                  const last8Weeks = allWeeks.slice(-8); // Show only last 8 weeks for trend/heatmap

                  // 2. Trend (Multi-Line Chart) - Time vs Commits
                  const trendData = last8Weeks.map(timestamp => {
                    const dateLabel = new Date(timestamp * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    const row = { date: dateLabel };
                    perf?.contributors?.forEach(c => {
                      const weekStats = c.weeksData.find(w => w.w === timestamp);
                      row[c.username] = weekStats ? weekStats.c : 0;
                    });
                    return row;
                  });

                  // 3. Code Impact (Grouped Bar) - Additions vs Deletions
                  const impactData = perf?.contributors?.map(c => {
                    let additions = 0;
                    let deletions = 0;
                    c.weeksData.forEach(w => { additions += w.a; deletions += w.d; });
                    return { name: c.username, Additions: additions, Deletions: deletions };
                  }) || [];

                  // 4. Heatmap (Scatter) - User vs Week vs Commits
                  const heatmapData = [];
                  perf?.contributors?.forEach((c, userIdx) => {
                    last8Weeks.forEach((timestamp, weekIdx) => {
                      const weekStats = c.weeksData.find(w => w.w === timestamp);
                      const commits = weekStats ? weekStats.c : 0;
                      if (commits > 0) {
                        heatmapData.push({
                          userIndex: userIdx,
                          username: c.username,
                          weekIndex: weekIdx,
                          dateLabel: new Date(timestamp * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                          commits,
                          color: CHART_COLORS[userIdx % CHART_COLORS.length]
                        });
                      }
                    });
                  });

                  // 5. Task Burndown (Area Chart) - Total vs Completed over time
                  let burndownData = [];
                  if (perf?.allIssues && perf.allIssues.length > 0) {
                    const sortedIssues = [...perf.allIssues].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                    let totalTasks = 0;
                    let completedTasks = 0;
                    const timelineMap = {}; // date -> { total, completed }

                    // First pass: add creations
                    sortedIssues.forEach(issue => {
                      const date = new Date(issue.created_at).toISOString().split('T')[0];
                      if (!timelineMap[date]) timelineMap[date] = { totalTasks: 0, completedTasks: 0 };
                    });
                    // Add completions
                    sortedIssues.forEach(issue => {
                      if (issue.closed_at) {
                        const date = new Date(issue.closed_at).toISOString().split('T')[0];
                        if (!timelineMap[date]) timelineMap[date] = { totalTasks: 0, completedTasks: 0 };
                      }
                    });

                    // Sort dates and keep running totals
                    Object.keys(timelineMap).sort().forEach(date => {
                      const dayCreations = sortedIssues.filter(i => new Date(i.created_at).toISOString().split('T')[0] === date).length;
                      const dayCompletions = sortedIssues.filter(i => i.closed_at && new Date(i.closed_at).toISOString().split('T')[0] === date).length;
                      totalTasks += dayCreations;
                      completedTasks += dayCompletions;
                      const label = new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                      burndownData.push({ date: label, "Total Tasks": totalTasks, "Completed Tasks": completedTasks });
                    });
                  }

                  // 6. Last 2 Weeks Commits (Bar)
                  const twoWeeksData = perf ? Object.keys(perf.twoWeekCommits).map(user => ({
                    name: user,
                    Commits: perf.twoWeekCommits[user] || 0
                  })) : [];

                  // 7. Last Month Commits (Pie)
                  const monthPieData = perf ? Object.keys(perf.monthCommits).map((user, ci) => ({
                    name: user,
                    value: perf.monthCommits[user] || 0,
                    fill: CHART_COLORS[ci % CHART_COLORS.length]
                  })) : [];

                  return (
                    <div key={gId} style={{
                      background: 'linear-gradient(135deg, #fafbff 0%, #f5f3ff 100%)',
                      border: '1px solid #ddd6fe', borderRadius: '1.25rem',
                      padding: '1.75rem', boxShadow: '0 4px 24px rgba(139,92,246,0.08)',
                    }}>
                      {/* Card header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontWeight: 800, fontSize: '1.05rem', color: '#1e293b' }}>
                            📋 {g.proposal?.title || `Group #${gId}`}
                          </h3>
                          {g.proposal?.domain && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '1px 7px', borderRadius: '10px', display: 'inline-block' }}>
                              🏷️ {g.proposal.domain}
                            </span>
                          )}
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                            {(g.teamMembers || []).map((m, mi) => (
                              <span key={mi} style={{ fontSize: '0.72rem', color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                                {mi === 0 ? '⭐' : '👤'} {m.name || m.regNo}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {repoUrl && (
                            <a
                              href={repoUrl}
                              target="_blank" rel="noreferrer"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                background: 'linear-gradient(135deg, #1e293b, #334155)',
                                color: '#fff', padding: '8px 16px', borderRadius: '9px',
                                textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem',
                                boxShadow: '0 4px 12px rgba(30,41,59,0.3)',
                                transition: 'transform 0.15s, box-shadow 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(30,41,59,0.4)'; }}
                              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 12px rgba(30,41,59,0.3)'; }}
                            >
                              <GitHubIcon /> View Repository ↗
                            </a>
                          )}
                          {repoUrl && (
                            <button
                              onClick={() => { setAddingRepoFor(gId); setRepoForm({ repoUrl }); }}
                              style={{ fontSize: '0.76rem', padding: '8px 13px', borderRadius: '9px', border: '1px solid #ddd6fe', background: '#fff', color: '#7c3aed', cursor: 'pointer', fontWeight: 700 }}
                            >
                              ✏️ Edit Repo
                            </button>
                          )}
                          {repoUrl && !perf && !thisError && (
                            <button
                              className="btn-perf"
                              onClick={() => handleCheckPerformance(gId)}
                              disabled={isChecking}
                              style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', fontSize: '0.8rem', padding: '8px 16px', borderRadius: '9px', boxShadow: '0 4px 14px rgba(139,92,246,0.35)' }}
                            >
                              {isChecking ? '⏳ Fetching…' : '🔍 Evaluate Performance'}
                            </button>
                          )}
                          {(perf || thisError) && (
                            <button
                              onClick={() => handleCheckPerformance(gId)}
                              disabled={isChecking}
                              style={{ fontSize: '0.76rem', padding: '8px 13px', borderRadius: '9px', border: '1px solid #c4b5fd', background: '#fff', color: '#7c3aed', cursor: 'pointer', fontWeight: 700 }}
                            >
                              {isChecking ? '⏳' : '🔄 Refresh'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Edit Form */}
                      {isAdding && (
                        <div className="repo-form-box" style={{ marginBottom: '1.25rem' }}>
                          <label>Repository URL</label>
                          <input
                            type="text"
                            placeholder="https://github.com/username/repo"
                            value={repoForm.repoUrl}
                            onChange={e => setRepoForm(p => ({ ...p, repoUrl: e.target.value }))}
                          />
                          <div className="repo-form-actions">
                            <button className="btn-save-repo" onClick={() => handleUpdateRepo(gId)}>Save Repository</button>
                            <button className="btn-cancel-repo" onClick={() => { setAddingRepoFor(null); setRepoForm({ repoUrl: '' }); }}>Cancel</button>
                          </div>
                        </div>
                      )}

                      {/* No repo */}
                      {!repoUrl && !isAdding && (
                        <div style={{ textAlign: 'center', padding: '1.75rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔗</div>
                          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.875rem' }}>No GitHub repository linked to this group.</p>
                          <button className="btn-add-repo" onClick={() => setAddingRepoFor(gId)}>+ Add GitHub Repository</button>
                        </div>
                      )}

                      {/* Repo URL pill */}
                      {repoUrl && !isAdding && (
                        <p style={{ fontSize: '0.73rem', color: '#7c3aed', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '1.25rem', background: '#f5f3ff', padding: '7px 12px', borderRadius: '9px', border: '1px solid #ede9fe' }}>
                          🔗 {repoUrl}
                        </p>
                      )}

                      {/* Checking animation */}
                      {isChecking && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: 'linear-gradient(135deg, #f5f3ff, #ecfdf5)', borderRadius: '12px', border: '1px solid #ddd6fe', marginBottom: '1.25rem' }}>
                          <div className="loading-spinner-lg" style={{ width: '1.75rem', height: '1.75rem', margin: 0 }} />
                          <div>
                            <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#7c3aed', margin: 0 }}>Fetching GitHub Performance…</p>
                            <p style={{ color: '#94a3b8', fontSize: '0.76rem', margin: '2px 0 0' }}>Collecting commits, contributor stats &amp; activity trends</p>
                          </div>
                        </div>
                      )}

                      {/* Error box */}
                      {thisError && !isChecking && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                          <p style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            ⚠️ GitHub Fetch Failed
                          </p>
                          <p style={{ color: '#b91c1c', fontSize: '0.8rem', margin: '0 0 12px', wordBreak: 'break-word' }}>{thisError}</p>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleCheckPerformance(gId)}
                              style={{ fontSize: '0.8rem', padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                            >
                              🔄 Retry
                            </button>
                            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 'auto 0' }}>Make sure the repo is public or the PAT has access.</p>
                          </div>
                        </div>
                      )}

                      {/* PERFORMANCE CHARTS */}
                      {perf && !isChecking && (
                        <div>
                          {/* Summary stats */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.875rem', marginBottom: '1.75rem' }}>
                            {[
                              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>, label: 'Total Commits', val: perf.totalCommits, color: '#8b5cf6' },
                              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: 'Contributors', val: perf.contributors?.length || 0, color: '#06b6d4' },
                              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, label: 'Stars', val: perf.repoInfo?.stargazers_count ?? 0, color: '#f59e0b' },
                              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"/><path d="M12 12v3"/></svg>, label: 'Forks', val: perf.repoInfo?.forks_count ?? 0, color: '#10b981' },
                            ].map(stat => (
                              <div key={stat.label} style={{
                                background: '#fff', border: `1px solid ${stat.color}30`,
                                borderRadius: '12px', padding: '1rem', textAlign: 'center',
                                boxShadow: `0 2px 10px ${stat.color}15`,
                              }}>
                                <div style={{ fontSize: '1.6rem', marginBottom: '3px' }}>{stat.icon}</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.val}</div>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: '3px' }}>{stat.label}</div>
                              </div>
                            ))}
                          </div>

                          {/* --- 5 MODERN CHARTS GRID --- */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                            
                            {/* 1. Contribution Distribution (Donut Chart) */}
                            {pieData.length > 0 && (
                              <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#334155', letterSpacing: '0.5px', marginBottom: '1.25rem' }}>🍩 Contribution Distribution</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                  <ResponsiveContainer width={180} height={180}>
                                    <PieChart>
                                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" strokeWidth={0}>
                                        {pieData.map((entry, pi) => <Cell key={pi} fill={entry.fill} />)}
                                      </Pie>
                                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.8rem' }} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {pieData.map((entry, pi) => {
                                      const pct = perf.totalCommits > 0 ? Math.round((entry.value / perf.totalCommits) * 100) : 0;
                                      return (
                                        <div key={pi}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: entry.fill, flexShrink: 0 }} />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{entry.name}</span>
                                            <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: entry.fill, fontWeight: 900 }}>{pct}%</span>
                                          </div>
                                          <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: entry.fill, borderRadius: '3px' }} />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 2. Activity Heatmap (Scatter Chart) */}
                            {heatmapData.length > 0 && (
                              <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#334155', letterSpacing: '0.5px', marginBottom: '1.25rem' }}>🔥 Activity Heatmap (8 Weeks)</p>
                                <ResponsiveContainer width="100%" height={220}>
                                  <ScatterChart margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                                    <XAxis type="category" dataKey="dateLabel" name="Week" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="username" name="User" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
                                    <ZAxis type="number" dataKey="commits" range={[40, 400]} name="Commits" />
                                    <Tooltip cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.8rem' }} />
                                    <Scatter data={heatmapData} shape="circle">
                                      {heatmapData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                                      ))}
                                    </Scatter>
                                  </ScatterChart>
                                </ResponsiveContainer>
                              </div>
                            )}

                            {/* 3. Contribution Trend (Multi-Line Chart) */}
                            {trendData.length > 0 && (
                              <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', gridColumn: '1 / -1' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#334155', letterSpacing: '0.5px', marginBottom: '1.25rem' }}>📈 Contribution Trend</p>
                                <ResponsiveContainer width="100%" height={260}>
                                  <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.8rem' }} />
                                    <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} iconType="circle" />
                                    {perf?.contributors?.map((c, ci) => (
                                      <Line key={c.username} type="monotone" dataKey={c.username} stroke={CHART_COLORS[ci % CHART_COLORS.length]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    ))}
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            )}

                            {/* 4. Code Impact Analysis (Grouped Bar Chart) */}
                            {impactData.length > 0 && (
                              <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#334155', letterSpacing: '0.5px', marginBottom: '1.25rem' }}>⚖️ Code Impact Analysis</p>
                                <ResponsiveContainer width="100%" height={260}>
                                  <BarChart data={impactData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.8rem' }} />
                                    <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} iconType="circle" />
                                    <Bar dataKey="Additions" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="Deletions" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            )}

                            {/* 5. Task Burndown (Area Chart) */}
                            {burndownData.length > 0 ? (
                              <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#334155', letterSpacing: '0.5px', marginBottom: '1.25rem' }}>📉 Task Burndown</p>
                                <ResponsiveContainer width="100%" height={260}>
                                  <AreaChart data={burndownData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                                    <defs>
                                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                      </linearGradient>
                                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.8rem' }} />
                                    <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} iconType="circle" />
                                    <Area type="monotone" dataKey="Total Tasks" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="Completed Tasks" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2} />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            ) : (
                              <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '260px' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#334155', letterSpacing: '0.5px', marginBottom: '0.5rem', alignSelf: 'flex-start' }}>📉 Task Burndown</p>
                                <div style={{ fontSize: '2.5rem', marginBottom: '10px', opacity: 0.5 }}>📭</div>
                                <h4 style={{ color: '#475569', margin: '0 0 5px' }}>No Issues Found</h4>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>This repository doesn't have any GitHub issues to track task burndown.</p>
                              </div>
                            )}

                            {/* 6. Last 2 Weeks Commits (Bar Chart) */}
                            {twoWeeksData.length > 0 && (
                              <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#334155', letterSpacing: '0.5px', marginBottom: '1.25rem' }}>🗓️ Last 2 Weeks Commits</p>
                                <ResponsiveContainer width="100%" height={260}>
                                  <BarChart data={twoWeeksData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.8rem' }} />
                                    <Bar dataKey="Commits" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                      {twoWeeksData.map((_, ci) => (
                                        <Cell key={ci} fill={CHART_COLORS[ci % CHART_COLORS.length]} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            )}

                            {/* 7. Last Month Commits (Pie Chart) */}
                            {monthPieData.length > 0 && (
                              <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#334155', letterSpacing: '0.5px', marginBottom: '1.25rem' }}>📅 Last Month Commits</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                  <ResponsiveContainer width={180} height={180}>
                                    <PieChart>
                                      <Pie data={monthPieData} cx="50%" cy="50%" innerRadius={0} outerRadius={80} dataKey="value" strokeWidth={1} stroke="#fff">
                                        {monthPieData.map((entry, pi) => <Cell key={pi} fill={entry.fill} />)}
                                      </Pie>
                                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.8rem' }} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {monthPieData.map((entry, pi) => (
                                      <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: 12, height: 12, borderRadius: '4px', background: entry.fill, flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{entry.name}</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: entry.fill, fontWeight: 900 }}>{entry.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ CHAT TAB ═══════════════ */}
        {activeView === 'chat' && (
          <div className="chat-layout">
            {/* Sidebar - list of groups */}
            <div className="chat-sidebar">
              <div className="chat-sidebar-header">
                <span>💬</span>
                <h4>My Groups</h4>
              </div>
              {groupsLoading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                  🔄 Loading groups...
                </div>
              ) : groups.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                  No groups assigned yet.
                </div>
              ) : (
                groups.map(g => (
                  <div
                    key={g.id}
                    className={`chat-group-item ${selectedChatGroupId === g.id ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedChatGroupId(g.id);
                      setChatMessages([]);
                    }}
                  >
                    <div className="chat-group-avatar" style={{ fontSize: '1.2rem', background: selectedChatGroupId === g.id ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : '#e2e8f0' }}>👨‍🎓</div>
                    <div className="chat-group-info">
                      <p className="chat-group-name">{g.proposal?.title || g.name || `Group #${g.id}`}</p>
                      <p className="chat-group-preview">{g.members?.length || 0} members</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Panel */}
            <div className="chat-panel">
              {!selectedChatGroupId ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '1rem' }}>
                  ← Select a group to start chatting
                </div>
              ) : (
                <>
                  <div className="chat-panel-header">
                    <div className="chat-panel-avatar" style={{ fontSize: '1.2rem', background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>👨‍🎓</div>
                    <div>
                      <h4>{groups.find(g => g.id === selectedChatGroupId)?.proposal?.title || groups.find(g => g.id === selectedChatGroupId)?.name || `Group #${selectedChatGroupId}`}</h4>
                      <span className="chat-online-dot" />
                      <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>Connected · Group #{selectedChatGroupId}</span>
                    </div>
                  </div>

                  <div className="chat-messages-box" ref={chatBoxRef}>
                    {chatLoading ? (
                      <div className="chat-no-messages">🔄 Loading chat...</div>
                    ) : chatMessages.length === 0 ? (
                      <div className="chat-no-messages">No messages yet. Say hello! 👋</div>
                    ) : (
                      chatMessages.map((msg, i) => {
                        const isMine = msg.senderName === (user?.name || 'Supervisor');
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
                      onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                      placeholder="Type a message…"
                    />
                    <button className="chat-send-button" onClick={sendChatMessage}>➤</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
