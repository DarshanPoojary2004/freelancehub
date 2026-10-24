/**
 * API Service
 * Centralized API calls for Projects, Proposals, Freelancer Profiles, and Hiring Requests
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "An unexpected error occurred");
  }
  return data.data;
};

// ==================== PROJECTS API ====================

export const getProjects = async ({ category, search } = {}) => {
  const params = new URLSearchParams();
  if (category && category !== "All") params.append("category", category);
  if (search) params.append("search", search);

  const queryStr = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/api/projects${queryStr}`);
  return handleResponse(response);
};

export const getProjectById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`);
  return handleResponse(response);
};

export const createProject = async (projectData) => {
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData)
  });
  return handleResponse(response);
};

export const getClientProjects = async () => {
  const response = await fetch(`${API_BASE_URL}/api/projects/client/my`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// ==================== PROPOSALS API ====================

export const submitProposal = async (projectId, proposalData) => {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/proposals`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(proposalData)
  });
  return handleResponse(response);
};

export const getProjectProposals = async (projectId) => {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/proposals`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getMyProposals = async () => {
  const response = await fetch(`${API_BASE_URL}/api/proposals/freelancer`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const updateProposalStatus = async (proposalId, status) => {
  const response = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });
  return handleResponse(response);
};

// ==================== FREELANCERS & PROFILES API ====================

export const getFreelancers = async ({ search } = {}) => {
  const params = new URLSearchParams({ accountType: "freelancer" });
  if (search) params.append("search", search);

  const response = await fetch(`${API_BASE_URL}/api/users?${params.toString()}`);
  return handleResponse(response);
};

export const getUserProfile = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/users/${id}`);
  return handleResponse(response);
};

export const getMyProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/api/users/profile/me`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const updateProfile = async (profileData) => {
  const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData)
  });
  return handleResponse(response);
};

export const addShowcaseProject = async (projectData) => {
  const response = await fetch(`${API_BASE_URL}/api/users/projects`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData)
  });
  return handleResponse(response);
};

export const updateShowcaseProject = async (projectId, projectData) => {
  const response = await fetch(`${API_BASE_URL}/api/users/projects/${projectId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData)
  });
  return handleResponse(response);
};

export const deleteShowcaseProject = async (projectId) => {
  const response = await fetch(`${API_BASE_URL}/api/users/projects/${projectId}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// ==================== HIRING REQUESTS API ====================

export const createHiringRequest = async (requestData) => {
  const response = await fetch(`${API_BASE_URL}/api/hiring-requests`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(requestData)
  });
  return handleResponse(response);
};

export const getFreelancerHiringRequests = async () => {
  const response = await fetch(`${API_BASE_URL}/api/hiring-requests/freelancer`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const getClientHiringRequests = async () => {
  const response = await fetch(`${API_BASE_URL}/api/hiring-requests/client`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const updateHiringRequestStatus = async (requestId, status) => {
  const response = await fetch(`${API_BASE_URL}/api/hiring-requests/${requestId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });
  return handleResponse(response);
};
