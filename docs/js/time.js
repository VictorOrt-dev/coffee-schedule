// Utilitaires de dates & durées (tout en heure locale, aucun décalage UTC).

export const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const DAY_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const pad = (n) => String(n).padStart(2, '0');

/** Date -> "YYYY-MM-DD" (local) */
export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "YYYY-MM-DD" -> Date (local, minuit) */
export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

/** Lundi de la semaine contenant `date` */
export function mondayOf(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return addDays(d, -((d.getDay() + 6) % 7));
}

/** Numéro de semaine ISO 8601 */
export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

export const sameDay = (a, b) => toKey(a) === toKey(b);

/** "2 – 8 nov." / "28 oct. – 3 nov." / "29 déc. 2025 – 4 janv. 2026" */
export function weekRangeShort(monday) {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const sameYear = monday.getFullYear() === sunday.getFullYear();
  const y = (d) => (sameYear ? '' : ` ${d.getFullYear()}`);
  if (sameMonth) return `${monday.getDate()} – ${sunday.getDate()} ${MONTHS_SHORT[sunday.getMonth()]}`;
  return `${monday.getDate()} ${MONTHS_SHORT[monday.getMonth()]}${y(monday)} – ${sunday.getDate()} ${MONTHS_SHORT[sunday.getMonth()]}${y(sunday)}`;
}

/** "du 2 au 8 novembre 2026" */
export function weekRangeLong(monday) {
  const sunday = addDays(monday, 6);
  const start = monday.getMonth() === sunday.getMonth()
    ? `${monday.getDate()}`
    : `${monday.getDate()} ${MONTHS[monday.getMonth()]}${monday.getFullYear() !== sunday.getFullYear() ? ' ' + monday.getFullYear() : ''}`;
  return `du ${start} au ${sunday.getDate()} ${MONTHS[sunday.getMonth()]} ${sunday.getFullYear()}`;
}

export const monthShort = (d) => MONTHS_SHORT[d.getMonth()];

/** "08:30" -> 510 (minutes) ; null si vide/invalide */
export function parseHM(hm) {
  if (!hm || typeof hm !== 'string') return null;
  const m = hm.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export const toHM = (minutes) => {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};

/** Ajoute n minutes à "HH:MM" */
export const addMinutesHM = (hm, n) => toHM(parseHM(hm) + n);

/**
 * Durée travaillée d'un créneau {start, end, brk} en minutes (pause déduite).
 * Gère le passage de minuit (fin < début). null si incomplet.
 */
export function shiftMinutes(shift) {
  if (!shift) return null;
  const a = parseHM(shift.start);
  const b = parseHM(shift.end);
  if (a == null || b == null) return null;
  let d = b - a;
  if (d < 0) d += 1440;
  d -= Math.max(0, Number(shift.brk) || 0);
  return Math.max(0, d);
}

/**
 * Formate une durée : 570 -> "9h30", 480 -> "8h", 0 -> "0h"
 * opts.sign  : préfixe +/− (− typographique)
 * opts.pad   : "8h00" au lieu de "8h"
 */
export function fmtDur(minutes, { sign = false, padZero = false } = {}) {
  if (minutes == null || Number.isNaN(minutes)) return '—';
  const neg = minutes < 0;
  const abs = Math.round(Math.abs(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const body = m || padZero ? `${h}h${pad(m)}` : `${h}h`;
  if (!sign) return (neg ? '−' : '') + body;
  if (abs === 0) return '±0h';
  return (neg ? '−' : '+') + body;
}

/** "08:00" -> "8h", "08:30" -> "8h30" (affichage des horaires) */
export function fmtClock(hm) {
  const v = parseHM(hm);
  if (v == null) return '';
  const h = Math.floor(v / 60);
  const m = v % 60;
  return m ? `${h}h${pad(m)}` : `${h}h`;
}
