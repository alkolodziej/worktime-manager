const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT || 8000;
const DB_PATH = path.join(__dirname, 'db', 'db.json');

function readDb() {
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw);
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function pad(n) { return String(n).padStart(2, '0'); }
function addDays(d, n) { const x = new Date(d); x.setDate(d.getDate() + n); x.setHours(0,0,0,0); return x; }
function addMinutesToHHMM(hhmm, minutes) {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${pad(hh)}:${pad(mm)}`;
}

function ensureSeed() {
  const db = readDb();
  const now = Date.now();
  // Reseed once a day at minimum
  const oneDay = 24 * 60 * 60 * 1000;
  if (!db.meta || !db.meta.seededAt || now - db.meta.seededAt > oneDay || !db.shifts || db.shifts.length === 0) {
    const start = addDays(new Date(), 0);
    const roles = ['Kelner', 'Barista'];
    const locations = ['Restauracja Centralna', 'Kawiarnia A'];
    const startOptions = ['08:00', '10:00', '12:00', '14:00'];
    const durationOptions = [6 * 60, 8 * 60];
    const newShifts = [];
    let idCounter = 1;
    for (let i = 0; i < 28; i++) {
      const date = addDays(start, i);
      const dow = date.getDay();
      const isWorkDay = (dow >= 1 && dow <= 5) || (dow === 6 && i % 2 === 0);
      if (!isWorkDay) continue;
      const startStr = startOptions[(i + dow) % startOptions.length];
      const dur = durationOptions[(i + 1) % durationOptions.length];
      const endStr = addMinutesToHHMM(startStr, dur);
      const role = roles[(i + dow) % roles.length];
      const location = locations[(i * 3 + dow) % locations.length];
      newShifts.push({ id: String(idCounter++), date: date.toISOString(), start: startStr, end: endStr, role, location });
    }
    db.shifts = newShifts;
    db.meta = { seededAt: now };
    writeDb(db);
  }
}

function findOrCreateUser(email) {
  const db = readDb();
  let user = db.users.find(u => u.email === email);
  if (!user) {
    const id = String(db.users.length + 1);
    user = {
      id,
      email,
      name: email.split('@')[0],
      role: 'Kelner',
      phone: '',
      avatar: null,
      hourlyRate: 30.5, // Minimum 30.5 zł/h default
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
app.use(express.json());

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

app.post('/login', (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email required' });
  const user = findOrCreateUser(email);
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
  ensureSeed();
  const db = readDb();
  const { from, to } = req.query;
  let list = db.shifts.map(s => ({ ...s, date: s.date }));
  if (from) list = list.filter(s => new Date(s.date) >= new Date(from));
  if (to) list = list.filter(s => new Date(s.date) <= new Date(to));
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
  const { userId, timestamp, shiftId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const db = readDb();
  const active = db.timesheets.find(t => t.userId === userId && !t.clockOut);
  if (active) return res.status(400).json({ error: 'already clocked in' });
  const id = String(db.timesheets.length + 1);
  const nowIso = new Date(timestamp || Date.now()).toISOString();
  const entry = { id, userId, shiftId: shiftId || null, clockIn: nowIso, clockOut: null };
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
  const result = updateSwapStatus(id, 'accepted');
  if (result.error) return res.status(404).json({ error: result.error });
  // Optionally reassign shift to actor or target user
  if (actorUserId) {
    const db = readDb();
    const swap = db.swaps.find(s => s.id === id);
    const shift = db.shifts.find(s => s.id === swap.shiftId);
    if (shift) {
      shift.assignedUserId = actorUserId;
      writeDb(db);
    }
  }
  res.json(result.swap);
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
    preferences: user.preferences || {},
  });
});

// Update user profile
app.patch('/users/:id', (req, res) => {
  const db = readDb();
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  
  const updates = req.body || {};
  const currentUserRole = updates._currentUserRole;
  
  // For authorization check - remove this helper field from updates
  delete updates._currentUserRole;
  
  // Check authorization for sensitive fields
  if (updates.hourlyRate && currentUserRole !== 'Pracodawca') {
    return res.status(403).json({ error: 'Only employers can modify hourly rates' });
  }
  
  // Whitelist fields that can be updated
  const allowed = ['name', 'phone', 'avatar', 'preferences', 'role', 'hourlyRate'];
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

app.listen(PORT, '0.0.0.0', () => {
  ensureSeed();
  console.log(`WorkTime backend listening on http://0.0.0.0:${PORT}`);
});
