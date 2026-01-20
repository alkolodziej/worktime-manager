import { Platform } from 'react-native';

let cachedBaseUrl = null;

export function getBaseUrl() {
  // Cache the URL to avoid repeated calls
  if (cachedBaseUrl) return cachedBaseUrl;

  // Use environment variable for backend host, or default to localhost
  const backendHost = process.env.EXPO_PUBLIC_BACKEND_HOST || 'localhost';
  const backendPort = process.env.EXPO_PUBLIC_BACKEND_PORT || 8000;

  cachedBaseUrl = `http://${backendHost}:${backendPort}`;
  console.log('Backend URL:', cachedBaseUrl);
  return cachedBaseUrl;
}

// Export for use in other modules like location.js
export const API_BASE_URL = getBaseUrl();

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

export async function apiLogin(username, password) {
  // If password is provided, send it. If not (legacy/mock logic), body handles it.
  return http('/login', { method: 'POST', body: { username, password } });
}

export async function apiRegister(username, password, name) {
  return http('/register', { method: 'POST', body: { username, password, name } });
}

export async function apiGetDashboard(userId) { return http(`/dashboard/${userId}`); }

export async function apiGetShifts({ from, to, assignedUserId, groupBy, summary } = {}) {
  const params = new URLSearchParams();
  if (from) params.set('from', from instanceof Date ? from.toISOString() : from);
  if (to) params.set('to', to instanceof Date ? to.toISOString() : to);
  if (assignedUserId) params.set('assignedUserId', assignedUserId);
  if (groupBy) params.set('groupBy', groupBy);
  if (summary) params.set('summary', summary);
  
  const data = await http(`/shifts${params.toString() ? `?${params.toString()}` : ''}`);
  
  // If array, map dates
  if (Array.isArray(data)) {
    return data.map((s) => ({ ...s, date: new Date(s.date) }));
  }
  
  // If grouped object (dictionary)
  if (groupBy === 'date' && !summary) {
      // Map dates inside the object values
      const result = {};
      Object.keys(data).forEach(key => {
          result[key] = data[key].map(s => ({ ...s, date: new Date(s.date) }));
      });
      return result;
  }

  // If summary response { data, totalMinutes }
  if (summary) {
      // "data.data" can be array or object. 
      // If our backend returns "data" field for the list/grouped
      // My backend implementation: res.json({ data: result, totalMinutes })
      // And result is either Array or Object(grouped)
      
      const rawData = data.data;
      let parsedData = rawData;
      
      if (Array.isArray(rawData)) {
          parsedData = rawData.map(s => ({ ...s, date: new Date(s.date) }));
      } else if (rawData && typeof rawData === 'object') {
          parsedData = {};
          Object.keys(rawData).forEach(key => {
              parsedData[key] = rawData[key].map(s => ({ ...s, date: new Date(s.date) }));
          });
      }
      
      return { ...data, data: parsedData };
  }

  return data;
}

export async function apiClockIn({ userId, shiftId, timestamp, location }) {
  return http('/timesheets/clock-in', {
    method: 'POST',
    body: { userId, shiftId, timestamp, location },
  });
}

export async function apiClockOut({ userId, timestamp }) {
  return http('/timesheets/clock-out', { method: 'POST', body: { userId, timestamp } });
}

// Company
export async function apiGetCompany() {
  return http('/company');
}

// Users
// New optimized endpoint for availability
export async function apiGetAvailableUsers(date) {
  return http(`/users/filter?date=${date}`);
}

export async function apiGetUsers() {
  return http('/users');
}

export async function apiDeleteUser(userId) {
  return http(`/users/${userId}`, { method: 'DELETE' });
}

export async function apiGetFilteredUsers({ date, positionIds, includeUnavailable = false } = {}) {
  const params = new URLSearchParams();
  if (date) params.append('date', typeof date === 'string' ? date : date.toISOString());
  if (positionIds) params.append('positionIds', Array.isArray(positionIds) ? positionIds.join(',') : positionIds);
  if (includeUnavailable) params.append('includeUnavailable', 'true');
  return http(`/users/filter?${params.toString()}`);
}

// Availabilities
export async function apiGetAvailabilities({ userId, from, to, includeNames } = {}) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (from) params.set('from', from.toISOString());
  if (to) params.set('to', to.toISOString());
  if (includeNames) params.set('includeNames', 'true');
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
export async function apiGetSwaps({ userId, type, includeNames } = {}) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (type) params.set('type', type);
  if (includeNames) params.set('includeNames', 'true');
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

// Get active (ongoing) timesheet — useful for app restart persistence
export async function apiGetActiveTimesheet(userId) {
  return http(`/timesheets/active/${userId}`);
}

// User profile endpoints
export async function apiGetUserProfile(userId) {
  return http(`/users/${userId}/profile`);
}

export async function apiUpdateUserProfile(userId, updates) {
  return http(`/users/${userId}`, { method: 'PATCH', body: updates });
}

// Upload user profile photo (base64)
export async function apiUploadProfilePhoto(userId, photoBase64, fileName = 'profile.jpg') {
  return http(`/users/${userId}`, {
    method: 'PATCH',
    body: {
      photoBase64,
      photoFileName: fileName,
    },
  });
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
// Positions endpoints
export async function apiGetPositions(activeOnly = true) {
  const params = activeOnly ? '?active=true' : '';
  return http(`/positions${params}`);
}

export async function apiGetPosition(positionId) {
  return http(`/positions/${positionId}`);
}

export async function apiAssignPositions(userId, positionIds) {
  return http(`/users/${userId}/positions`, {
    method: 'POST',
    body: { positionIds },
  });
}

export async function apiRemovePosition(userId, positionId) {
  return http(`/users/${userId}/positions/${positionId}`, {
    method: 'DELETE',
  });
}

export async function apiGetEmployeesByPosition(positionId) {
  return http(`/positions/${positionId}/employees`);
}

export async function apiGetEarningsReport(userId, date) {
  return http(`/reports/earnings?userId=${userId}&date=${date}`);
}
