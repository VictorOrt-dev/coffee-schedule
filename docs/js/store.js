// Stockage 100 % local (localStorage) + calculs de la semaine.
import { addDays, mondayOf, shiftMinutes, toKey } from './time.js';
import { holidaysOf } from './holidays.js';

const KEY = 'coffee-schedule:v1';
const SCHEMA = 1;

export const DEFAULT_SETTINGS = {
  name: 'Goombouille',
  contractHours: 35,
  defaultBreak: 30,
  showMajoration: true,
  season: 'auto',   // 'auto' | 'winter' | 'spring' | 'summer' | 'autumn'
  seasonFx: true,   // particules d'arrière-plan
  mascot: true,     // Goombouille sur l'écran d'accueil
  hourlyRate: null,        // taux horaire brut (€) pour les estimations
  leaveBalance: null,      // solde de congés payés (jours) lu sur la fiche de paie…
  leaveBalanceDate: null,  // …à cette date ("YYYY-MM-DD")
  convention: 'hcr',       // 'hcr' (hôtels, cafés, restaurants) | 'other'
  seniority1y: true,       // au moins 1 an d'ancienneté (jours fériés garantis HCR)
  feriesPaid: {},          // { "2026": 1 } jours fériés garantis indemnisés sur la fiche de paie
  templates: [             // horaires types (boutons rapides)
    { id: 't1', name: 'Ouverture', start: '06:30', end: '14:30', brk: 30 },
    { id: 't2', name: 'Journée', start: '09:00', end: '17:00', brk: 30 },
    { id: 't3', name: 'Fermeture', start: '12:00', end: '20:00', brk: 30 },
  ],
};

/** Types de journée non travaillée. « paid » : absence comptée dans le contrat (pas dans les heures supp.). */
export const DAY_KINDS = {
  off: { label: 'Repos', short: 'Off', emoji: '🍃', paid: false },
  cp: { label: 'Congé payé', short: 'Congé', emoji: '🌴', paid: true },
  ferie: { label: 'Férié', short: 'Férié', emoji: '🎉', paid: true },
  maladie: { label: 'Maladie', short: 'Maladie', emoji: '🤒', paid: true },
  recup: { label: 'Récup. férié', short: 'Récup', emoji: '🔄', paid: true },
};

export const blankShift = () => ({ start: '', end: '', brk: null });
export const blankDay = () => ({ off: false, kind: 'off', planned: blankShift(), actual: blankShift(), note: '' });
export const blankWeek = () => ({ days: Array.from({ length: 7 }, blankDay) });

let state = { schema: SCHEMA, settings: { ...DEFAULT_SETTINGS }, weeks: {} };

function normalizeDay(d) {
  const base = blankDay();
  if (!d || typeof d !== 'object') return base;
  return {
    off: !!d.off,
    kind: DAY_KINDS[d.kind] ? d.kind : 'off',
    planned: { ...base.planned, ...(d.planned || {}) },
    actual: { ...base.actual, ...(d.actual || {}) },
    note: typeof d.note === 'string' ? d.note : '',
  };
}

function normalize(raw) {
  const out = { schema: SCHEMA, settings: { ...DEFAULT_SETTINGS }, weeks: {} };
  if (!raw || typeof raw !== 'object') return out;
  Object.assign(out.settings, raw.settings || {});
  out.settings.contractHours = clampNum(out.settings.contractHours, 1, 80, 35);
  out.settings.defaultBreak = clampNum(out.settings.defaultBreak, 0, 240, 30);
  if (!['auto', 'winter', 'spring', 'summer', 'autumn'].includes(out.settings.season)) out.settings.season = 'auto';
  out.settings.seasonFx = out.settings.seasonFx !== false;
  out.settings.mascot = out.settings.mascot !== false;
  const num = (v) => (v === '' || v == null || !Number.isFinite(Number(v)) ? null : Number(v));
  out.settings.hourlyRate = num(out.settings.hourlyRate);
  if (!['hcr', 'other'].includes(out.settings.convention)) out.settings.convention = 'hcr';
  out.settings.seniority1y = out.settings.seniority1y !== false;
  const fp = out.settings.feriesPaid && typeof out.settings.feriesPaid === 'object' ? out.settings.feriesPaid : {};
  out.settings.feriesPaid = Object.fromEntries(Object.entries(fp).filter(([y]) => /^\d{4}$/.test(y)).map(([y, n]) => [y, clampNum(n, 0, 11, 0)]));
  out.settings.leaveBalance = num(out.settings.leaveBalance);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(out.settings.leaveBalanceDate || '')) out.settings.leaveBalanceDate = null;
  const hm = (v) => (/^\d{2}:\d{2}$/.test(v || '') ? v : '');
  out.settings.templates = (Array.isArray(out.settings.templates) ? out.settings.templates : DEFAULT_SETTINGS.templates)
    .slice(0, 6)
    .filter((t) => t && typeof t === 'object')
    .map((t, i) => ({
      id: String(t.id || `t${Date.now()}${i}`),
      name: String(t.name ?? '').slice(0, 16),
      start: hm(t.start),
      end: hm(t.end),
      brk: clampNum(t.brk, 0, 240, 30),
    }));
  for (const [k, w] of Object.entries(raw.weeks || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !w || !Array.isArray(w.days)) continue;
    out.weeks[k] = { days: Array.from({ length: 7 }, (_, i) => normalizeDay(w.days[i])) };
  }
  return out;
}

