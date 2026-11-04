// API Helper for SPA Booking System

const API_BASE_URL = 'http://localhost:3000';

// Get authentication token
function getToken() {
  return localStorage.getItem('token');
}

// Handle API response
async function handleResponse(response) {
  const result = await response.json();

  if (!response.ok || result.success === false) {
    const details = Array.isArray(result.errors)
      ? result.errors.join(', ')
      : '';

    throw new Error(
      details
        ? `${result.message}: ${details}`
        : result.message || 'Request failed'
    );
  }

  return result.data;
}

// Main API request function
async function api(method, endpoint, body = null) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(
    `${API_BASE_URL}/api${endpoint}`,
    options
  );

  return handleResponse(response);
}

// API helper for other pages
async function apiFetch(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers
    }
  );

  return handleResponse(response);
}