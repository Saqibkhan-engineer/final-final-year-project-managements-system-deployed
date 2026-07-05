import { CheckCircle, XCircle } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "../Sidebar";
import io from "socket.io-client";
import "regenerator-runtime/runtime";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import {
  checkPecCommitteeStatusApi,
  fetchIdeasApi,
  postIdeaApi,
  fetchChatMessagesApi,
  sendChatMessageApi,
  fetchRequestsApi,
  acceptRequestApi,
  rejectRequestApi,
  fetchGroupsApi,
  fetchEvalGroupsApi,
  fetchEvaluationFormApi,
  fetchPhaseStatusApi,
  fetchPhaseDocumentApi,
  fetchPhaseMarksApi,
  submitPhaseMarksApi,
  fetchGroupRepoApi,
  updateGroupRepoApi,
  fetchGithubApi
} from "./api";

import { DashboardView } from "./views/DashboardView";
import { IdeasView } from "./views/IdeasView";
import { RequestsView } from "./views/RequestsView";
import { GroupsView } from "./views/GroupsView";
import { CommitteeView } from "./views/CommitteeView";
import { ChatView } from "./views/ChatView";
import { EvaluationModalView } from "./views/EvaluationModalView";

/* ── Socket.IO singleton (connects once) ── */
let socket = null;
function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL || "/", { transports: ["websocket", "polling"] });
  }
  return socket;
}