function clampNum(v, min, max, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

export function load() {
  try {
    state = normalize(JSON.parse(localStorage.getItem(KEY) || 'null'));
  } catch {
    state = normalize(null);
  }
  return state;
}

export const getState = () => state;
export const getSettings = () => state.settings;

export function updateSettings(patch) {
  Object.assign(state.settings, patch);
  state.settings = normalize(state).settings;
  saveNow();
}

const isShiftEmpty = (s) => !s.start && !s.end;
export const isDayEmpty = (d) => !d.off && isShiftEmpty(d.planned) && isShiftEmpty(d.actual) && !d.note;
export const isWeekEmpty = (w) => !w || w.days.every(isDayEmpty);

/** Renvoie la semaine (créée en mémoire si absente). */
export function getWeek(mondayKey) {
  if (!state.weeks[mondayKey]) state.weeks[mondayKey] = blankWeek();
  return state.weeks[mondayKey];
}

export const peekWeek = (mondayKey) => state.weeks[mondayKey] || null;

export function setWeek(mondayKey, week) {
  state.weeks[mondayKey] = { days: week.days.map(normalizeDay) };
  saveNow();
}

let timer = null;
export function save() {
  clearTimeout(timer);
  timer = setTimeout(saveNow, 250);
}

export function saveNow() {
  clearTimeout(timer);
  // On n'enregistre pas les semaines vides
  const weeks = {};
  for (const [k, w] of Object.entries(state.weeks)) if (!isWeekEmpty(w)) weeks[k] = w;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, weeks }));
    return true;
  } catch (e) {
    console.error('Enregistrement impossible', e);
    return false;
  }
}

export function exportJSON() {
  saveNow();
  return JSON.stringify({ app: 'coffee-schedule', exportedAt: new Date().toISOString(), ...state }, null, 2);
}

export function importJSON(text) {
  const raw = JSON.parse(text);
  const next = normalize(raw);
  // Fusion : les semaines importées remplacent celles du même lundi
  state.settings = next.settings;
  Object.assign(state.weeks, next.weeks);
  saveNow();
  return Object.keys(next.weeks).length;
}

export function resetAll() {
  localStorage.removeItem(KEY);
  state = normalize(null);
}

// Sauvegarde de sécurité quand l'app passe en arrière-plan
addEventListener('pagehide', saveNow);
document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && saveNow());

/* ------------------------------------------------------------------ */
/* Calculs                                                             */
/* ------------------------------------------------------------------ */

export function dayStats(day) {
  if (day.off) return { off: true, planned: 0, actual: null, diff: null };
  const planned = shiftMinutes(day.planned);
  const actual = shiftMinutes(day.actual);
  return {
    off: false,
    planned,
    actual,
    diff: planned != null && actual != null ? actual - planned : null,
  };
}

/**
 * Totaux de la semaine.
 * - planned  : somme des horaires prévus
 * - actual   : somme des horaires réellement effectués (jours saisis)
 * - overtime : actual − contrat (positif = heures supp.)
 * - majoration (indicatif, taux légaux FR par défaut) : 8 premières h supp. à +25 %, au-delà +50 %
 */
