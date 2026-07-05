export const checkPecCommitteeStatusApi = async (supervisorId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/pec/check-supervisor/${supervisorId}`);
  if (!res.ok) throw new Error("Failed to check PEC status");
  return res.json();
};

export const fetchIdeasApi = async (supervisorId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/ideas/supervisor/${supervisorId}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch ideas");
  }
  return res.json();
};

export const postIdeaApi = async (supervisorId, title, description) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/ideas/supervisor/${supervisorId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to post idea.");
  }
  return res;
};

export const fetchChatMessagesApi = async (groupId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/chat/messages/${groupId}`);
  if (!res.ok) throw new Error("Failed to fetch chat history");
  return res.json();
};

export const sendChatMessageApi = async (data) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/chat/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res;
};

export const fetchRequestsApi = async (supervisorId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/supervisor/requests/${supervisorId}`);
  const text = await res.text();
  if (!res.ok) throw new Error(`Failed to load requests (${res.status}).`);
  return text ? JSON.parse(text) : [];
};

export const acceptRequestApi = async (requestId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/supervisor/accept-request/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {}
  if (!res.ok) throw new Error(data.message || data.error || `Failed to accept request (${res.status}).`);
  return data;
};

export const rejectRequestApi = async (requestId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/supervisor/reject-request/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to reject request");
  return res;
};

export const fetchGroupsApi = async (supervisorId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/groups/my-groups/${supervisorId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch groups.");
  return data;
};

export const fetchEvalGroupsApi = async (supervisorId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/groups/my-evaluation-groups/${supervisorId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch evaluation groups.");
  return data;
};

export const fetchEvaluationFormApi = async (groupId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/evaluation/evaluation-form/${groupId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch evaluation form.");
  return data;
};

export const fetchPhaseStatusApi = async (groupId, phaseId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/evaluation/status/${groupId}/${phaseId}`);
  if (!res.ok) throw new Error("Failed to fetch phase status");
  return res.json();
};

export const fetchPhaseDocumentApi = async (groupId, phaseId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/evaluation/view-document/${groupId}/${phaseId}`);
  if (!res.ok) throw new Error("Failed to fetch phase document");
  return res.json();
};

export const fetchPhaseMarksApi = async (groupId, phaseId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/evaluation/marks/${groupId}/${phaseId}`);
  if (!res.ok) throw new Error("Failed to fetch phase marks");
  return res.json();
};

export const submitPhaseMarksApi = async (role, groupId, supervisorId, phaseId, scoresArray) => {
  const endpoint =
    role === "supervisor"
      ? `/api/evaluation/submit/supervisor/${groupId}/${supervisorId}/${phaseId}`
      : `/api/evaluation/submit/committee/${groupId}/${supervisorId}/${phaseId}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scores: scoresArray }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || "Failed to submit marks.");
  return data;
};

export const fetchGroupRepoApi = async (groupId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/groups/repo/${groupId}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "No repository linked yet.");
  return data.repoUrl || data.repo_url || data.url || data.githubUrl || null;
};

export const updateGroupRepoApi = async (groupId, repoUrl) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/groups/update-repo/${groupId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoUrl, githubUsernames: [] }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.message || "Failed to update repository.");
  }
  return res;
};

// ── GitHub API Proxy logic ──
export const fetchGithubApi = async (path, token) => {
  const BASE = "/github-api";
  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
  };
  const res = await fetch(`${BASE}${path}`, { headers });
  if (res.status === 401) throw new Error("GitHub token is invalid or expired (401).");
  if (res.status === 403) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "GitHub API rate limit exceeded (403). Try again later.");
  }
  if (res.status === 404) throw new Error(`Resource not found (404).`);
  return res;
};
