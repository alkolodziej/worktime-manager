const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

const PORT = Number(process.env.PORT || process.env.BACKEND_PORT || 8000);
const HOST = process.env.HOST || process.env.BACKEND_HOST || '0.0.0.0';
const DB_PATH = path.join(__dirname, 'db', 'db.json');

function readDb() {
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw);
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function findOrCreateUser(username) {
  const db = readDb();
  let user = db.users.find(u => u.username === username);
  if (!user) {
    const id = String(db.users.length + 1);
    user = {
      id,
      username,
      name: username,
      isEmployer: false, // domyślnie pracownik
      phone: '',
      avatar: null,
      hourlyRate: 30.5, // Minimum 30.5 zł/h default
      positions: [], // Brak przypisanych stanowisk domyślnie
      preferences: {
        notificationsEnabled: true,
        remindersEnabled: true,
        reminderMinutes: 30,
      },
    };
    db.users.push(user);
    writeDb(db);
  }
  return user;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/debug', (req, res) => {
  const db = readDb();
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    shifts: (db.shifts || []).length,
    users: (db.users || []).length,
    availabilities: (db.availabilities || []).length,
    swaps: (db.swaps || []).length,
    timesheets: (db.timesheets || []).length,
  });
});

// Company (single-company setup)
app.get('/company', (req, res) => {
  const db = readDb();
  res.json(db.company || { name: 'WorkTime' });
});

// Get restaurant location
app.get('/company/location', (req, res) => {
  const db = readDb();
  const location = db.company?.location || {
    latitude: 52.2297,
    longitude: 21.0122,
    radius: 100,
    address: 'Warszawa, Polska',
    name: 'Główna restauracja',
  };
  res.json(location);
});

app.post('/login', (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'username required' });
  const user = findOrCreateUser(username);
  res.json(user);
});

app.get('/users/:id', (req, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json(user);
});

// Get all users (for picker in admin screens)
app.get('/users', (req, res) => {
  const db = readDb();
  res.json(db.users || []);
});

app.get('/shifts', (req, res) => {
  const db = readDb();
  const { from, to, assignedUserId, role } = req.query;
  let list = db.shifts.map(s => ({ ...s, date: s.date }));
  
  // Filter by date range
  if (from) list = list.filter(s => new Date(s.date) >= new Date(from));
  if (to) list = list.filter(s => new Date(s.date) <= new Date(to));
  
  // Filter by assigned user (most common use case: employee sees only their shifts)
  if (assignedUserId) list = list.filter(s => s.assignedUserId === assignedUserId);
  
  // Filter by role (optional)
  if (role) list = list.filter(s => s.role === role);
  
  res.json(list);
});

// Shifts management (employer convenience endpoints)
app.post('/shifts', (req, res) => {
  const { date, start, end, role, location, assignedUserId } = req.body || {};
  if (!date || !start || !end) return res.status(400).json({ error: 'date, start, end required' });
  const db = readDb();
  const id = String((db.shifts?.length || 0) + 1);
  const now = new Date().toISOString();
  const item = {
    id,
    date: new Date(date).toISOString(),
    start,
    end,
    role: role || 'Zmiana',
    location: location || 'Lokal',
    assignedUserId: assignedUserId || null,
    createdAt: now,
    updatedAt: now,
  };
  db.shifts = db.shifts || [];
  db.shifts.push(item);
  writeDb(db);
  res.json(item);
});

app.patch('/shifts/:id', (req, res) => {
  const db = readDb();
  const idx = db.shifts.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const updates = { ...req.body };
  if (updates.date) updates.date = new Date(updates.date).toISOString();
  updates.updatedAt = new Date().toISOString();
  db.shifts[idx] = { ...db.shifts[idx], ...updates };
  writeDb(db);
  res.json(db.shifts[idx]);
});