export function weekStats(week, settings = state.settings) {
  const contract = Math.round(settings.contractHours * 60);
  let planned = 0, actual = 0, actualDays = 0, plannedDays = 0, offDays = 0, diffSum = 0, diffDays = 0;
  const kinds = { cp: 0, ferie: 0, maladie: 0, recup: 0 };
  const days = week.days.map((d) => {
    const s = dayStats(d);
    if (s.off) { offDays++; if (DAY_KINDS[d.kind]?.paid) kinds[d.kind]++; }
    if (s.planned) { planned += s.planned; plannedDays++; }
    if (s.actual != null) { actual += s.actual; actualDays++; }
    if (s.diff != null) { diffSum += s.diff; diffDays++; }
    return s;
  });
  const overtime = actual - contract;
  // Absences payées (congé, férié, maladie) : créditées de contrat/5 par jour.
  // Elles complètent le contrat mais ne créent jamais d'heures supp. (pas du travail effectif).
  const absenceDays = kinds.cp + kinds.ferie + kinds.maladie + kinds.recup;
  const absence = absenceDays * Math.round(contract / 5);
  const plannedOvertime = planned - contract;
  const ot = Math.max(0, overtime);
  return {
    days,
    contract,
    planned,
    actual,
    actualDays,
    plannedDays,
    offDays,
    overtime,
    plannedOvertime,
    diffVsPlanned: diffDays ? diffSum : null, // écart réel/prévu sur les jours comparables
    hasActual: actualDays > 0,
    kinds,
    absenceDays,
    absence,
    at25: Math.min(ot, 8 * 60),
    at50: Math.max(0, ot - 8 * 60),
  };
}

/**
 * Totaux d'un mois (month : 0-11).
 * - planned / actual : somme des jours dont la date tombe dans le mois
 * - overtime : les heures supp. se calculent par SEMAINE (au-delà du contrat) ;
 *   une semaine à cheval sur deux mois compte dans le mois où elle se termine (dimanche).
 * - base : contrat mensualisé (35 h × 52 / 12 = 151h40)
 */
export function monthStats(year, month, settings = state.settings) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  let planned = 0, actual = 0, actualDays = 0, workedDays = 0, offDays = 0;
  let overtime = 0, plannedOvertime = 0, at25 = 0, at50 = 0;
  const kinds = { cp: 0, ferie: 0, maladie: 0, recup: 0 };
  const weeks = [];

  for (let monday = mondayOf(first); monday <= last; monday = addDays(monday, 7)) {
    const key = toKey(monday);
    const week = state.weeks[key] || null;
    const sunday = addDays(monday, 6);
    const ws = week ? weekStats(week, settings) : null;
    let inPlanned = 0, inActual = 0, inActualDays = 0, inDays = 0;

    for (let i = 0; i < 7; i++) {
      const date = addDays(monday, i);
      if (date.getMonth() !== month) continue;
      inDays++;
      if (!ws) continue;
      const s = ws.days[i];
      if (s.off) { offDays++; const k = week.days[i].kind; if (k in kinds) kinds[k]++; continue; }
      if (s.planned) inPlanned += s.planned;
      if (s.actual != null) { inActual += s.actual; inActualDays++; }
      if (s.planned || s.actual) workedDays++;
    }

    const countsHere = sunday.getMonth() === month;
    if (ws && countsHere) {
      if (ws.hasActual) {
        overtime += Math.max(0, ws.overtime);
        at25 += ws.at25;
        at50 += ws.at50;
      }
      plannedOvertime += Math.max(0, ws.plannedOvertime);
    }

    planned += inPlanned;
    actual += inActual;
    actualDays += inActualDays;
    weeks.push({ monday, key, ws, inPlanned, inActual, inActualDays, straddles: inDays < 7, countsHere });
  }

  return {
    year, month, weeks,
    planned, actual, actualDays, workedDays, offDays,
    hasActual: actualDays > 0,
    overtime, plannedOvertime, at25, at50, kinds,
    base: Math.round((settings.contractHours * 60 * 52) / 12),
  };
}

/* ------------------------------------------------------------------ */
/* Argent, congés, année                                               */
/* ------------------------------------------------------------------ */

/** Valeur brute des heures supp. (majorations légales par défaut : +25 % puis +50 %). */
export function overtimeEuros(at25, at50, rate) {
  if (!rate) return 0;
  return rate * ((at25 / 60) * 1.25 + (at50 / 60) * 1.5);
}

/** Itère tous les jours enregistrés : cb(date, day). */
function eachDay(cb) {
  for (const [key, w] of Object.entries(state.weeks)) {
    const [y, m, d] = key.split('-').map(Number);
    const monday = new Date(y, m - 1, d);
    w.days.forEach((day, i) => cb(addDays(monday, i), day));
  }
}

