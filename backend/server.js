const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { parseISO, differenceInMinutes, startOfMonth, endOfMonth, addMinutes, startOfWeek, endOfWeek } = require('date-fns');

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

// LOCATION CHECK ENDPOINT
// Validates user coordinates against company location using Haversine formula.
// Moves logic from frontend: protecting company coordinates, geospatial math.
app.post('/company/check-location', (req, res) => {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) return res.status(400).json({ error: 'Missing coords' });

    const db = readDb();
    const target = db.company?.location || { latitude: 52.2297, longitude: 21.0122, radius: 100 };
    
    // Haversine formula
    const R = 6371e3; 
    const φ1 = (latitude * Math.PI) / 180;
    const φ2 = (target.latitude * Math.PI) / 180;
    const Δφ = ((target.latitude - latitude) * Math.PI) / 180;
    const Δλ = ((target.longitude - longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // meters
    
    res.json({
        isWithin: distance <= target.radius,
        distance: Math.round(distance),
        radius: target.radius
    });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username) return res.status(400).json({ error: 'username required' });
  
  const db = readDb();
  const user = db.users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ error: 'Nieprawidłowa nazwa użytkownika lub hasło' });
  }

  // If user has a password set, verify it
  if (user.password && user.password !== password) {
    return res.status(401).json({ error: 'Nieprawidłowa nazwa użytkownika lub hasło' });
  }

  // If user has NO password (legacy), we might allow access or require registration
  // For now, if we want strict password enforcement:
  if (!user.password && password) {
     // Optional: We could update the password here if we wanted "claim on first login"
     // But strictly, we should probably fail or assume legacy users are insecure.
     // Let's allow legacy users for now to avoid breaking everyone, but
     // new users (via register) will have passwords.
  }

  res.json(user);
});

app.post('/register', (req, res) => {
  const { username, password, name } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Wymagane nazwa użytkownika i hasło.' });
  }

  const db = readDb();
  if (db.users.find(u => u.username === username)) {
    return res.status(409).json({ error: 'Taki użytkownik już istnieje.' });
  }

  const id = String(Date.now());
  const newUser = {
    id,
    username,
    password,
    name: name || username,
    isEmployer: false,
    phone: '',
    avatar: null,
    hourlyRate: 30.5,
    positions: [], // Positions will be set in onboarding
    preferences: {
      notificationsEnabled: true,
      remindersEnabled: true,
      reminderMinutes: 30,
    },
  };

  db.users.push(newUser);
  writeDb(db);
  res.json(newUser);
});

// Filter users by positions and availability (for shift assignment)
// MUST be before /users/:id to avoid route conflict
app.get('/users/filter', (req, res) => {
  const db = readDb();
  const { date, positionIds, includeUnavailable } = req.query;
  console.log('Filtering users with params:', { date, positionIds, includeUnavailable });
  let usersList = (db.users || []).filter(u => !u.isEmployer);
  
  // Filter by positions (OR logic: user must have at least ONE of the specified positions)
  if (positionIds && positionIds !== 'all') {
    const positionIdsArray = positionIds.split(',');
    usersList = usersList.filter(user => {
      const userPositions = user.positions || [];
      return positionIdsArray.some(posId => userPositions.includes(posId));
    });
  }
  
  // Get availability for the date if provided
  let availabilityMap = {};
  if (date) {
    const dateStr = new Date(date).toISOString().split('T')[0];
    (db.availabilities || []).forEach(avail => {
      const availDate = typeof avail.date === 'string' ? avail.date.split('T')[0] : avail.date;
      if (availDate === dateStr) {
        availabilityMap[avail.userId] = avail;
      }
    });
  }
  
  // Filter out unavailable users unless includeUnavailable is true
  if (!includeUnavailable || includeUnavailable === 'false') {
    usersList = usersList.filter(user => !!availabilityMap[user.id]);
  }
  
  // Sort: available users first, then unavailable
  usersList.sort((a, b) => {
    const aHasAvail = !!availabilityMap[a.id];
    const bHasAvail = !!availabilityMap[b.id];
    if (aHasAvail && !bHasAvail) return -1;
    if (!aHasAvail && bHasAvail) return 1;
    return 0;
  });
  
  // Attach availability to each user
  const result = usersList.map(user => ({
    ...user,
    availability: availabilityMap[user.id] || null,
  }));
  
  res.json(result);
});