app.delete('/shifts/:id', (req, res) => {
  const db = readDb();
  const before = db.shifts.length;
  db.shifts = db.shifts.filter(s => s.id !== req.params.id);
  const removed = before !== db.shifts.length;
  writeDb(db);
  if (!removed) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

app.post('/shifts/:id/assign', (req, res) => {
  const { userId } = req.body || {};
  const db = readDb();
  const shift = db.shifts.find(s => s.id === req.params.id);
  if (!shift) return res.status(404).json({ error: 'not found' });
  shift.assignedUserId = userId || null;
  writeDb(db);
  res.json(shift);
});

app.get('/timesheets', (req, res) => {
  const db = readDb();
  const { userId, from, to } = req.query;
  let list = db.timesheets;
  if (userId) list = list.filter(t => t.userId === userId);
  if (from) list = list.filter(t => new Date(t.clockIn) >= new Date(from));
  if (to) list = list.filter(t => new Date(t.clockIn) <= new Date(to));
  res.json(list);
});

app.post('/timesheets/clock-in', (req, res) => {
  const { userId, timestamp, shiftId, location } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const db = readDb();
  const active = db.timesheets.find(t => t.userId === userId && !t.clockOut);
  if (active) return res.status(400).json({ error: 'already clocked in' });
  const id = String(db.timesheets.length + 1);
  const nowIso = new Date(timestamp || Date.now()).toISOString();
  const entry = {
    id,
    userId,
    shiftId: shiftId || null,
    clockIn: nowIso,
    clockOut: null,
    checkInLocation: location || null, // Store check-in location
  };
  db.timesheets.push(entry);
  writeDb(db);
  res.json(entry);
});

app.post('/timesheets/clock-out', (req, res) => {
  const { userId, timestamp } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const db = readDb();
  const active = db.timesheets.find(t => t.userId === userId && !t.clockOut);
  if (!active) return res.status(400).json({ error: 'not clocked in' });
  active.clockOut = new Date(timestamp || Date.now()).toISOString();
  writeDb(db);
  res.json(active);
});

// Get active (ongoing) timesheet for a user
app.get('/timesheets/active/:userId', (req, res) => {
  const db = readDb();
  const { userId } = req.params;
  const active = (db.timesheets || []).find(t => t.userId === userId && !t.clockOut);
  if (!active) return res.status(404).json({ error: 'not clocked in' });
  res.json(active);
});

// Availability endpoints
app.get('/availabilities', (req, res) => {
  const db = readDb();
  const { userId, from, to } = req.query;
  let list = db.availabilities || [];
  if (userId) list = list.filter(a => a.userId === userId);
  if (from) list = list.filter(a => new Date(a.date) >= new Date(from));
  if (to) list = list.filter(a => new Date(a.date) <= new Date(to));
  res.json(list);
});

app.post('/availabilities', (req, res) => {
  const { userId, date, start, end, notes } = req.body || {};
  if (!userId || !date || !start || !end) return res.status(400).json({ error: 'userId, date, start, end required' });
  const db = readDb();
  db.availabilities = db.availabilities || [];
  const id = String(db.availabilities.length + 1);
  const now = new Date().toISOString();
  const item = { id, userId, date: new Date(date).toISOString(), start, end, notes: notes || '', createdAt: now, updatedAt: now };
  db.availabilities.push(item);
  writeDb(db);
  res.json(item);
});

app.delete('/availabilities/:id', (req, res) => {
  const db = readDb();
  const before = (db.availabilities || []).length;
  db.availabilities = (db.availabilities || []).filter(a => a.id !== req.params.id);
  const removed = before !== db.availabilities.length;
  writeDb(db);
  if (!removed) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

// Swaps endpoints
app.get('/swaps', (req, res) => {
  const db = readDb();
  const { userId } = req.query;
  let list = db.swaps || [];
  if (userId) {
    list = list.filter(s => s.requesterId === userId || s.targetUserId === userId);
  }
  res.json(list);
});

app.post('/swaps', (req, res) => {
  const { shiftId, requesterId, targetUserId } = req.body || {};
  if (!shiftId || !requesterId) return res.status(400).json({ error: 'shiftId, requesterId required' });
  const db = readDb();
  db.swaps = db.swaps || [];
  const id = String(db.swaps.length + 1);
  const now = new Date().toISOString();
  const item = { id, shiftId, requesterId, targetUserId: targetUserId || null, status: 'pending', createdAt: now, updatedAt: now };
  db.swaps.push(item);
  writeDb(db);
  res.json(item);
});

function updateSwapStatus(id, status) {
  const db = readDb();
  const swap = (db.swaps || []).find(s => s.id === id);
  if (!swap) return { error: 'not found' };
  swap.status = status;
  swap.updatedAt = new Date().toISOString();
  writeDb(db);
  return { swap };
}

app.post('/swaps/:id/accept', (req, res) => {
  const { id } = req.params;
  const { actorUserId } = req.body || {};
  const db = readDb();
  
  // Validate: can only accept if you're either requester or target
  const swap = (db.swaps || []).find(s => s.id === id);
  if (!swap) return res.status(404).json({ error: 'swap not found' });
  
  const isRequester = swap.requesterId === actorUserId;
  const isTarget = swap.targetUserId === actorUserId;
  if (!isRequester && !isTarget && actorUserId) {
    return res.status(403).json({ error: 'Only requester or target can accept' });
  }
  
  // Update swap status
  const result = updateSwapStatus(id, 'accepted');
  if (result.error) return res.status(404).json({ error: result.error });
  
  // **IMPORTANT**: Reassign shift to the requester (who wanted the swap)
  const updatedSwap = (db.swaps || []).find(s => s.id === id);
  const shift = db.shifts.find(s => s.id === updatedSwap.shiftId);
  if (shift && updatedSwap) {
    shift.assignedUserId = updatedSwap.requesterId;
    writeDb(db);
  }
  
  res.json(updatedSwap);
});

app.post('/swaps/:id/reject', (req, res) => {
  const { id } = req.params;
  const result = updateSwapStatus(id, 'rejected');
  if (result.error) return res.status(404).json({ error: result.error });
  res.json(result.swap);
});

app.post('/swaps/:id/cancel', (req, res) => {
  const { id } = req.params;
  const result = updateSwapStatus(id, 'cancelled');
  if (result.error) return res.status(404).json({ error: result.error });
  res.json(result.swap);
});

// ========== AUTH MIDDLEWARE (placeholder for token-based auth) ==========
// TODO: Replace with real JWT validation once auth system is implemented
function getCurrentUserFromRequest(req) {
  // Placeholder: eventually this will extract user from JWT token
  // For now, we read from client-sent header or body for backward compatibility
  const userId = req.headers['x-user-id'] || req.body?._userId;
  if (!userId) return null;
  const db = readDb();
  return db.users.find(u => u.id === userId);
}

// ========== USER PROFILE ENDPOINTS ==========
// Get user profile with extended info
app.get('/users/:id/profile', (req, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json({
    ...user,
    phone: user.phone || '',
    avatar: user.avatar || null,
    photoUri: user.photoUri || null,
    photoBase64: user.photoBase64 || null,
    preferences: user.preferences || {},
  });
});

// Update user profile
app.patch('/users/:id', (req, res) => {
  const db = readDb();
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  
  const updates = req.body || {};
  // Remove client-side authorization hint; use server-side role check instead
  const requestingUser = getCurrentUserFromRequest(req) || db.users.find(u => u.id === req.params.id);
  delete updates._currentUserRole;
  delete updates._userId;
  
  // Check authorization for sensitive fields (only employers can modify hourly rates of others)
  if (updates.hourlyRate && req.params.id !== requestingUser?.id) {
    if (requestingUser?.role !== 'Pracodawca') {
      return res.status(403).json({ error: 'Only employers can modify employee rates' });
    }
  }
  
  // Whitelist fields that can be updated
  const allowed = ['name', 'phone', 'avatar', 'photoUri', 'photoBase64', 'preferences', 'role', 'hourlyRate'];
  for (const field of allowed) {
    if (field in updates) {
      // Validate hourlyRate minimum 30.5 zł/h
      if (field === 'hourlyRate') {
        const rate = parseFloat(updates[field]);
        if (isNaN(rate) || rate < 30.5) {
          return res.status(400).json({ error: 'hourlyRate minimum is 30.5 zł/h' });
        }
        db.users[idx][field] = rate;
      } else {
        db.users[idx][field] = updates[field];
      }
    }
  }
  
  writeDb(db);
  res.json(db.users[idx]);
});

// ========== AVAILABILITY ENDPOINTS (EXTENDED) ==========
// Update availability
app.patch('/availabilities/:id', (req, res) => {
  const db = readDb();
  const idx = (db.availabilities || []).findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const updates = req.body || {};
  if (updates.date) updates.date = new Date(updates.date).toISOString();
  updates.updatedAt = new Date().toISOString();
  db.availabilities[idx] = { ...db.availabilities[idx], ...updates };
  writeDb(db);
  res.json(db.availabilities[idx]);
});

// ========== STATISTICS ENDPOINTS ==========
// Get user weekly statistics (hours worked)
app.get('/users/:userId/stats/weekly', (req, res) => {
  const db = readDb();
  const userId = req.params.userId;
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'user not found' });

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const timesheets = (db.timesheets || []).filter(t => 
    t.userId === userId && 
    new Date(t.clockIn) >= weekStart && 
    new Date(t.clockIn) < weekEnd &&
    t.clockOut
  );

  let totalMinutes = 0;
  const dailyBreakdown = {};
  timesheets.forEach(ts => {
    const clockIn = new Date(ts.clockIn);
    const clockOut = new Date(ts.clockOut);
    const day = clockIn.toLocaleDateString('pl-PL', { weekday: 'short', month: 'short', day: 'numeric' });
    const minutes = (clockOut - clockIn) / (1000 * 60);
    totalMinutes += minutes;
    dailyBreakdown[day] = (dailyBreakdown[day] || 0) + minutes;
  });

  res.json({
    userId,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    totalHours: (totalMinutes / 60).toFixed(2),
    totalMinutes,
    dailyBreakdown,
    entriesCount: timesheets.length,
  });
});

// Get all company statistics
app.get('/stats/company', (req, res) => {
  const db = readDb();
  const stats = {
    users: db.users.length,
    activeUsers: (db.timesheets || []).filter(t => !t.clockOut).length,
    shifts: db.shifts.length,
    unassignedShifts: db.shifts.filter(s => !s.assignedUserId).length,
    availabilities: (db.availabilities || []).length,
    pendingSwaps: (db.swaps || []).filter(s => s.status === 'pending').length,
    totalTimesheets: (db.timesheets || []).length,
  };
  res.json(stats);
});

// ========== CONTEXT ENDPOINT (load all relevant data for user) ==========
app.get('/context/:userId', (req, res) => {
  const db = readDb();
  const userId = req.params.userId;
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'user not found' });

  // Get user's shifts (assigned + unassigned if admin)
  let userShifts = db.shifts || [];
  if (user.role !== 'Pracodawca') {
    userShifts = userShifts.filter(s => s.assignedUserId === userId);
  }

  // Get user's availabilities
  const userAvailabilities = (db.availabilities || []).filter(a => a.userId === userId);

  // Get user's swaps
  const userSwaps = (db.swaps || []).filter(s => s.requesterId === userId || s.targetUserId === userId);

  // Get user's timesheets
  const userTimesheets = (db.timesheets || []).filter(t => t.userId === userId);

  res.json({
    user: {
      ...user,
      phone: user.phone || '',
      avatar: user.avatar || null,
      preferences: user.preferences || {},
    },
    shifts: userShifts,
    availabilities: userAvailabilities,
    swaps: userSwaps,
    timesheets: userTimesheets,
    company: db.company || { name: 'WorkTime' },
  });
});