/** Solde de congés : solde saisi − congés posés après la date du solde. null si non renseigné. */
export function leaveStatus(settings = state.settings, today = new Date()) {
  if (settings.leaveBalance == null) return null;
  const from = settings.leaveBalanceDate || '0000-00-00';
  const todayKey = toKey(today);
  let taken = 0, upcoming = 0;
  eachDay((date, day) => {
    if (!day.off || day.kind !== 'cp') return;
    const k = toKey(date);
    if (k <= from) return;
    if (k <= todayKey) taken++; else upcoming++;
  });
  return { balance: settings.leaveBalance, taken, upcoming, remaining: settings.leaveBalance - taken - upcoming };
}

/** Statistiques d'une année civile. */
export function yearStats(year, settings = state.settings) {
  const months = Array.from({ length: 12 }, () => ({ planned: 0, actual: 0, actualDays: 0 }));
  let actual = 0, planned = 0, workedDays = 0;
  const kinds = { cp: 0, ferie: 0, maladie: 0, off: 0 };
  eachDay((date, day) => {
    if (date.getFullYear() !== year) return;
    if (day.off) { kinds[day.kind] = (kinds[day.kind] || 0) + 1; return; }
    const p = shiftMinutes(day.planned), a = shiftMinutes(day.actual);
    const mo = months[date.getMonth()];
    if (p) { planned += p; mo.planned += p; }
    if (a != null) { actual += a; mo.actual += a; mo.actualDays++; }
    if (p || a) workedDays++;
  });
  // Heures supp. : semaine par semaine, rattachées à l'année de leur dimanche
  let overtime = 0, at25 = 0, at50 = 0, weeksWithActual = 0, weeklyActual = 0;
  for (const [key, w] of Object.entries(state.weeks)) {
    const [y, m, d] = key.split('-').map(Number);
    if (addDays(new Date(y, m - 1, d), 6).getFullYear() !== year) continue;
    const ws = weekStats(w, settings);
    if (!ws.hasActual) continue;
    weeksWithActual++;
    weeklyActual += ws.actual;
    overtime += Math.max(0, ws.overtime);
    at25 += ws.at25;
    at50 += ws.at50;
  }
  return {
    year, months, actual, planned, workedDays, kinds,
    overtime, at25, at50, weeksWithActual,
    avgWeek: weeksWithActual ? Math.round(weeklyActual / weeksWithActual) : 0,
  };
}

/* ------------------------------------------------------------------ */
/* Jours fériés & convention HCR                                       */
/* ------------------------------------------------------------------ */
export const HCR_GUARANTEED = 6;

/**
 * Bilan des jours fériés d'une année (convention HCR).
 * Avec 1 an d'ancienneté : 6 jours fériés garantis par an (hors 1er mai), obtenus en étant
 * chômés, ou compensés (jour de récup ou indemnité) s'ils sont travaillés ou tombent sur un repos.
 * Le 1er mai travaillé est payé double (Code du travail).
 */
export function feriesStatus(year, settings = state.settings, today = new Date()) {
  const todayKey = toKey(today);
  const list = [];
  for (const [key, name] of holidaysOf(year)) {
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const w = state.weeks[toKey(mondayOf(date))];
    const day = w ? w.days[(date.getDay() + 6) % 7] : null;
    const future = key > todayKey;
    let status;
    if (day?.off) status = day.kind === 'ferie' ? 'chome' : 'repos';
    else if (day && (shiftMinutes(day.actual) != null || shiftMinutes(day.planned))) status = 'travaille';
    else status = future ? 'avenir' : 'nonsaisi';
    const worked = status === 'travaille' ? (shiftMinutes(day.actual) ?? shiftMinutes(day.planned) ?? 0) : 0;
    list.push({ key, date, name, status, future, worked, mai1: m === 5 && d === 1 });
  }
  let recups = 0;
  eachDay((date, day) => { if (date.getFullYear() === year && day.off && day.kind === 'recup') recups++; });
  const others = list.filter((h) => !h.mai1);
  const count = (st) => others.filter((h) => h.status === st).length;
  const paid = settings.feriesPaid?.[year] || 0;
  const chome = count('chome');
  const target = settings.convention === 'hcr' && settings.seniority1y ? HCR_GUARANTEED : 0;
  const obtained = Math.min(target, chome + recups + paid);
  return {
    year, list, target, paid, recups, chome,
    worked: count('travaille'), repos: count('repos'),
    obtained, due: Math.max(0, target - obtained),
    mai1: list.find((h) => h.mai1),
  };
}
