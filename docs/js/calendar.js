// Export vers le calendrier (iPhone, Google Agenda…) au format iCalendar (.ics).
import { addDays, fmtDur, parseHM, shiftMinutes, toKey } from './time.js';
import { DAY_KINDS } from './store.js';
import { holidayName } from './holidays.js';

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
/** Heure « flottante » (sans fuseau) : le téléphone l'interprète en heure locale. */
const stamp = (d, hm) => `${ymd(d)}T${hm.replace(':', '')}00`;
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
const hasShift = (s) => !!(s?.start && s?.end);

/** Coupe les lignes à 75 octets environ (exigence du format). */
function fold(line) {
  const out = [];
  let rest = line;
  while (rest.length > 74) { out.push(rest.slice(0, 74)); rest = ' ' + rest.slice(74); }
  out.push(rest);
  return out.join('\r\n');
}

/**
 * days : [{ date: Date, day }] ; name : prénom (titre des événements).
 * Jours travaillés -> événement horaire (réel s'il existe, sinon prévu) ;
 * congé payé / férié -> événement « journée entière ». Les repos ne sont pas exportés.
 */
export function buildICS(days, { name = '' } = {}) {
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
  const who = name.trim();
  const events = [];

  for (const { date, day } of days) {
    if (!day) continue;
    const uid = `${toKey(date)}-${day.off ? day.kind : 'work'}@coffee-schedule`;
    if (day.off) {
      if (!['cp', 'ferie', 'recup'].includes(day.kind)) continue;
      const k = DAY_KINDS[day.kind];
      const label = day.kind === 'ferie' && holidayName(date) ? `${k.label} · ${holidayName(date)}` : k.label;
      events.push([
        'BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${ymd(date)}`, `DTEND;VALUE=DATE:${ymd(addDays(date, 1))}`,
        `SUMMARY:${esc(`${k.emoji} ${label}${who ? ` (${who})` : ''}`)}`,
        'TRANSP:TRANSPARENT', 'END:VEVENT',
      ]);
      continue;
    }
    const shift = hasShift(day.actual) ? day.actual : hasShift(day.planned) ? day.planned : null;
    if (!shift) continue;
    const endDate = parseHM(shift.end) < parseHM(shift.start) ? addDays(date, 1) : date;
    const desc = [
      `${fmtDur(shiftMinutes(shift))} de travail`,
      Number(shift.brk) ? `pause ${shift.brk} min` : 'sans pause',
      day.note?.trim() || '',
      'Coffee & Schedule',
    ].filter(Boolean).join(' · ');
    events.push([
      'BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${dtstamp}`,
      `DTSTART:${stamp(date, shift.start)}`, `DTEND:${stamp(endDate, shift.end)}`,
      `SUMMARY:${esc(who ? `☕ ${who} au travail` : '☕ Travail')}`,
      `DESCRIPTION:${esc(desc)}`, 'END:VEVENT',
    ]);
  }

  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Coffee & Schedule//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(who ? `Planning de ${who}` : 'Mon planning')}`,
    ...events.flat(),
    'END:VCALENDAR',
  ];
  return { text: lines.map(fold).join('\r\n') + '\r\n', count: events.length };
}
