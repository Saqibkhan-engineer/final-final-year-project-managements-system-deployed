export const fetchPecCommitteesApi = async () => {
  const res = await fetch('/api/pec/all');
  if (!res.ok) throw new Error('Failed to fetch committees');
  return res.json();
};

export const fetchPhasesApi = async () => {
  const res = await fetch('/api/evaluation/phases');
  if (!res.ok) throw new Error('Failed to fetch phases');
  return res.json();
};

export const fetchRubricsApi = async (phaseId) => {
  const res = await fetch(`/api/evaluation/rubrics/${phaseId}`);
  if (!res.ok) throw new Error('Failed to fetch rubrics');
  return res.json();
};

export const saveRubricApi = async (editingRubricId, body) => {
  const url = editingRubricId ? `/api/evaluation/rubrics/${editingRubricId}` : '/api/evaluation/rubrics';
  const method = editingRubricId ? 'PATCH' : 'POST';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Failed to save rubric.');
  }
  return res.json();
};

export const deleteRubricApi = async (id) => {
  const res = await fetch(`/api/evaluation/rubrics/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete rubric.');
  return res;
};

export const savePhaseApi = async (editingPhaseId, body) => {
  const url = editingPhaseId ? `/api/evaluation/${editingPhaseId}` : '/api/evaluation/phases';
  const method = editingPhaseId ? 'PATCH' : 'POST';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Failed to save phase.');
  }
  return res.json();
};

export const deletePhaseApi = async (id) => {
  const res = await fetch(`/api/evaluation/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete phase.');
  return res;
};

export const fetchSupervisorsApi = async (domain) => {
  const url = domain ? `/api/supervisor/all?domain=${domain}` : '/api/supervisor/all';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch supervisors');
  return res.json();
};

export const savePecCommitteeApi = async (editingCommitteeId, body) => {
  const url = editingCommitteeId ? `/api/pec/update/${editingCommitteeId}` : '/api/pec/create';
  const method = editingCommitteeId ? 'PATCH' : 'POST';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to save PEC committee');
  return res;
};

export const saveProposalApi = async (formData) => {
  const res = await fetch("/api/fyp-office/save-proposal", {
    method: "POST",
    body: formData,
  });
  const responseText = await res.text();
  let result;
  try {
    result = responseText ? JSON.parse(responseText) : {};
  } catch (parseError) {
    throw new Error("Server error. Please try again later.");
  }
  if (!res.ok) {
    throw new Error(result.message || "Upload failed");
  }
  return result;
};

export const signupUserApi = async (body) => {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || 'Signup failed');
  return data;
};

export const createCommitteesApi = async () => {
  const res = await fetch('/api/committee/create-committees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || 'Failed to create committees');
  return data;
};

export const fetchCommitteesDetailsApi = async () => {
  const res = await fetch('/api/committee/committees-details');
  const text = await res.text();
  const data = text ? JSON.parse(text) : [];
  if (!res.ok) throw new Error(data.message || 'Failed to fetch committees');
  return data;
};

export const updateEvalCommitteesApi = async (body) => {
  const res = await fetch('/api/committee/update-committees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to update committee');
  }
  return res;
};

export const assignCommitteesApi = async () => {
  const res = await fetch('/api/committee/assign-committees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || 'Assignment failed');
  return data;
};