// ========== POSITIONS ENDPOINTS ==========
// Get all positions
app.get('/positions', (req, res) => {
  const db = readDb();
  const activeOnly = req.query.active === 'true';
  let positions = db.positions || [];
  if (activeOnly) {
    positions = positions.filter(p => p.active);
  }
  res.json(positions);
});

// Get position by ID
app.get('/positions/:id', (req, res) => {
  const db = readDb();
  const position = (db.positions || []).find(p => p.id === req.params.id);
  if (!position) return res.status(404).json({ error: 'position not found' });
  res.json(position);
});

// Assign positions to user
app.post('/users/:userId/positions', (req, res) => {
  const { positionIds } = req.body || {};
  if (!Array.isArray(positionIds)) {
    return res.status(400).json({ error: 'positionIds array required' });
  }

  const db = readDb();
  const user = db.users.find(u => u.id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'user not found' });

  // Validate all position IDs exist
  const validIds = positionIds.filter(id => 
    (db.positions || []).some(p => p.id === id)
  );

  user.positions = validIds;
  writeDb(db);
  res.json(user);
});

// Remove position from user
app.delete('/users/:userId/positions/:positionId', (req, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'user not found' });

  user.positions = (user.positions || []).filter(p => p !== req.params.positionId);
  writeDb(db);
  res.json(user);
});

