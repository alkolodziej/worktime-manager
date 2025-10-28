const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT || 4000;
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
    user = { id, email, name: email.split('@')[0], role: 'Kelner' };
    db.users.push(user);
    writeDb(db);
  }
  return user;
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

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
  const item = {
    id,
    date: new Date(date).toISOString(),
    start,
    end,
    role: role || 'Zmiana',
    location: location || 'Lokal',
    assignedUserId: assignedUserId || null,
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
  const item = { id, userId, date: new Date(date).toISOString(), start, end, notes: notes || '' };
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

app.listen(PORT, () => {
  ensureSeed();
  console.log(`WorkTime backend listening on http://localhost:${PORT}`);
});
