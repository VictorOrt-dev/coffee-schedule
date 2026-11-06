// Stockage 100 % local (localStorage) + calculs de la semaine.
import { shiftMinutes } from './time.js';

const KEY = 'coffee-schedule:v1';
const SCHEMA = 1;

export const DEFAULT_SETTINGS = {
  name: '',
  contractHours: 35,
  defaultBreak: 30,
  showMajoration: true,
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
