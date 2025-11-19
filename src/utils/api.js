import { Platform } from 'react-native';

let cachedBaseUrl = null;

function getBaseUrl() {
  // Cache the URL to avoid repeated calls
  if (cachedBaseUrl) return cachedBaseUrl;

  // Use environment variable for backend host, or default to localhost
  const backendHost = process.env.EXPO_PUBLIC_BACKEND_HOST || 'localhost';
  const backendPort = process.env.EXPO_PUBLIC_BACKEND_PORT || 4000;

  cachedBaseUrl = `http://${backendHost}:${backendPort}`;
  console.log('Backend URL:', cachedBaseUrl);
  return cachedBaseUrl;
}

async function http(path, { method = 'GET', body } = {}) {
  const baseUrl = getBaseUrl();
  const fullUrl = `${baseUrl}${path}`;
  
  try {
    console.log(`[API] ${method} ${fullUrl}`);
    
    // Add timeout of 10 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[API] Error ${res.status}:`, text);
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    
    const json = await res.json();
    console.log(`[API] Success ${method} ${path}`);
    return json;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`[API] Timeout on ${fullUrl}`);
      throw new Error('Request timeout - backend may be unreachable');
    }
    console.error(`[API] Network error on ${fullUrl}:`, error.message);
    throw error;
  }
}

export async function apiLogin(email) {
  return http('/login', { method: 'POST', body: { email } });
}

export async function apiGetShifts({ from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.set('from', from.toISOString());
  if (to) params.set('to', to.toISOString());
  const data = await http(`/shifts${params.toString() ? `?${params.toString()}` : ''}`);
  // Convert date strings to Date objects
  return data.map((s) => ({ ...s, date: new Date(s.date) }));
}

export async function apiClockIn({ userId, shiftId, timestamp }) {
  return http('/timesheets/clock-in', { method: 'POST', body: { userId, shiftId, timestamp } });
}

export async function apiClockOut({ userId, timestamp }) {
  return http('/timesheets/clock-out', { method: 'POST', body: { userId, timestamp } });
}

// Company
export async function apiGetCompany() {
  return http('/company');
}

// Users
export async function apiGetUsers() {
  return http('/users');
}

// Availabilities
export async function apiGetAvailabilities({ userId, from, to } = {}) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (from) params.set('from', from.toISOString());
  if (to) params.set('to', to.toISOString());
  const data = await http(`/availabilities${params.toString() ? `?${params.toString()}` : ''}`);
  return Array.isArray(data) ? data : [];
}

export async function apiCreateAvailability({ userId, date, start, end, notes }) {
  return http('/availabilities', { method: 'POST', body: { userId, date, start, end, notes } });
}

export async function apiDeleteAvailability(id) {
  return http(`/availabilities/${id}`, { method: 'DELETE' });
}

// Swaps
export async function apiGetSwaps({ userId } = {}) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  return http(`/swaps${params.toString() ? `?${params.toString()}` : ''}`);
}

export async function apiCreateSwap({ shiftId, requesterId, targetUserId }) {
  return http('/swaps', { method: 'POST', body: { shiftId, requesterId, targetUserId } });
}

export async function apiAcceptSwap({ id, actorUserId }) {
  return http(`/swaps/${id}/accept`, { method: 'POST', body: { actorUserId } });
}

export async function apiRejectSwap({ id, actorUserId }) {
  return http(`/swaps/${id}/reject`, { method: 'POST', body: { actorUserId } });
}

export async function apiCancelSwap({ id, actorUserId }) {
  return http(`/swaps/${id}/cancel`, { method: 'POST', body: { actorUserId } });
}

// Shift management
export async function apiCreateShift({ date, start, end, role, location, assignedUserId }) {
  return http('/shifts', { method: 'POST', body: { date, start, end, role, location, assignedUserId } });
}

export async function apiUpdateShift(id, updates) {
  return http(`/shifts/${id}`, { method: 'PATCH', body: updates });
}

export async function apiDeleteShift(id) {
  return http(`/shifts/${id}`, { method: 'DELETE' });
}

export async function apiAssignShift(id, userId) {
  return http(`/shifts/${id}/assign`, { method: 'POST', body: { userId } });
}

// Timesheets
export async function apiGetTimesheets({ userId, from, to } = {}) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (from) params.set('from', from.toISOString());
  if (to) params.set('to', to.toISOString());
  return http(`/timesheets${params.toString() ? `?${params.toString()}` : ''}`);
}

// User profile endpoints
export async function apiGetUserProfile(userId) {
  return http(`/users/${userId}/profile`);
}

export async function apiUpdateUserProfile(userId, updates) {
  return http(`/users/${userId}`, { method: 'PATCH', body: updates });
}

// Extended availability functions
export async function apiUpdateAvailability(id, updates) {
  return http(`/availabilities/${id}`, { method: 'PATCH', body: updates });
}

// Statistics endpoints
export async function apiGetUserWeeklyStats(userId) {
  return http(`/users/${userId}/stats/weekly`);
}

export async function apiGetCompanyStats() {
  return http('/stats/company');
}

// Context endpoint - loads all user's data at once
export async function apiLoadUserContext(userId) {
  return http(`/context/${userId}`);
}

// Employer endpoints
export async function apiSetEmployeeHourlyRate(employerId, userId, hourlyRate) {
  return http(`/employer/employees/${userId}/rate`, {
    method: 'POST',
    body: { employerId, hourlyRate },
  });
}