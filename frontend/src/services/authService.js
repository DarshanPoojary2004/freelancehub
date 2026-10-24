const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const requestAuth = async (endpoint, payload) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Authentication request failed");
  }

  return result.data;
};

const saveSession = ({ token, user }) => {
  localStorage.setItem("authToken", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const login = async (email, password) => {
  const data = await requestAuth("login", { email, password });
  saveSession(data);
  return data.user;
};

export const register = async (formData) => {
  const data = await requestAuth("register", formData);
  saveSession(data);
  return data.user;
};