export function SupervisorDashboard({ user, onLogout, originalRole, onSwitchRole }) {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInPecCommittee, setIsInPecCommittee] = useState(false);

  // Resolve the supervisor's own ID from the login response.
  const resolvedSupervisorId = user?.supervisorId ?? user?.supervisorid ?? null;

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
  const [repoInputUrl, setRepoInputUrl] = useState("");
  const [checkingPerf, setCheckingPerf] = useState({});
  const [performanceData, setPerformanceData] = useState({});
  const [groupRepos, setGroupRepos] = useState({});
  const [fetchingRepo, setFetchingRepo] = useState({});
  const [repoError, setRepoError] = useState({});
  const [perfError, setPerfError] = useState({});

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
  const [evaluatingRole, setEvaluatingRole] = useState(null);
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
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBoxRef = useRef(null);

  // ── Ideas state ──
  const [ideas, setIdeas] = useState([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasError, setIdeasError] = useState("");
  const [showIdeaForm, setShowIdeaForm] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: "", description: "" });
  const [postingIdea, setPostingIdea] = useState(false);

  // ── Fetch initial data on mount ──
  useEffect(() => {
    if (resolvedSupervisorId) {
      handleFetchRequests();
      handleCheckPecStatus();
    }
  }, [resolvedSupervisorId]);

  const handleCheckPecStatus = async () => {
    try {
      const data = await checkPecCommitteeStatusApi(resolvedSupervisorId);
      setIsInPecCommittee(data.inCommittee);
    } catch (e) {
      console.error("Failed to check PEC status:", e);
    }
  };

  // ── View triggers ──
  useEffect(() => {
    if (activeView === "groups" || activeView === "github") handleFetchGroups();
    if (activeView === "committee") handleFetchEvalGroups();
    if (activeView === "ideas") handleFetchIdeas();
  }, [activeView]);

  /* ── API Handlers: Ideas ── */
  const handleFetchIdeas = async () => {
    if (!resolvedSupervisorId) return;
    setIdeasLoading(true);
    setIdeasError("");
    try {
      const data = await fetchIdeasApi(resolvedSupervisorId);
      setIdeas(data);
    } catch (e) {
      setIdeasError(e.message || "Network error fetching ideas");
    } finally {
      setIdeasLoading(false);
    }
  };

  const handlePostIdea = async (e) => {
    e.preventDefault();
    if (!newIdea.title.trim() || !newIdea.description.trim()) {
      alert("Title and description are required.");
      return;
    }
    setPostingIdea(true);
    try {
      await postIdeaApi(resolvedSupervisorId, newIdea.title, newIdea.description);
      setNewIdea({ title: "", description: "" });
      setShowIdeaForm(false);
      handleFetchIdeas();
    } catch (e) {
      alert(e.message || "Network error while posting idea.");
    } finally {
      setPostingIdea(false);
    }
  };

  /* ── API Handlers: Chat ── */
  useEffect(() => {
    if (activeView !== "chat") return;
    if (resolvedSupervisorId) handleFetchGroups();
  }, [activeView]);

  useEffect(() => {
    if (!selectedChatGroupId) return;
    const s = getSocket();

    const loadMessages = async () => {
      setChatLoading(true);
      try {
        const history = await fetchChatMessagesApi(selectedChatGroupId);
        setChatMessages(Array.isArray(history) ? history : []);
      } catch (e) {
        console.error("History fetch error:", e);
      } finally {
        setChatLoading(false);
      }
    };
    loadMessages();

    const joinRoom = () => {
      s.emit("joinRoom", selectedChatGroupId);
    };

    if (s.connected) {
      joinRoom();
    } else {
      s.once("connect", joinRoom);
    }
    s.on("connect", joinRoom);

    const handleMsg = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    };
    s.on("receiveMessage", handleMsg);

    return () => {
      s.off("receiveMessage", handleMsg);
      s.off("connect", joinRoom);
    };
  }, [selectedChatGroupId]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !selectedChatGroupId) return;
    const data = {
      groupId: selectedChatGroupId,
      senderId: user?.id || 0,
      senderName: user?.name || "Supervisor",
      senderRole: "supervisor",
      message: chatInput,
    };

    setChatInput("");
    try {
      await sendChatMessageApi(data);
      const history = await fetchChatMessagesApi(selectedChatGroupId);
      setChatMessages(Array.isArray(history) ? history : []);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  /* ── API Handlers: Requests ── */
  const handleFetchRequests = async () => {
    setRequestsLoading(true);
    setRequestsError("");
    try {
      const data = await fetchRequestsApi(resolvedSupervisorId);
      setRequests(Array.isArray(data) ? data.filter(r => r.status === 'pending') : []);
    } catch (err) {
      setRequestsError(err.message || "Cannot reach server.");
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setActionLoading(requestId);
    try {
      const data = await acceptRequestApi(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      handleFetchGroups();
      const groupInfo = data.group
        ? `\nGroup ID: ${data.group.id} | Students: ${(data.group.studentRegs || []).join(", ") || "—"}`
        : "";
      alert(`<CheckCircle className="inline-icon" size={18} /> ${data.message || "Request accepted, group created successfully!"}${groupInfo}`);
    } catch (err) {
      alert(err.message || "Server error. Try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setActionLoading(requestId);
    try {
      await rejectRequestApi(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      alert("Request declined.");
    } catch (err) {
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } finally {
      setActionLoading(null);
    }
  };

  /* ── API Handlers: Groups ── */
  const handleFetchGroups = async () => {
    if (!resolvedSupervisorId) return;
    setGroupsLoading(true);
    setGroupsError("");
    try {
      const data = await fetchGroupsApi(resolvedSupervisorId);
      const loadedGroups = Array.isArray(data) ? data : data.groups || [];
      setGroups(loadedGroups);

      const seedRepos = {};
      loadedGroups.forEach((g) => {
        const gId = g.id || g._id;
        if (g.repoUrl) seedRepos[gId] = g.repoUrl;
      });
      setGroupRepos((prev) => ({ ...prev, ...seedRepos }));

      loadedGroups.forEach((g) => {
        const gId = g.id || g._id;
        if (gId) handleFetchGroupRepo(gId);
      });
    } catch (e) {
      setGroupsError(e.message || "Network error. Could not reach server.");
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleFetchEvalGroups = async () => {
    if (!resolvedSupervisorId) return;
    setEvalGroupsLoading(true);
    setEvalGroupsError("");
    try {
      const data = await fetchEvalGroupsApi(resolvedSupervisorId);
      setEvalGroups(Array.isArray(data) ? data : data.groups || []);
    } catch (e) {
      setEvalGroupsError(e.message || "Network error. Could not reach server.");
    } finally {
      setEvalGroupsLoading(false);
    }
  };

  const handleFetchGroupRepo = async (groupId) => {
    setFetchingRepo((prev) => ({ ...prev, [groupId]: true }));
    setRepoError((prev) => ({ ...prev, [groupId]: "" }));
    try {
      const url = await fetchGroupRepoApi(groupId);
      if (url) {
        setGroupRepos((prev) => ({ ...prev, [groupId]: url }));
      } else {
        setGroupRepos((prev) => ({ ...prev, [groupId]: null }));
        setRepoError((prev) => ({ ...prev, [groupId]: "No repository linked yet." }));
      }
    } catch (err) {
      setGroupRepos((prev) => ({ ...prev, [groupId]: null }));
      setRepoError((prev) => ({ ...prev, [groupId]: err.message }));
    } finally {
      setFetchingRepo((prev) => ({ ...prev, [groupId]: false }));
    }
  };

  const handleUpdateRepo = async (groupId) => {
    if (!repoInputUrl) {
      alert("Please enter a Repository URL.");
      return;
    }
    try {
      await updateGroupRepoApi(groupId, repoInputUrl);
      const savedUrl = repoInputUrl;
      setGroupRepos((prev) => ({ ...prev, [groupId]: savedUrl }));
      setGroups((prev) => prev.map((g) => ((g.id || g._id) === groupId ? { ...g, repoUrl: savedUrl } : g)));
      setAddingRepoFor(null);
      setRepoInputUrl("");
      setPerformanceData((prev) => {
        const n = { ...prev };
        delete n[groupId];
        return n;
      });
      setPerfError((prev) => {
        const n = { ...prev };
        delete n[groupId];
        return n;
      });
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  /* ── Evaluation Logic ── */
  const handleOpenEvaluate = async (groupId, role = "committee") => {
    setEvaluatingRole(role);
    setPhaseLockStatus(null);
    setEvalSelectedGroupId(groupId);
    setEvalModalOpen(true);
    setEvalFormLoading(true);
    setEvalFormError("");
    setEvalFormData(null);
    setEvalSelectedPhase(null);
    try {
      const data = await fetchEvaluationFormApi(groupId);
      setEvalFormData(data);
      const phasesData = Array.isArray(data) ? data : data.phases || data.data || [];
      const statusMap = {};
      await Promise.all(
        phasesData.map(async (phase) => {
          const pId = phase.id || phase.phaseId || phase._id;
          if (pId) {
            try {
              const sData = await fetchPhaseStatusApi(groupId, pId);
              statusMap[pId] = sData;
            } catch (e) {}
          }
        })
      );
      setAllPhasesStatus(statusMap);
    } catch (err) {
      setEvalFormError(err.message || "Network error. Could not reach server.");
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

    try {
      const phaseId = phase.id || phase._id || phase.phaseId;
      if (phaseId && evalSelectedGroupId) {
        const data = await fetchPhaseStatusApi(evalSelectedGroupId, phaseId);
        setPhaseLockStatus(data);
        setAllPhasesStatus((prev) => ({ ...prev, [phaseId]: data }));

        try {
          const docData = await fetchPhaseDocumentApi(evalSelectedGroupId, phaseId);
          if (docData && (docData.documentUrl || docData.fileName || docData.hasSubmitted)) {
            setPhaseDocument(docData);
          }
        } catch (e) {}

        try {
          const marksData = await fetchPhaseMarksApi(evalSelectedGroupId, phaseId);
          if (marksData.success && Array.isArray(marksData.data)) {
            const myMarks = {};
            marksData.data.forEach((item) => {
              if (item.evaluator && Number(item.evaluator.id) === Number(resolvedSupervisorId)) {
                myMarks[item.rubric.id] = item.marks;
              } else if (item.rubric && !myMarks[item.rubric.id]) {
                myMarks[item.rubric.id] = item.marks;
              }
            });
            setPhaseExistingMarks(myMarks);
          }
        } catch (e) {}
      }
    } catch (e) {}
  };

  const handleSubmitPhaseMarks = async () => {
    if (!evalSelectedGroupId || !resolvedSupervisorId || !evalSelectedPhase) return;

    const rubrics = Array.isArray(evalSelectedPhase.rubrics) ? evalSelectedPhase.rubrics : [];
    const validEntries = Object.entries(rubricScores).filter(([_, marks]) => marks !== "" && marks !== undefined);

    if (validEntries.length === 0) {
      alert("Please enter marks for at least one rubric before submitting.");
      return;
    }

    const scoresArray = [];
    let isFirstValid = true;
    for (const [rIdxStr, marks] of validEntries) {
      const rIdx = Number(rIdxStr);
      const rubric = rubrics[rIdx];
      if (rubric) {
        const maxMarks = Number(rubric.maxMarks || rubric.marks || rubric.totalMarks || 100);
        if (Number(marks) > maxMarks || Number(marks) < 0) {
          alert(
            `Error: Marks for "${rubric.name || rubric.rubricName || rubric.title || "Rubric"}" cannot exceed its maximum marks (${maxMarks}) or be negative.`
          );
          return;
        }
        scoresArray.push({
          rubricId: Number(rubric.id || rubric._id || rubric.rubricId || 0),
          marks: Number(marks),
          feedback: isFirstValid ? phaseFeedback : "",
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

      const data = await submitPhaseMarksApi(evaluatingRole, evalSelectedGroupId, resolvedSupervisorId, phaseId, scoresArray);
      alert(data.message || "Marks submitted successfully!");
      handleSelectPhase(evalSelectedPhase);
    } catch (err) {
      alert(err.message || "Network error. Could not reach server.");
    } finally {
      setSubmittingMarks(false);
    }
  };

  /* ── Helper: Parse GitHub Repo ── */
  const parseGitHubRepo = (url) => {
    if (!url) return null;
    try {
      const clean = url.replace(/\.git$/, "").replace(/\/$/, "");
      const match = clean.match(/github\.com[/:]([^/]+)\/([^/]+)/);
      if (match) return { owner: match[1], repo: match[2] };
    } catch (e) {}
    return null;
  };

  /* ── GitHub Performance logic ── */
  const handleCheckPerformance = async (groupId, overrideUrl) => {
    let repoUrl =
      overrideUrl ||
      groupRepos[groupId] ||
      groups.find((g) => (g.id || g._id) === groupId)?.repoUrl ||
      evalGroups.find((g) => (g.id || g._id) === groupId)?.repoUrl;

    setCheckingPerf((prev) => ({ ...prev, [groupId]: true }));
    setPerfError((prev) => ({ ...prev, [groupId]: "" }));

    if (!repoUrl) {
      try {
        const url = await fetchGroupRepoApi(groupId);
        if (url) {
          repoUrl = url;
          setGroupRepos((prev) => ({ ...prev, [groupId]: url }));
        }
      } catch (e) {}
    }

    const parsed = parseGitHubRepo(repoUrl);
    if (!parsed) {
      setPerfError((prev) => ({ ...prev, [groupId]: "Invalid or missing GitHub repository URL." }));
      setCheckingPerf((prev) => ({ ...prev, [groupId]: false }));
      return;
    }
    const { owner, repo } = parsed;
    const token = import.meta.env.VITE_GITHUB_PAT;

    try {
      const repoInfoRes = await fetchGithubApi(`/repos/${owner}/${repo}`, token);
      const repoInfo = repoInfoRes.ok ? await repoInfoRes.json() : {};

      let contributors = [];
      let contribRes = await fetchGithubApi(`/repos/${owner}/${repo}/stats/contributors`, token);
      if (contribRes.status === 202) {
        for (let attempt = 0; attempt < 2; attempt++) {
          await new Promise((r) => setTimeout(r, 3500));
          contribRes = await fetchGithubApi(`/repos/${owner}/${repo}/stats/contributors`, token);
          if (contribRes.status !== 202) break;
        }
      }
      if (contribRes.ok) {
        const raw = await contribRes.json();
        contributors = Array.isArray(raw) ? raw : [];
      }

      const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const since14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      let allCommits = [];
      for (let page = 1; page <= 3; page++) {
        const cRes = await fetchGithubApi(`/repos/${owner}/${repo}/commits?since=${since30}&per_page=100&page=${page}`, token);
        if (!cRes.ok) break;
        const pageData = await cRes.json();
        if (!Array.isArray(pageData)) break;
        allCommits = [...allCommits, ...pageData];
        if (pageData.length < 100) break;
      }

      let allIssues = [];
      const issuesRes = await fetchGithubApi(`/repos/${owner}/${repo}/issues?state=all&per_page=100`, token);
      if (issuesRes.ok) {
        allIssues = await issuesRes.json();
      }

      const processedContributors = contributors.map((c) => ({
        username: c.author ? c.author.login : "Unknown",
        avatar: c.author ? c.author.avatar_url : "",
        totalCommits: c.total || 0,
        weeksData: Array.isArray(c.weeks) ? c.weeks : [],
      }));

      const monthCommits = {};
      const twoWeekCommits = {};
      const weekCommits = {};
      allCommits.forEach((commit) => {
        const author =
          (commit.author && commit.author.login) ||
          (commit.commit && commit.commit.author && commit.commit.author.name) ||
          "Unknown";
        monthCommits[author] = (monthCommits[author] || 0) + 1;

        const dateStr = commit.commit && commit.commit.author && commit.commit.author.date;
        if (dateStr) {
          const commitDate = new Date(dateStr);
          if (commitDate >= new Date(since14)) twoWeekCommits[author] = (twoWeekCommits[author] || 0) + 1;
          if (commitDate >= new Date(since7)) weekCommits[author] = (weekCommits[author] || 0) + 1;
        }
      });

      const consistencyData = processedContributors.map((c) => {
        const relevantWeeks = c.weeksData.filter((w) => w.c > 0 || w.a > 0 || w.d > 0);
        const activeWeeks = c.weeksData.filter((w) => w.c > 0).length;
        const score = relevantWeeks.length > 0 ? Math.round((activeWeeks / relevantWeeks.length) * 100) : 0;
        return { username: c.username, score, activeWeeks, totalWeeks: relevantWeeks.length };
      });

      setPerformanceData((prev) => ({
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
          allCommits,
          allIssues,
        },
      }));
      setPerfError((prev) => ({ ...prev, [groupId]: "" }));
    } catch (err) {
      setPerfError((prev) => ({ ...prev, [groupId]: err.message || "Failed to fetch GitHub data." }));
    } finally {
      setCheckingPerf((prev) => ({ ...prev, [groupId]: false }));
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "ideas", label: "Ideas" },
    { id: "requests", label: "Requests" },
    { id: "groups", label: "Groups" },
    { id: "committee", label: "Committee" },
    { id: "github", label: "GitHub" },
    { id: "chat", label: "Chat" },
  ];

  return (
    <div className="app-layout">
      <EvaluationModalView
        evalModalOpen={evalModalOpen}
        setEvalModalOpen={setEvalModalOpen}
        evalFormLoading={evalFormLoading}
        evalFormError={evalFormError}
        evalFormData={evalFormData}
        evalSelectedPhase={evalSelectedPhase}
        setEvalSelectedPhase={setEvalSelectedPhase}
        evaluatingRole={evaluatingRole}
        phaseLockStatus={phaseLockStatus}
        phaseDocument={phaseDocument}
        phaseExistingMarks={phaseExistingMarks}
        rubricScores={rubricScores}
        setRubricScores={setRubricScores}
        phaseFeedback={phaseFeedback}
        setPhaseFeedback={setPhaseFeedback}
        submittingMarks={submittingMarks}
        handleSubmitPhaseMarks={handleSubmitPhaseMarks}
        allPhasesStatus={allPhasesStatus}
        handleSelectPhase={handleSelectPhase}
        browserSupportsSpeechRecognition={browserSupportsSpeechRecognition}
        listening={listening}
        isMicActive={isMicActive}
        setIsMicActive={setIsMicActive}
        SpeechRecognition={SpeechRecognition}
        resetTranscript={resetTranscript}
      />

      <Sidebar
        user={user}
        role={originalRole || user?.role || "supervisor"}
        navItems={navItems}
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onLogout={onLogout}
        onSwitchRole={onSwitchRole}
      />

      <main className={`main-content ${sidebarOpen ? "shift" : ""}`}>
        <div className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              ☰
            </button>
          </div>
          {isInPecCommittee && onSwitchRole && (
            <button
              onClick={() => onSwitchRole("office")}
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.2)",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6"></path>
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                <path d="M3 22v-6h6"></path>
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
              </svg>
              Switch to PEC Dashboard
            </button>
          )}
        </div>

        {activeView === "dashboard" && <DashboardView user={user} />}

        {activeView === "ideas" && (
          <IdeasView
            ideasLoading={ideasLoading}
            ideasError={ideasError}
            ideas={ideas}
            fetchIdeas={handleFetchIdeas}
            showIdeaForm={showIdeaForm}
            setShowIdeaForm={setShowIdeaForm}
            newIdea={newIdea}
            setNewIdea={setNewIdea}
            handlePostIdea={handlePostIdea}
          />
        )}

        {activeView === "requests" && (
          <RequestsView
            requestsLoading={requestsLoading}
            requestsError={requestsError}
            requests={requests}
            fetchRequests={handleFetchRequests}
            handleAcceptRequest={handleAcceptRequest}
            handleRejectRequest={handleRejectRequest}
          />
        )}

        {(activeView === "groups" || activeView === "github") && (
          <GroupsView
            groupsLoading={groupsLoading}
            groupsError={groupsError}
            groups={groups}
            fetchGroups={handleFetchGroups}
            handleOpenEvaluate={handleOpenEvaluate}
            groupRepos={groupRepos}
            addingRepoFor={addingRepoFor}
            setAddingRepoFor={setAddingRepoFor}
            repoInputUrl={repoInputUrl}
            setRepoInputUrl={setRepoInputUrl}
            handleUpdateRepo={handleUpdateRepo}
            performanceData={performanceData}
            checkingPerf={checkingPerf}
            perfError={perfError}
            handleCheckPerformance={handleCheckPerformance}
            setPerformanceData={setPerformanceData}
          />
        )}

        {activeView === "committee" && (
          <CommitteeView
            evalGroupsLoading={evalGroupsLoading}
            evalGroupsError={evalGroupsError}
            evalGroups={evalGroups}
            fetchEvalGroups={handleFetchEvalGroups}
            handleOpenEvaluate={handleOpenEvaluate}
            groupRepos={groupRepos}
            performanceData={performanceData}
            checkingPerf={checkingPerf}
            perfError={perfError}
            handleCheckPerformance={handleCheckPerformance}
          />
        )}

        {activeView === "chat" && (
          <ChatView
            groupsLoading={groupsLoading}
            groups={groups}
            selectedChatGroupId={selectedChatGroupId}
            setSelectedChatGroupId={setSelectedChatGroupId}
            setChatMessages={setChatMessages}
            user={user}
            chatBoxRef={chatBoxRef}
            chatLoading={chatLoading}
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            sendChatMessage={handleSendChatMessage}
          />
        )}
      </main>
    </div>
  );
}