// Get all employees with specific position
app.get('/positions/:positionId/employees', (req, res) => {
  const db = readDb();
  const employees = db.users.filter(u => 
    !u.isEmployer && 
    (u.positions || []).includes(req.params.positionId)
  );
  res.json(employees);
});

// ========== EMPLOYER ENDPOINTS (set hourly rates for employees) ==========
// Set employee hourly rate (employer only)
app.post('/employer/employees/:userId/rate', (req, res) => {
  const { employerId, hourlyRate } = req.body || {};
  if (!employerId || !hourlyRate) {
    return res.status(400).json({ error: 'employerId and hourlyRate required' });
  }

  const db = readDb();
  const employer = db.users.find(u => u.id === employerId);
  if (!employer || employer.role !== 'Pracodawca') {
    return res.status(403).json({ error: 'Only employer can set rates' });
  }

  const rateNum = parseFloat(hourlyRate);
  if (isNaN(rateNum) || rateNum < 30.5) {
    return res.status(400).json({ error: 'hourlyRate minimum is 30.5 zł/h' });
  }

  const employee = db.users.find(u => u.id === req.params.userId);
  if (!employee) return res.status(404).json({ error: 'employee not found' });

  employee.hourlyRate = rateNum;
  writeDb(db);
  res.json({
    message: 'Rate updated',
    userId: employee.id,
    hourlyRate: employee.hourlyRate,
  });
});

app.listen(PORT, HOST, () => {
  console.log(`WorkTime backend listening on http://${HOST}:${PORT}`);
});
