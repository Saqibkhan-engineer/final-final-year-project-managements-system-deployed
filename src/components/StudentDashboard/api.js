// API service for Student Dashboard

export const fetchChatMessagesApi = async (groupId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/chat/messages/${groupId}`);
  if (!res.ok) throw new Error('Failed to load chat history');
  return res.json();
};

export const sendChatMessageApi = async (data) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/chat/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res;
};

export const fetchEvaluationPhasesApi = async (groupId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/evaluation/evaluation-form/${groupId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch phases.');
  return data;
};

export const fetchViewDocumentApi = async (groupId, phaseId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/evaluation/view-document/${groupId}/${phaseId}`);
  if (!res.ok) throw new Error('Failed to fetch document');
  return res.json();
};

export const fetchMarksApi = async (groupId, phaseId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/evaluation/marks/${groupId}/${phaseId}`);
  if (!res.ok) throw new Error('Failed to fetch marks');
  return res.json();
};

export const submitDocumentApi = async (groupId, phaseId, studentId, formData) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/evaluation/submit-document/${groupId}/${phaseId}/${studentId}`, {
    method: "POST",
    body: formData,
  });
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch (e) { }
  if (!res.ok) throw new Error(data.message || "Failed to submit document.");
  return data;
};

export const fetchStudentDashboardApi = async (studentId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/students/dashboard?studentId=${studentId}`);
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
};

export const fetchSupervisorsApi = async (domain) => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const url = domain ? `${baseUrl}/api/supervisor/all?domain=${encodeURIComponent(domain)}` : `${baseUrl}/api/supervisor/all`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load supervisors");
  return res.json();
};

export const fetchMyCommitteeApi = async (studentId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/students/my-committee/${studentId}`);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || 'Failed to fetch committee');
  return data;
};

export const fetchAvailableIdeasApi = async () => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/ideas/students/available`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch ideas");
  return data;
};

export const searchStudentsApi = async (query) => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const url = query.trim()
    ? `${baseUrl}/api/supervisor/students/search?name=${encodeURIComponent(query)}`
    : `${baseUrl}/api/supervisor/students/search`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to search students');
  return res.json();
};

export const sendSupervisorRequestApi = async (body) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/supervisor/send-supervisor-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (e) { }
  if (!res.ok) throw new Error((data && data.message) || data.error || 'Failed to send request. ' + text);
  return data;
};

export const checkSimilarityApi = async (formData) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/proposal/check-similarity`, {
    method: "POST",
    body: formData,
  });
  const result = await res.json();
  if (result.success === false || result.error) {
    throw new Error(result.error || "Failed to process document");
  }
  if (!res.ok) throw new Error("Failed to check similarity");
  return result;
};

export const enhanceProposalApi = async (body) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/proposal/enhance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMsg = errorData.message || '';
    if (errorMsg.includes('QUOTA_EXCEEDED') || errorMsg.includes('429') || errorMsg.includes('quota')) {
      throw new Error("QUOTA_EXCEEDED");
    }
    if (errorMsg.includes('MODEL_UNAVAILABLE') || errorMsg.includes('404')) {
      throw new Error("MODEL_UNAVAILABLE");
    }
    throw new Error("Enhancement failed");
  }
  return res.json();
};

export const submitToPecApi = async (body) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/pec/submit-to-pec`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to submit to PEC");
  }
  return res;
};