// Get all users (for picker in admin screens)
app.get('/users', (req, res) => {
  const db = readDb();
  res.json(db.users || []);
});

app.get('/users/:id', (req, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json(user);
});

app.delete('/users/:id', (req, res) => {
  const db = readDb();
  const userId = req.params.id;
  const initialLength = db.users.length;
  
  // Prevent deleting if it's the last admin? Not required by prompt.
  
  db.users = db.users.filter(u => u.id !== userId);
  
  if (db.users.length === initialLength) {
    return res.status(404).json({ error: 'Użytkownik nie znaleziony.' });
  }
  
  writeDb(db);
  res.json({ success: true, id: userId });
});

// Helper to get shift start/end as Date objects
function getShiftIntervals(shift) {
  // Try parsing strictly as date objects first (ISO format from admin panel)
  let start = new Date(shift.start);
  let end = new Date(shift.end);

  // If invalid date (NaN), then fallback to HH:MM construction (legacy/mock)
  if (isNaN(start.getTime())) {
      const dateStr = shift.date.split('T')[0];
      start = new Date(`${dateStr}T${shift.start}:00`);
  }
  
  if (isNaN(end.getTime())) {
      const dateStr = shift.date.split('T')[0];
      end = new Date(`${dateStr}T${shift.end}:00`);
  }

  // Handle overnight logic ONLY if we constructed dates manually from HH:MM 
  // (Assuming ISO timestamps are already correct absolute times)
  if (end < start && shift.start.length <= 5) {
     end = addMinutes(end, 24 * 60);
  }

  return { start, end };
}

// DASHBOARD ENDPOINT
// Returns consolidated view for HomeScreen: next shift, active timer, validation rules, weekly summary.
// Moves logic from frontend: calculating next shift, summing weekly hours, checking clock-in rules.
app.get('/dashboard/:userId', (req, res) => {
  const { userId } = req.params;
  const db = readDb();
  const now = new Date();

  // 1. Find Next Shift
  const userShifts = (db.shifts || []).filter(s => s.assignedUserId === userId);
  const upcoming = userShifts.map(s => {
      const { start, end } = getShiftIntervals(s);
      return { ...s, startTime: start, endTime: end };
  })
  .filter(s => s.endTime > now) // Only shifts that haven't ended
  .sort((a, b) => a.startTime - b.startTime);

  const nextShift = upcoming[0] ? {
      ...upcoming[0],
      startTime: upcoming[0].startTime.toISOString(),
      endTime: upcoming[0].endTime.toISOString(),
      isToday: upcoming[0].startTime.toDateString() === now.toDateString()
  } : null;

  // 2. Calculate Weekly Stats (Mon-Sun)
  const current = new Date(now);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);

  // Worked
  const timesheets = (db.timesheets || []).filter(t => t.userId === userId);
  let workedMinutes = 0;
  timesheets.forEach(t => {
      const inTime = parseISO(t.clockIn);
      // Check overlap with this week
      if (inTime >= monday && inTime < nextMonday && t.clockOut) {
          workedMinutes += differenceInMinutes(parseISO(t.clockOut), inTime);
      }
  });

  // Planned
  let plannedMinutes = 0;
  userShifts.forEach(s => {
      // Check if shift date falls in this week
      const sDate = parseISO(s.date);
      if (sDate >= monday && sDate < nextMonday) {
          const { start, end } = getShiftIntervals(s);
          plannedMinutes += differenceInMinutes(end, start);
      }
  });

  // 3. Clock-In Validation Rules
  const clockInRules = {
      canClockIn: false,
      status: 'no_shift',
      message: 'Brak zaplanowanej zmiany na dzisiaj'
  };

  if (nextShift && nextShift.isToday) {
      const start = new Date(nextShift.startTime);
      const end = new Date(nextShift.endTime);
      const bufferMs = 30 * 60 * 1000;
      const earlyStart = new Date(start.getTime() - bufferMs);

      if (now < earlyStart) {
           clockInRules.status = 'too_early';
           const minsToStart = Math.ceil((start - now) / 60000);
           const h = Math.floor(minsToStart / 60);
           const m = minsToStart % 60;
           clockInRules.message = `Za wcześnie. Start za ${h > 0 ? h + 'h ' : ''}${m}m`;
      } else if (now > end) {
           clockInRules.status = 'shift_ended';
           clockInRules.message = 'Czas zmiany minął';
      } else {
           clockInRules.canClockIn = true;
           clockInRules.status = 'ok';
           clockInRules.message = 'Możesz rozpocząć pracę';
      }
  }

  // Calculate target based on user monthly goal (approx / 4 weeks)
  const user = db.users.find(u => u.id === userId);
  const monthlyGoalHours = user?.monthlyGoal || 160; 
  const targetMinutes = Math.round((monthlyGoalHours / 4) * 60);

  res.json({
      nextShift,
      clockInRules,
      weekSummary: {
          workedMinutes,
          plannedMinutes,
          targetMinutes
      }
  });
});

