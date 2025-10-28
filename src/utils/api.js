import { Platform } from 'react-native';

function getBaseUrl() {
  // For Android emulator use 10.0.2.2, otherwise localhost
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  const port = 4000;
  return `http://${host}:${port}`;
}

async function http(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
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

// Availabilities
export async function apiGetAvailabilities({ userId, from, to } = {}) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (from) params.set('from', from.toISOString());
  if (to) params.set('to', to.toISOString());
  return http(`/availabilities${params.toString() ? `?${params.toString()}` : ''}`);
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
