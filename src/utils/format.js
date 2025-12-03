export function formatTimeRange(start, end) {
  return `${start} – ${end}`;
}

export function dayNamePl(date) {
  const days = ['Ndz', 'Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob'];
  return days[date.getDay()];
}

export function formatDateLabel(date) {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${d}.${m}`;
}

export function minutesToHhMm(mins) {
  const h = Math.floor(mins / 60);
  
  const m = (mins % 60).toFixed(2);
  return `${h} h ${m} min`;
}