app.get('/shifts', (req, res) => {
  const db = readDb();
  let { from, to, assignedUserId, role, groupBy, summary } = req.query;
  
  if (groupBy) groupBy = groupBy.trim();
  if (summary) summary = summary.trim();

  // console.log('[DEBUG] GET /shifts params:', { from, to, assignedUserId, groupBy, summary });

  let list = db.shifts.map(s => ({ ...s, date: s.date }));
  
  // Filter by date range
  if (from) list = list.filter(s => new Date(s.date) >= new Date(from));
  if (to) list = list.filter(s => new Date(s.date) <= new Date(to));
  
  // Filter by assigned user (most common use case: employee sees only their shifts)
  if (assignedUserId) list = list.filter(s => s.assignedUserId === assignedUserId);
  
  // Filter by role (optional)
  if (role) list = list.filter(s => s.role === role);

  // Grouping logic (Admin Panel)
  let result = list;
  if (groupBy === 'date') {
    const grouped = {};
    list.forEach(s => {
      const d = s.date instanceof Date ? s.date.toISOString().split('T')[0] : s.date.split('T')[0];
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(s);
    });
    result = grouped;
  }

  // Summary logic (Schedule Screen)
  if (summary === 'true') {
     let totalMinutes = 0;
     list.forEach(s => {
        const { start, end } = getShiftIntervals(s);
        const diff = differenceInMinutes(end, start);
        totalMinutes += Math.max(0, diff);
     });
     
     // Return structured response
     return res.json({
         data: result, // 'data' can be array or object (grouped)
         totalMinutes
     });
  }
  
  // If only grouped, return the object directly (for backward compat if needed, or consistency)
  // For AdminShiftsScreen which uses groupBy='date' but not summary
  if (groupBy === 'date') {
      return res.json(result);
  }
  
  res.json(result);
});

// Shifts management (employer convenience endpoints)
app.post('/shifts', (req, res) => {
  const { date, start, end, role, location, assignedUserId } = req.body || {};
  if (!date || !start || !end) return res.status(400).json({ error: 'date, start, end required' });

  // Validation: End > Start
  // Note: If we support overnight shifts in future, this logic needs adjustment (check date diff)
  // Current assumption: Strings like "HH:MM" or ISO on SAME day.
  // Assuming frontend sends full ISOs for createShift:
  if (start >= end) {
      return res.status(400).json({ error: 'Data zakończenia musi być późniejsza niż rozpoczęcia.' });
  }

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
  // Return 200 with null instead of 404 to avoid frontend console errors
  if (!active) return res.json(null);
  res.json(active);
});

