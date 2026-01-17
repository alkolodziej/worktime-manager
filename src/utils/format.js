export function formatTime(val) {
  if (!val) return '';
  // Check if it's already in HH:MM format (simple regex)
  if (typeof val === 'string' && /^\d{1,2}:\d{2}/.test(val) && val.length <= 8) {
     // cut seconds if any e.g. 08:00:00 -> 08:00
     return val.substring(0, 5);
  }

  // Try parsing as date
  const d = val instanceof Date ? val : new Date(val);
  if (isNaN(d.getTime())) {
     return String(val); // Fallback
  }
  
  return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatTimeRange(start, end) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function dayNamePl(date) {
  const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return days[d.getDay()];
}

export function formatDateLabel(date) {
  const dObject = date instanceof Date ? date : new Date(date);
  if (isNaN(dObject.getTime())) return '';
  const d = dObject.getDate().toString().padStart(2, '0');
  const m = (dObject.getMonth() + 1).toString().padStart(2, '0');
  return `${d}.${m}`;
}

export function minutesToHhMm(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  return `${h}h ${m}m`;
}

export function parseTimeMinutes(val) {
   if (!val) return 0;
   
   let h = 0, m = 0;
   
   if (typeof val === 'string' && val.includes('T')) {
       // ISO Date
       const d = new Date(val);
       if (isNaN(d.getTime())) return 0;
       h = d.getHours();
       m = d.getMinutes();
   } else if (typeof val === 'string' && val.includes(':')) {
       // HH:MM:SS or HH:MM
       const parts = val.split(':');
       h = parseInt(parts[0], 10) || 0;
       m = parseInt(parts[1], 10) || 0;
   } else if (val instanceof Date) {
       h = val.getHours();
       m = val.getMinutes();
   }
   
   return h * 60 + m;
}
