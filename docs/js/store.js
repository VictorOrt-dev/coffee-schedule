// Stockage 100 % local (localStorage) + calculs de la semaine.
import { addDays, mondayOf, shiftMinutes, toKey } from './time.js';

const KEY = 'coffee-schedule:v1';
const SCHEMA = 1;

export const DEFAULT_SETTINGS = {
  name: 'Goombouille',
  contractHours: 35,
  defaultBreak: 30,
  showMajoration: true,
  season: 'auto',   // 'auto' | 'winter' | 'spring' | 'summer' | 'autumn'
  seasonFx: true,   // particules d'arrière-plan
};

export const blankShift = () => ({ start: '', end: '', brk: null });
export const blankDay = () => ({ off: false, planned: blankShift(), actual: blankShift(), note: '' });
export const blankWeek = () => ({ days: Array.from({ length: 7 }, blankDay) });

let state = { schema: SCHEMA, settings: { ...DEFAULT_SETTINGS }, weeks: {} };

function normalizeDay(d) {
  const base = blankDay();
  if (!d || typeof d !== 'object') return base;
  return {
    off: !!d.off,
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
  const days = week.days.map((d) => {
    const s = dayStats(d);
    if (s.off) offDays++;
    if (s.planned) { planned += s.planned; plannedDays++; }
    if (s.actual != null) { actual += s.actual; actualDays++; }
    if (s.diff != null) { diffSum += s.diff; diffDays++; }
    return s;
  });
  const overtime = actual - contract;
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
      if (s.off) { offDays++; continue; }
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
    overtime, plannedOvertime, at25, at50,
    base: Math.round((settings.contractHours * 60 * 52) / 12),
  };
}