// Availability endpoints
app.get('/availabilities', (req, res) => {
  const db = readDb();
  const { userId, from, to, includeNames } = req.query;
  let list = db.availabilities || [];
  if (userId) list = list.filter(a => a.userId === userId);
  if (from) list = list.filter(a => new Date(a.date) >= new Date(from));
  if (to) list = list.filter(a => new Date(a.date) <= new Date(to));
  
  if (includeNames === 'true') {
    list = list.map(a => {
        const u = db.users.find(x => x.id === a.userId);
        return { ...a, userName: u ? (u.name || u.username) : 'Unknown' };
    });
  }
  
  res.json(list);
});

app.post('/availabilities', (req, res) => {
  const { userId, date, start, end, notes } = req.body || {};
  if (!userId || !date || !start || !end) return res.status(400).json({ error: 'userId, date, start, end required' });
  
  // Validation: End > Start
  // start/end can be "HH:MM" (legacy) or full ISO strings
  // Let's normalize comparison
  let s = start, e = end;
  if (start.includes('T') && end.includes('T')) {
      if (new Date(start) >= new Date(end)) return res.status(400).json({ error: 'Data zakończenia musi być późniejsza niż rozpoczęcia.' });
  } else {
      // String comparison for HH:MM works if format is consistent (e.g. 08:00 vs 16:00)
      if (s >= e) return res.status(400).json({ error: 'Godzina do musi być późniejsza niż od.' });
  }

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
  let { userId, type, includeNames } = req.query;
  if (type) type = type.trim();
  
  let list = db.swaps || [];

  if (type === 'market') {
    if (!userId) return res.status(400).json({ error: 'userId required' });
    list = list.filter(s => 
      s.status === 'pending' && 
      s.requesterId !== userId &&
      (!s.targetUserId || s.targetUserId === userId)
    );
  } else if (type === 'mine') {
    if (!userId) return res.status(400).json({ error: 'userId required' });
    list = list.filter(s => s.requesterId === userId);
  } else if (userId) {
    list = list.filter(s => s.requesterId === userId || s.targetUserId === userId);
  }
  
  // Always include critical shift details to avoid N+1 fetches on frontend
  list = list.map(s => {
     const shift = (db.shifts || []).find(sh => sh.id === s.shiftId);
     const reqUser = (db.users || []).find(u => u.id === s.requesterId);
     const targetUser = s.targetUserId ? (db.users || []).find(u => u.id === s.targetUserId) : null;
     
     return {
        ...s,
        shift: shift ? {
            date: shift.date,
            start: shift.start,
            end: shift.end,
            role: shift.role,
            location: shift.location
        } : null,
        requesterName: reqUser ? (reqUser.name || reqUser.username) : 'Unknown',
        targetName: targetUser ? (targetUser.name || targetUser.username) : 'Ktokolwiek'
     };
  });
  
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
  
  const swap = (db.swaps || []).find(s => s.id === id);
  if (!swap) return res.status(404).json({ error: 'swap not found' });
  const shift = db.shifts.find(s => s.id === swap.shiftId);
  if (!shift) return res.status(404).json({ error: 'shift not found' });

  // Logic to determine if actor is allowed to accept
  // Case 1: Open Market (Giveaway) -> targetUserId is null. Anyone (except requester) can accept.
  if (!swap.targetUserId) {
    if (swap.requesterId === actorUserId) {
      return res.status(403).json({ error: 'Cannot accept your own open swap' });
    }
    // Actor becomes the target
    swap.targetUserId = actorUserId;
  } else {
    // Case 2: Directed Swap. Only target can accept.
    // (Or logic could differ, but let's assume target must accept)
    if (swap.targetUserId !== actorUserId && swap.requesterId !== actorUserId) {
        // Allow self-accept? No, usually not.
        return res.status(403).json({ error: 'Not authorized to accept this swap' });
    }
  }
  
  // Update swap status
  swap.status = 'accepted';
  swap.updatedAt = new Date().toISOString();
  
  // REASSIGNMENT LOGIC
  // If Requester was the owner (Giveaway) -> New Owner is Target (Actor)
  // If Requester was NOT the owner (Take Request) -> New Owner is Requester
  
  if (shift.assignedUserId === swap.requesterId) {
      // Giveaway
      shift.assignedUserId = swap.targetUserId;
  } else {
      // Take Request (someone asked for it, and presumably owner accepted)
      shift.assignedUserId = swap.requesterId;
  }
  
  writeDb(db);
  res.json(swap);
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
    if (!requestingUser?.isEmployer) {
      return res.status(403).json({ error: 'Only employers can modify employee rates' });
    }
  }
  
  // Whitelist fields that can be updated
  const allowed = ['name', 'phone', 'avatar', 'photoUri', 'photoBase64', 'preferences', 'isEmployer', 'hourlyRate', 'monthlyGoal'];
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
  if (!user.isEmployer) {
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
  if (!employer || !employer.isEmployer) {
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

// Helper to merge overlapping intervals and count minutes
function calculateNonOverlappingMinutes(intervals) {
  if (intervals.length === 0) return 0;
  // 1. Sort by start time
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  // 2. Merge
  const merged = [];
  let current = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    if (next.start < current.end) {
      // Overlap! Extend current end if needed
      if (next.end > current.end) {
        current.end = next.end;
      }
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);
  // 3. Sum duration
  let totalMinutes = 0;
  for (const interval of merged) {
    const diff = differenceInMinutes(interval.end, interval.start);
    totalMinutes += Math.max(0, diff);
  }
  return totalMinutes;
}

// EARNINGS REPORT ENDPOINT
// Returns pre-calculated financial data for EarningsCalculatorScreen.
// Moves logic from frontend: hourly rate multiplication, projection math.
app.get('/reports/earnings', (req, res) => {
  const { userId, date } = req.query; 
  if (!userId || !date) return res.status(400).json({ error: 'Missing userId or date' });
  
  const db = readDb();
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const targetDate = parseISO(date); 
  const startOfCurrentMonth = startOfMonth(targetDate);
  const endOfCurrentMonth = endOfMonth(targetDate);
  const now = new Date(); // Server time

  // 1. Worked Minutes (Timesheets)
  const validTimesheets = (db.timesheets || []).filter(t => {
    if (t.userId !== userId || !t.clockOut) return false;
    const d = parseISO(t.clockIn);
    return d >= startOfCurrentMonth && d <= endOfCurrentMonth;
  });

  const workedIntervals = validTimesheets.map(t => ({
    start: parseISO(t.clockIn),
    end: parseISO(t.clockOut)
  }));
  const workedMinutes = calculateNonOverlappingMinutes(workedIntervals);

  // 2. Planned Minutes (Future Shifts)
  const userShifts = (db.shifts || []).filter(s => {
     if (s.assignedUserId !== userId) return false;
     const sDate = parseISO(s.date);
     return sDate >= startOfCurrentMonth && sDate <= endOfCurrentMonth;
  });

  const plannedIntervals = [];
  userShifts.forEach(s => {
      // FIX: Use robust helper that handles both ISO strings and HH:MM legacy format
      const { start: startDt, end: endDt } = getShiftIntervals(s);

      // Only count if it's in the future relative to NOW
      if (startDt > now) {
          plannedIntervals.push({ start: startDt, end: endDt });
      }
  });
  const plannedMinutes = calculateNonOverlappingMinutes(plannedIntervals);

  const hourlyRate = user.hourlyRate || 0;
  const goalMinutes = (user.monthlyGoal || 160) * 60;
  
  const earnedValue = (workedMinutes / 60) * hourlyRate;
  const projectedValue = (plannedMinutes / 60) * hourlyRate;

  res.json({
      monthName: targetDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' }),
      workedMinutes,
      plannedMinutes,
      totalMinutes: workedMinutes + plannedMinutes,
      hourlyRate,
      targetMinutes: goalMinutes,
      earnedValue,
      projectedValue
  });
});

app.listen(PORT, HOST, () => {
  console.log(`WorkTime backend listening on http://${HOST}:${PORT}`);
});
