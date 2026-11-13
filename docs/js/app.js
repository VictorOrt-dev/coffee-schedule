// Coffee & Schedule — application principale (Vanilla JS, modules ES).
import {
  DAY_NAMES, DAY_SHORT, addDays, addMinutesHM, fmtClock, fmtDur, fromKey, isoWeek,
  monthLabel, monthName, mondayOf, sameDay, shiftMinutes, toKey, weekRangeShort,
} from './time.js';
import * as store from './store.js';
import { SEASONS, SEASON_IDS, cornerArt, logoSVG, renderParticles, seasonOf } from './seasons.js';
import { PHRASES, goombouilleSVG } from './mascot.js';
import { buildCardHTML, buildMonthText, buildText, downloadBlob, fmtDiff, renderPNG, shareFile, shareText } from './share.js';

const APP_VERSION = '1.3.0';
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const icon = (name, cls = 'w-4 h-4') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hasShift = (s) => !!(s.start && s.end);

/* ------------------------------------------------------------------ */
/* État                                                                */
/* ------------------------------------------------------------------ */
store.load();
const settings = () => store.getSettings();

let monday = mondayOf(new Date());
let weekKey = toKey(monday);
let week = store.getWeek(weekKey);
const expanded = new Set();

const todayIndex = () => (new Date().getDay() + 6) % 7;
const isCurrentWeek = () => weekKey === toKey(mondayOf(new Date()));

function goToWeek(date, { animate = true } = {}) {
  monday = mondayOf(date);
  weekKey = toKey(monday);
  week = store.getWeek(weekKey);
  expanded.clear();
  if (isCurrentWeek()) expanded.add(todayIndex());
  renderAll();
  if (animate) {
    for (const el of [$('#summary'), $('#days')]) {
      el.classList.remove('animate-pop');
      void el.offsetWidth;
      el.classList.add('animate-pop');
    }
  }
}

/* ------------------------------------------------------------------ */
/* Rendu                                                               */
/* ------------------------------------------------------------------ */
function renderAll() {
  renderHeader();
  renderWeekNav();
  renderSummary();
  renderTools();
  renderDays();
}

function renderHeader() {
  const h = new Date().getHours();
  const hello = h < 5 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 18 ? 'Bel après-midi' : 'Bonsoir';
  const name = settings().name?.trim();
  $('#hello').textContent = `${hello} ${SEASONS[currentSeason()].emoji}`;
  $('#greeting').textContent = name || 'Coffee & Schedule';
}

function renderWeekNav() {
  const cur = mondayOf(new Date());
  const delta = Math.round((monday - cur) / (7 * 86400000));
  const rel = delta === 0 ? 'Cette semaine' : delta === -1 ? 'Semaine dernière' : delta === 1 ? 'Semaine prochaine'
    : delta < 0 ? `Il y a ${-delta} semaines` : `Dans ${delta} semaines`;
  $('#week-num').textContent = `Semaine ${isoWeek(monday)} · ${rel}`;
  $('#week-range').innerHTML = `${weekRangeShort(monday)} ${icon('down', 'w-4 h-4 text-muted')}`;
  $('#date-jump').value = toKey(monday);
  $('#back-today').classList.toggle('hidden', delta === 0);
}

function renderSummary() {
  const st = store.weekStats(week);
  const useActual = st.hasActual;
  const value = useActual ? st.actual : st.planned;
  const diff = value - st.contract;
  const { contract } = st;

  // Badge
  let badge;
  if (value === 0) {
    badge = `<span class="chip pointer-events-none">${icon('cup')} À remplir</span>`;
  } else if (diff > 0) {
    badge = `<span class="inline-flex items-center gap-1.5 rounded-full px-3 h-9 text-sm font-extrabold text-white bg-gradient-to-br from-tone-400 to-tone-600 shadow-soft">${icon('flame')} ${fmtDur(diff, { sign: true })} supp.</span>`;
  } else if (diff === 0) {
    badge = `<span class="inline-flex items-center gap-1.5 rounded-full px-3 h-9 text-sm font-extrabold bg-sage-100 text-sage-700 dark:bg-sage-700/40 dark:text-sage-100">${icon('check')} Pile ${fmtDur(contract)}</span>`;
  } else {
    badge = `<span class="inline-flex items-center gap-1.5 rounded-full px-3 h-9 text-sm font-extrabold bg-surface-2 text-ink-soft border border-line">${useActual ? 'Encore' : '−'} ${fmtDur(-diff)}</span>`;
  }

  // Barre de progression
  const scale = Math.max(contract * 1.25, st.actual, st.planned, 1);
  const pct = (m) => `${Math.min(100, (m / scale) * 100).toFixed(2)}%`;
  const base = Math.min(value, contract);
  const over = Math.max(0, value - contract);
  const plannedMarker = useActual && st.planned > 0
    ? `<span class="absolute -top-[18px] -translate-x-1/2 text-[10px] font-extrabold text-muted" style="left:${pct(st.planned)}">prévu ▾</span>`
    : '';

  // Phrase clé : "39h30 effectuées = +4h30 supp."
  let sentence;
  if (value === 0) sentence = 'Commence par saisir tes horaires prévus ci-dessous.';
  else if (useActual) sentence = diff > 0
    ? `<b>${fmtDur(st.actual)} effectuées = <span class="text-accent-ink">${fmtDur(diff, { sign: true })} supp.</span></b>`
    : diff === 0 ? `<b>${fmtDur(st.actual)} effectuées</b> — contrat rempli, bravo !`
    : `<b>${fmtDur(st.actual)} effectuées</b> sur ${fmtDur(contract)} · encore ${fmtDur(-diff)}`;
  else sentence = diff > 0
    ? `<b>${fmtDur(st.planned)} prévues = <span class="text-accent-ink">${fmtDur(diff, { sign: true })} supp.</span> à venir</b>`
    : `<b>${fmtDur(st.planned)} prévues</b> sur ${fmtDur(contract)}`;

  const maj = settings().showMajoration && useActual && st.overtime > 0
    ? `<p class="mt-1 text-xs font-bold text-muted">dont ${fmtDur(st.at25)} à +25 %${st.at50 ? ` et ${fmtDur(st.at50)} à +50 %` : ''} <span class="opacity-70">(indicatif)</span></p>`
    : '';

  const mini = (label, val, cls = '') => `
    <div class="rounded-2xl bg-surface-2 border border-line/70 px-2 py-2">
      <p class="text-[10px] font-extrabold uppercase tracking-wider text-muted">${label}</p>
      <p class="font-display text-[17px] font-semibold ${cls}">${val}</p>
    </div>`;

  $('#summary').innerHTML = `
    <div class="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none" aria-hidden="true">
      <div class="season-art absolute -right-6 -top-7">${cornerArt(currentSeason(), 104)}</div>
    </div>
    <div class="relative flex items-start justify-between gap-3">
      <div>
        <p class="text-[11px] font-extrabold uppercase tracking-wider text-muted">${useActual ? 'Effectué' : 'Prévu'} cette semaine</p>
        <p class="font-display text-[44px] leading-[1.05] font-semibold tracking-tight">${fmtDur(value)}<span class="font-sans text-lg font-bold text-muted"> / ${fmtDur(contract)}</span></p>
      </div>
      <div class="pt-1">${badge}</div>
    </div>

    <div class="relative mt-6 mb-6" role="img" aria-label="${fmtDur(value)} sur un contrat de ${fmtDur(contract)}">
      <div class="h-4 rounded-full bg-surface-2 border border-line overflow-hidden relative">
        <div class="absolute inset-y-0 left-0 ${over ? '' : 'rounded-r-full'} ${useActual ? 'bg-coffee-700 dark:bg-coffee-300' : 'bg-coffee-400'} transition-[width] duration-500" style="width:${pct(base)}"></div>
        <div class="absolute inset-y-0 progress-overtime rounded-r-full transition-[width] duration-500" style="left:${pct(contract)};width:${over ? `calc(${pct(over)})` : '0'}"></div>
      </div>
      <span class="absolute -top-1.5 -bottom-1.5 w-[3px] -ml-[1.5px] rounded-full bg-ink/80" style="left:${pct(contract)}"></span>
      <span class="absolute top-full mt-1 -translate-x-1/2 text-[11px] font-extrabold text-ink-soft" style="left:${pct(contract)}">${fmtDur(contract)}</span>
      ${plannedMarker}
    </div>

    <p class="relative text-[15px] text-ink-soft">${sentence}</p>
    ${maj}

    <div class="grid grid-cols-3 gap-2 mt-4 text-center">
      ${mini('Prévu', fmtDur(st.planned))}
      ${mini('Effectué', st.hasActual ? fmtDur(st.actual) : '—')}
      ${mini('Écart', st.diffVsPlanned == null ? '—' : fmtDur(st.diffVsPlanned, { sign: true }), st.diffVsPlanned > 0 ? 'text-accent-ink' : '')}
    </div>
    ${monthTeaserHTML()}`;
  renderMascot();
}

/** Mois « de référence » de la semaine affichée (celui de son jeudi). */
const weekMonth = () => { const t = addDays(monday, 3); return { y: t.getFullYear(), m: t.getMonth() }; };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function monthTeaserHTML() {
  const { y, m } = weekMonth();
  const ms = store.monthStats(y, m);
  let line;
  if (ms.hasActual) line = ms.overtime > 0
    ? `${fmtDur(ms.actual)} · <span class="text-accent-ink">${fmtDur(ms.overtime, { sign: true })} supp.</span>`
    : `${fmtDur(ms.actual)} effectuées`;
  else if (ms.planned) line = `${fmtDur(ms.planned)} prévues`;
  else line = 'Rien de saisi pour le moment';
  return `
    <button type="button" data-act="open-month" class="relative mt-3 w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left border border-tone-200/80 bg-tone-50/80 dark:border-tone-900/60 dark:bg-tone-900/20 active:scale-[.98] transition">
      <span class="flex-none w-9 h-9 rounded-xl grid place-items-center bg-tone-100 text-tone-700 dark:bg-tone-900/50 dark:text-tone-200">${icon('calendar', 'w-[18px] h-[18px]')}</span>
      <span class="flex-1 min-w-0">
        <span class="block text-[11px] font-extrabold uppercase tracking-wider text-accent-ink">Total ${monthName(m)}</span>
        <span class="block font-bold text-[15px] truncate">${line}</span>
      </span>
      ${icon('right', 'w-5 h-5 text-accent-ink flex-none')}
    </button>`;
}

/* ------------------------------------------------------------------ */
/* Total du mois                                                       */
/* ------------------------------------------------------------------ */
const dlgMonth = $('#dlg-month');
let monthCursor = weekMonth();

function openMonth(cursor = weekMonth()) {
  monthCursor = cursor;
  renderMonth();
  openDialog(dlgMonth);
}

function shiftMonth(delta) {
  const d = new Date(monthCursor.y, monthCursor.m + delta, 1);
  monthCursor = { y: d.getFullYear(), m: d.getMonth() };
  renderMonth();
}

function renderMonth() {
  const ms = store.monthStats(monthCursor.y, monthCursor.m);
  $('#month-label').textContent = cap(monthLabel(ms.year, ms.month));
  const useActual = ms.hasActual;
  const value = useActual ? ms.actual : ms.planned;
  const scale = Math.max(ms.base * 1.15, value, ms.planned, 1);
  const pct = (v) => `${Math.min(100, (v / scale) * 100).toFixed(2)}%`;
  const over = Math.max(0, value - ms.base);
  const mini = (label, val, cls = '') => `
    <div class="rounded-2xl bg-surface-2 border border-line/70 px-2 py-2">
      <p class="text-[10px] font-extrabold uppercase tracking-wider text-muted">${label}</p>
      <p class="font-display text-[17px] font-semibold ${cls}">${val}</p>
    </div>`;
  const maj = settings().showMajoration && ms.overtime > 0
    ? `<p class="mt-2 text-xs font-bold text-muted">dont ${fmtDur(ms.at25)} à +25 %${ms.at50 ? ` et ${fmtDur(ms.at50)} à +50 %` : ''} <span class="opacity-70">(indicatif)</span></p>`
    : '';

  const rows = ms.weeks.map((w) => {
    const empty = !w.ws || (!w.inPlanned && !w.inActual && !w.ws.offDays);
    const useA = w.inActualDays > 0;
    const val = useA ? w.inActual : w.inPlanned;
    const full = w.ws ? (w.ws.hasActual ? w.ws.actual : w.ws.planned) : 0;
    let sub;
    if (empty) sub = 'Rien de saisi';
    else if (w.straddles) sub = `${val ? `${useA ? 'effectué' : 'prévu'} sur ce mois` : 'aucune heure ce mois'} · semaine entière ${fmtDur(full)}`;
    else sub = useA ? 'effectué' : 'prévu';
    let ot = '';
    if (w.ws?.hasActual && w.ws.overtime > 0) {
      ot = w.countsHere
        ? `<span class="block text-[11px] font-extrabold text-accent-ink">${fmtDur(w.ws.overtime, { sign: true })} supp.</span>`
        : `<span class="block text-[11px] font-bold text-muted">supp. → ${monthName(addDays(w.monday, 6).getMonth())}</span>`;
    }
    return `
      <button type="button" data-week="${w.key}" class="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface border border-line text-left active:scale-[.98] transition ${empty ? 'opacity-60' : ''}">
        <span class="flex-none w-12 h-12 rounded-2xl grid place-items-center leading-none bg-surface-2">
          <span class="text-center"><span class="block text-[10px] font-extrabold uppercase tracking-wider text-muted">Sem.</span><span class="block font-display text-lg font-semibold mt-0.5">${isoWeek(w.monday)}</span></span>
        </span>
        <span class="flex-1 min-w-0">
          <span class="block font-bold text-[15px]">${weekRangeShort(w.monday)}</span>
          <span class="block text-[12px] font-semibold text-muted leading-snug">${sub}</span>
        </span>
        <span class="flex-none text-right">
          <span class="block font-display text-lg font-semibold leading-tight ${useA ? '' : 'text-ink-soft'}">${empty ? '—' : fmtDur(val)}</span>${ot}
        </span>
      </button>`;
  }).join('');

  $('#month-body').innerHTML = `
    <section class="card p-5 mt-3">
      <p class="text-[11px] font-extrabold uppercase tracking-wider text-muted">${useActual ? 'Effectué' : 'Prévu'} ce mois</p>
      <p class="font-display text-[44px] leading-[1.05] font-semibold tracking-tight">${fmtDur(value)}<span class="font-sans text-lg font-bold text-muted"> / ${fmtDur(ms.base)}</span></p>
      <div class="relative mt-5 mb-6" role="img" aria-label="${fmtDur(value)} sur une base mensuelle de ${fmtDur(ms.base)}">
        <div class="h-4 rounded-full bg-surface-2 border border-line overflow-hidden relative">
          <div class="absolute inset-y-0 left-0 ${over ? '' : 'rounded-r-full'} ${useActual ? 'bg-coffee-700 dark:bg-coffee-300' : 'bg-coffee-400'} transition-[width] duration-500" style="width:${pct(Math.min(value, ms.base))}"></div>
          <div class="absolute inset-y-0 progress-overtime rounded-r-full" style="left:${pct(ms.base)};width:${over ? pct(over) : '0'}"></div>
        </div>
        <span class="absolute -top-1.5 -bottom-1.5 w-[3px] -ml-[1.5px] rounded-full bg-ink/80" style="left:${pct(ms.base)}"></span>
        <span class="absolute top-full mt-1 -translate-x-1/2 text-[11px] font-extrabold text-ink-soft whitespace-nowrap" style="left:${pct(ms.base)}">${fmtDur(ms.base)}</span>
      </div>
      <div class="grid grid-cols-3 gap-2 text-center">
        ${mini('Prévu', fmtDur(ms.planned))}
        ${mini('Effectué', ms.hasActual ? fmtDur(ms.actual) : '—')}
        ${mini('Supp.', ms.overtime > 0 ? fmtDur(ms.overtime, { sign: true }) : '0h', ms.overtime > 0 ? 'text-accent-ink' : '')}
      </div>
      ${maj}
      <p class="mt-3 text-sm font-semibold text-ink-soft">${ms.workedDays} jour${ms.workedDays > 1 ? 's' : ''} travaillé${ms.workedDays > 1 ? 's' : ''} · ${ms.offDays} off</p>
    </section>
    <h3 class="field-label mt-5">Semaine par semaine</h3>
    <div class="flex flex-col gap-2">${rows}</div>
    <p class="mt-3 text-xs font-semibold text-muted leading-relaxed">
      Le total compte les jours du mois. Les heures supp. se calculent par semaine (au-delà de ${fmtDur(Math.round(settings().contractHours * 60))}) ;
      une semaine à cheval sur deux mois compte dans le mois où elle se termine.
      Base mensualisée : ${fmtDur(Math.round(settings().contractHours * 60))} × 52 / 12 = ${fmtDur(ms.base)}.
    </p>`;
}

/* ------------------------------------------------------------------ */
/* Goombouille, la mascotte                                            */
/* ------------------------------------------------------------------ */
let mascotKey = '';
let phraseIdx = Math.floor(Math.random() * 4);
let mascotOverride = null;
let mascotTimer = null;

/** Humeur + message selon la semaine affichée et la journée. */
function mascotState() {
  const season = currentSeason();
  const name = settings().name?.trim() || 'Goombouille';
  const st = store.weekStats(week);
  const cur = isCurrentWeek();
  const today = cur ? week.days[todayIndex()] : null;
  const seasonal = () => PHRASES[season][phraseIdx % PHRASES[season].length];

  if (mascotOverride) return { mood: mascotOverride.mood, text: mascotOverride.text };
  if (today?.off) return { mood: 'sleep', text: `Jour off aujourd'hui… Zzz. Repose-toi bien ${name} !` };
  if (st.hasActual && st.overtime > 0) {
    return { mood: 'tired', text: `Ouf, ${fmtDur(st.overtime, { sign: true })} supp. cette semaine ! Courage ${name} 💪` };
  }
  if (st.hasActual && st.overtime === 0) return { mood: 'star', text: `${fmtDur(st.contract)} pile, contrat rempli ! Bravo ✨` };
  if (store.isWeekEmpty(week)) return { mood: 'happy', text: cur ? 'Ajoute tes horaires de la semaine ✍️' : 'Rien de prévu ici pour l’instant.' };
  if (today && hasShift(today.planned) && !hasShift(today.actual)) {
    return { mood: 'happy', text: `Aujourd'hui : ${fmtClock(today.planned.start)} – ${fmtClock(today.planned.end)}. Bon service ! ☕` };
  }
  return { mood: 'happy', text: seasonal() };
}

function renderMascot() {
  const host = $('#mascot');
  if (!settings().mascot) { host.innerHTML = ''; host.classList.add('hidden'); mascotKey = ''; return; }
  host.classList.remove('hidden');
  const season = currentSeason();
  const { mood, text } = mascotState();
  const key = `${season}|${mood}`;
  if (key !== mascotKey || !$('#gb-btn')) {
    host.innerHTML = `
      <button id="gb-btn" type="button" class="flex-none -ml-1 -mb-1 w-[76px] h-[76px] active:scale-95 transition" aria-label="Goombouille, ta mascotte : touche-la pour une nouvelle phrase">
        ${goombouilleSVG(season, mood)}
      </button>
      <div class="relative flex-1 min-w-0 mb-3 card px-3.5 py-2.5">
        <span class="absolute -left-[7px] bottom-4 w-3 h-3 rotate-45 bg-surface border-l border-b border-line/70"></span>
        <p id="gb-text" class="relative text-[14px] font-bold text-ink-soft leading-snug"></p>
      </div>`;
    mascotKey = key;
  }
  const p = $('#gb-text');
  if (p.textContent !== text) {
    p.textContent = text;
    p.parentElement.classList.remove('gb-bubble-in');
    void p.offsetWidth;
    p.parentElement.classList.add('gb-bubble-in');
  }
}

function pokeMascot() {
  const season = currentSeason();
  phraseIdx++;
  mascotOverride = { mood: 'happy', text: PHRASES[season][phraseIdx % PHRASES[season].length] };
  renderMascot();
  const btn = $('#gb-btn');
  btn.classList.remove('gb-jump');
  void btn.offsetWidth;
  btn.classList.add('gb-jump');
  haptic();
  clearTimeout(mascotTimer);
  mascotTimer = setTimeout(() => { mascotOverride = null; renderMascot(); }, 5000);
}

function renderTools() {
  const tools = [];
  const prev = store.peekWeek(toKey(addDays(monday, -7)));
  if (prev && prev.days.some((d) => d.off || hasShift(d.planned))) {
    tools.push(`<button type="button" class="chip flex-none" data-act="copy-prev">${icon('copy')} Copier la semaine dernière</button>`);
  }
  const lastIdx = isCurrentWeek() ? todayIndex() : monday < mondayOf(new Date()) ? 6 : -1;
  const fillable = week.days.filter((d, i) => i <= lastIdx && !d.off && hasShift(d.planned) && !hasShift(d.actual)).length;
  if (fillable) {
    tools.push(`<button type="button" class="chip flex-none" data-act="fill-past">${icon('check')} ${fillable} jour${fillable > 1 ? 's' : ''} comme prévu</button>`);
  }
  if (!store.isWeekEmpty(week)) {
    tools.push(`<button type="button" class="chip flex-none" data-act="clear-week">${icon('trash')} Vider la semaine</button>`);
  }
  $('#tools').innerHTML = tools.join('');
  $('#tools').classList.toggle('hidden', tools.length === 0);
}

function renderDays() {
  $('#days').innerHTML = week.days.map((_, i) => dayHTML(i)).join('');
}

function daySub(d) {
  if (d.off) return `Repos${d.note ? ' · ' + esc(d.note) : ''}`;
  const parts = [];
  const p = hasShift(d.planned), a = hasShift(d.actual);
  if (p && a && d.planned.start === d.actual.start && d.planned.end === d.actual.end) {
    parts.push(`${fmtClock(d.actual.start)} – ${fmtClock(d.actual.end)} · comme prévu`);
  } else {
    if (p) parts.push(`Prévu ${fmtClock(d.planned.start)}–${fmtClock(d.planned.end)}`);
    if (a) parts.push(`Réel ${fmtClock(d.actual.start)}–${fmtClock(d.actual.end)}`);
  }
  if (d.note) parts.push(esc(d.note));
  return parts.join(' · ') || 'Appuie pour saisir tes horaires';
}

function dayStatus(d) {
  const s = store.dayStats(d);
  if (s.off) return `<span class="inline-flex items-center gap-1 rounded-full px-2.5 h-7 text-xs font-extrabold bg-sage-100 text-sage-700 dark:bg-sage-700/40 dark:text-sage-100">${icon('leaf', 'w-3.5 h-3.5')} Off</span>`;
  if (s.actual != null) {
    const diff = s.diff ? `<span class="block text-[11px] font-extrabold ${s.diff > 0 ? 'text-accent-ink' : 'text-muted'}">${fmtDiff(s.diff)}</span>`
      : `<span class="block text-[11px] font-extrabold text-sage-700 dark:text-sage-300">réel ✓</span>`;
    return `<span class="block font-display text-lg font-semibold leading-tight">${fmtDur(s.actual)}</span>${diff}`;
  }
  if (s.planned != null) {
    return `<span class="block font-display text-lg font-semibold leading-tight text-ink-soft">${fmtDur(s.planned)}</span><span class="block text-[11px] font-bold text-muted">prévu</span>`;
  }
  return '';
}

function dayHTML(i) {
  const d = week.days[i];
  const date = addDays(monday, i);
  const isToday = sameDay(date, new Date());
  const open = expanded.has(i);
  const empty = store.isDayEmpty(d);
  return `
  <article class="card transition ${isToday ? 'ring-2 ring-accent/60 season-cap' : ''}" data-day="${i}">
    <div class="flex items-center">
      <button type="button" class="flex-1 min-w-0 flex items-center gap-3 p-3 text-left" data-act="toggle" aria-expanded="${open}" aria-controls="day-body-${i}">
        <span class="flex-none w-12 h-12 rounded-2xl grid place-items-center leading-none ${isToday ? 'bg-coffee-900 text-coffee-50 dark:bg-tone-400 dark:text-coffee-950' : d.off ? 'bg-sage-100 text-sage-700 dark:bg-sage-700/40 dark:text-sage-100' : 'bg-surface-2 text-ink'}">
          <span class="text-center">
            <span class="block text-[10px] font-extrabold uppercase tracking-wider opacity-70">${DAY_SHORT[i]}</span>
            <span class="block font-display text-lg font-semibold mt-0.5">${date.getDate()}</span>
          </span>
        </span>
        <span class="flex-1 min-w-0">
          <span class="flex items-center gap-2">
            <span class="font-display text-[17px] font-semibold">${DAY_NAMES[i]}</span>
            ${isToday ? '<span class="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-tone-100 text-tone-700 dark:bg-tone-900/50 dark:text-tone-200">Aujourd\'hui</span>' : ''}
          </span>
          <span class="block text-[13px] font-semibold text-muted truncate" data-out="sub">${daySub(d)}</span>
        </span>
        <span class="flex-none text-right" data-out="status">${dayStatus(d)}</span>
        <svg class="w-5 h-5 flex-none text-muted transition-transform ${open ? 'rotate-180' : ''}" aria-hidden="true"><use href="#i-down"/></svg>
      </button>
      <button type="button" class="chip mr-3 flex-none ${empty && !open ? '' : 'hidden'}" data-act="quick-off" aria-label="Marquer ${DAY_NAMES[i]} en jour off">${icon('leaf', 'w-3.5 h-3.5')} Off</button>
    </div>
    <div id="day-body-${i}" class="px-3 pb-3 ${open ? '' : 'hidden'}">${open ? bodyHTML(i) : ''}</div>
  </article>`;
}

function timeField(kind, field, label, value) {
  return `
    <label class="block min-w-0">
      <span class="field-label">${label}</span>
      <input type="time" class="field px-2.5" data-f="${kind}.${field}" value="${esc(value)}" step="300">
    </label>`;
}

function shiftEditor(i, kind) {
  const d = week.days[i];
  const s = d[kind];
  const dur = shiftMinutes(s);
  const isActual = kind === 'actual';
  const placeholder = isActual && d.planned.brk != null ? d.planned.brk : settings().defaultBreak;
  const chips = isActual ? `
    <div class="flex gap-2 mt-3 overflow-x-auto scrollbar-none -mx-1 px-1">
      <button type="button" class="chip flex-none" data-act="same" ${hasShift(d.planned) ? '' : 'disabled'}>${icon('check')} Comme prévu</button>
      <button type="button" class="chip flex-none" data-act="plus" data-min="15">+15 min</button>
      <button type="button" class="chip flex-none" data-act="plus" data-min="30">+30 min</button>
      <button type="button" class="chip flex-none" data-act="plus" data-min="60">+1h</button>
    </div>` : '';
  const diff = isActual ? store.dayStats(d).diff : null;
  return `
    <div role="group" aria-label="${isActual ? 'Horaires réels' : 'Horaires prévus'}"
         class="mt-3 rounded-2xl border p-3 ${isActual ? 'border-tone-200 bg-tone-50/70 dark:border-tone-900/60 dark:bg-tone-900/15' : 'border-line bg-surface'}">
      <div class="flex items-center justify-between mb-2 gap-2">
        <span class="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wider ${isActual ? 'text-accent-ink' : 'text-ink-soft'}">
          ${icon(isActual ? 'flame' : 'calendar')} ${isActual ? 'Réellement effectué' : 'Horaires prévus'}
        </span>
        <span class="flex items-baseline gap-2">
          ${isActual ? `<span class="text-xs font-extrabold text-accent-ink" data-out="diff">${diff ? fmtDiff(diff) : ''}</span>` : ''}
          <span class="font-display text-lg font-semibold" data-out="${kind}">${dur != null ? fmtDur(dur) : '—'}</span>
        </span>
      </div>
      <div class="grid grid-cols-[1fr_1fr_4.75rem] gap-2">
        ${timeField(kind, 'start', 'Début', s.start)}
        ${timeField(kind, 'end', 'Fin', s.end)}
        <label class="block min-w-0">
          <span class="field-label">Pause</span>
          <span class="relative block">
            <input type="number" inputmode="numeric" min="0" max="600" step="5" class="field pr-9" data-f="${kind}.brk"
                   value="${s.brk ?? ''}" placeholder="${placeholder}">
            <span class="field-suffix right-2.5">min</span>
          </span>
        </label>
      </div>
      ${chips}
    </div>`;
}

function bodyHTML(i) {
  const d = week.days[i];
  const note = `
    <label class="block mt-3">
      <span class="sr-only">Note</span>
      <input type="text" class="field font-semibold" data-f="note" maxlength="60" value="${esc(d.note)}" placeholder="${SEASONS[currentSeason()].notePlaceholder}">
    </label>`;
  const head = `
    <div class="flex items-center gap-2">
      <button type="button" class="chip" data-act="off" aria-pressed="${d.off}">${icon('leaf')} Jour off</button>
      <span class="flex-1"></span>
      ${store.isDayEmpty(d) ? '' : `<button type="button" class="chip" data-act="clear">${icon('x')} Effacer</button>`}
    </div>`;
  if (d.off) {
    return `${head}
      <div class="mt-3 rounded-2xl bg-sage-100/80 dark:bg-sage-700/25 p-4 text-center">
        <p class="font-display text-lg font-semibold text-sage-700 dark:text-sage-100">${SEASONS[currentSeason()].offTitle}</p>
        <p class="text-sm font-semibold text-sage-700/80 dark:text-sage-100/70">${SEASONS[currentSeason()].offText}</p>
      </div>${note}`;
  }
  return `${head}${shiftEditor(i, 'planned')}${shiftEditor(i, 'actual')}${note}`;
}

/** Remplace entièrement la carte d'un jour (après une action structurelle). */
function rerenderDay(i) {
  const el = $(`[data-day="${i}"]`);
  if (el) el.outerHTML = dayHTML(i);
}

/** Mise à jour légère pendant la saisie (n'écrase pas les champs). */
function refreshDay(i) {
  const el = $(`[data-day="${i}"]`);
  if (!el) return;
  const d = week.days[i];
  const s = store.dayStats(d);
  $('[data-out="sub"]', el).innerHTML = daySub(d);
  $('[data-out="status"]', el).innerHTML = dayStatus(d);
  const p = $('[data-out="planned"]', el); if (p) p.textContent = s.planned != null ? fmtDur(s.planned) : '—';
  const a = $('[data-out="actual"]', el); if (a) a.textContent = s.actual != null ? fmtDur(s.actual) : '—';
  const df = $('[data-out="diff"]', el); if (df) df.textContent = s.diff ? fmtDiff(s.diff) : '';
  const same = $('[data-act="same"]', el); if (same) same.disabled = !hasShift(d.planned);
}

function commit({ day, full = false } = {}) {
  store.save();
  if (full) renderDays();
  else if (day != null) rerenderDay(day);
  renderSummary();
  renderTools();
}

/* ------------------------------------------------------------------ */
/* Saisie                                                              */
/* ------------------------------------------------------------------ */
function onFieldInput(e) {
  const el = e.target.closest('[data-f]');
  if (!el) return;
  const i = Number(el.closest('[data-day]').dataset.day);
  const d = week.days[i];
  const [kind, field] = el.dataset.f.split('.');

  if (kind === 'note') {
    d.note = el.value;
  } else if (field === 'brk') {
    d[kind].brk = el.value === '' ? null : Math.max(0, Math.min(600, parseInt(el.value, 10) || 0));
  } else {
    d[kind][field] = el.value;
    // Pause par défaut posée automatiquement dès que le créneau est complet
    if (d[kind].brk == null && hasShift(d[kind])) {
      d[kind].brk = kind === 'actual' && d.planned.brk != null ? d.planned.brk : settings().defaultBreak;
      const brkInput = $(`[data-f="${kind}.brk"]`, el.closest('[data-day]'));
      if (brkInput) brkInput.value = d[kind].brk;
    }
  }
  store.save();
  refreshDay(i);
  renderSummary();
  renderTools();
}

function onDaysClick(e) {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const card = btn.closest('[data-day]');
  const i = Number(card.dataset.day);
  const d = week.days[i];

  switch (btn.dataset.act) {
    case 'toggle': {
      expanded.has(i) ? expanded.delete(i) : expanded.add(i);
      rerenderDay(i);
      if (expanded.has(i)) requestAnimationFrame(() => $(`[data-day="${i}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
      return;
    }
    case 'quick-off':
      d.off = true;
      haptic();
      return commit({ day: i });
    case 'off':
      d.off = !d.off;
      haptic();
      return commit({ day: i });
    case 'clear': {
      const snapshot = structuredClone(d);
      week.days[i] = store.blankDay();
      commit({ day: i });
      return toast(`${DAY_NAMES[i]} effacé`, { action: 'Annuler', onAction: () => { week.days[i] = snapshot; commit({ day: i }); } });
    }
    case 'same':
      if (!hasShift(d.planned)) return;
      d.actual = { ...d.planned };
      haptic();
      commit({ day: i });
      return toast('Journée validée comme prévu ✓');
    case 'plus': {
      const add = Number(btn.dataset.min);
      if (!hasShift(d.actual)) {
        if (!hasShift(d.planned)) return toast('Renseigne d’abord tes horaires (prévus ou réels)');
        d.actual = { ...d.planned };
      }
      d.actual.end = addMinutesHM(d.actual.end, add);
      haptic();
      return commit({ day: i });
    }
  }
}

function onToolsClick(e) {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const snapshot = structuredClone(week);
  const undo = () => { store.setWeek(weekKey, snapshot); week = store.getWeek(weekKey); renderAll(); };

  switch (btn.dataset.act) {
    case 'copy-prev': {
      const prev = store.peekWeek(toKey(addDays(monday, -7)));
      if (!prev) return;
      const hasData = week.days.some((d) => d.off || hasShift(d.planned));
      if (hasData && !confirm('Remplacer les horaires prévus de cette semaine par ceux de la semaine dernière ?')) return;
      week.days.forEach((d, i) => {
        d.off = prev.days[i].off;
        d.planned = { ...prev.days[i].planned };
      });
      commit({ full: true });
      return toast('Horaires prévus copiés', { action: 'Annuler', onAction: undo });
    }
    case 'fill-past': {
      const lastIdx = isCurrentWeek() ? todayIndex() : 6;
      let n = 0;
      week.days.forEach((d, i) => {
        if (i <= lastIdx && !d.off && hasShift(d.planned) && !hasShift(d.actual)) { d.actual = { ...d.planned }; n++; }
      });
      commit({ full: true });
      return toast(`${n} jour${n > 1 ? 's' : ''} validé${n > 1 ? 's' : ''} comme prévu`, { action: 'Annuler', onAction: undo });
    }
    case 'clear-week':
      week.days = week.days.map(store.blankDay);
      commit({ full: true });
      return toast('Semaine vidée', { action: 'Annuler', onAction: undo });
  }
}

/* ------------------------------------------------------------------ */
/* Partage                                                             */
/* ------------------------------------------------------------------ */
const dlgShare = $('#dlg-share');
let shareMode = 'planning';
let shareBlob = null;
let shareURL = null;
let renderToken = 0;

function openShare() {
  const st = store.weekStats(week);
  const pastWeek = monday < mondayOf(new Date());
  shareMode = st.hasActual && (pastWeek || (isCurrentWeek() && todayIndex() >= 4)) ? 'bilan' : 'planning';
  openDialog(dlgShare);
  refreshPreview();
}

async function refreshPreview() {
  const token = ++renderToken;
  $$('[data-mode]', dlgShare).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === shareMode)));
  $('#share-native').disabled = true;
  $('#share-download').disabled = true;
  $('#share-loading').classList.remove('hidden');
  $('#share-img').classList.add('hidden');
  try {
    const blob = await renderPNG(buildCardHTML(week, monday, settings(), shareMode, weekSeason()));
    if (token !== renderToken) return;
    shareBlob = blob;
    if (shareURL) URL.revokeObjectURL(shareURL);
    shareURL = URL.createObjectURL(blob);
    const img = $('#share-img');
    img.src = shareURL;
    img.classList.remove('hidden');
    $('#share-loading').classList.add('hidden');
    $('#share-native').disabled = false;
    $('#share-download').disabled = false;
  } catch (err) {
    console.error(err);
    if (token === renderToken) $('#share-loading').textContent = 'Oups, impossible de générer l’image. Essaie le partage en texte.';
  }
}

const shareFilename = () => `${shareMode}-S${isoWeek(monday)}-${weekKey}.png`;
const shareTitle = () => `${shareMode === 'bilan' ? 'Mon bilan' : 'Mon planning'} · semaine ${isoWeek(monday)}`;

/* ------------------------------------------------------------------ */
/* Réglages                                                            */
/* ------------------------------------------------------------------ */
const dlgSettings = $('#dlg-settings');
let installPrompt = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/* ------------------------------------------------------------------ */
/* Saisons                                                             */
/* ------------------------------------------------------------------ */
/** Saison de l'interface : réglage manuel, sinon celle d'aujourd'hui. */
const currentSeason = () => (settings().season !== 'auto' ? settings().season : seasonOf(new Date()));
/** Saison de la carte partagée : celle de la semaine affichée (son jeudi). */
const weekSeason = () => (settings().season !== 'auto' ? settings().season : seasonOf(addDays(monday, 3)));

let appliedSeason = null;
let appliedFx = null;
function applySeason({ rerender = true } = {}) {
  const season = currentSeason();
  const fx = settings().seasonFx;
  document.documentElement.dataset.season = season;
  const tc = SEASONS[season].themeColor;
  $$('meta[name="theme-color"]').forEach((m) => { m.content = (m.media || '').includes('dark') ? tc.dark : tc.light; });
  $('#season-emoji').textContent = SEASONS[season].emoji;
  if (season !== appliedSeason) $('#logo').innerHTML = logoSVG(season);
  if (season !== appliedSeason || fx !== appliedFx) renderParticles($('#season-fx'), season, fx);
  const changed = season !== appliedSeason;
  appliedSeason = season;
  appliedFx = fx;
  if (rerender && changed) renderAll();
}

function renderSeasonPicker() {
  const cur = settings().season;
  const opts = [['auto', `Auto · ${SEASONS[seasonOf(new Date())].label}`],
    ...SEASON_IDS.map((id) => [id, `${SEASONS[id].emoji} ${SEASONS[id].label}`])];
  $('#season-picker').innerHTML = opts.map(([id, label]) =>
    `<button type="button" class="chip" data-season="${id}" aria-pressed="${cur === id}">${label}</button>`).join('');
}

function openSettings() {
  const s = settings();
  $('#set-name').value = s.name;
  $('#set-contract').value = s.contractHours;
  $('#set-break').value = s.defaultBreak;
  $('#set-majoration').checked = !!s.showMajoration;
  $('#set-fx').checked = !!s.seasonFx;
  $('#set-mascot').checked = !!s.mascot;
  renderSeasonPicker();
  renderInstall();
  openDialog(dlgSettings);
}

function renderInstall() {
  const box = $('#install-box');
  if (isStandalone()) {
    box.innerHTML = `<p class="flex items-center gap-2 font-bold text-sage-700 dark:text-sage-300">${icon('check', 'w-5 h-5')} Installée sur ton écran d'accueil</p>`;
  } else if (installPrompt) {
    box.innerHTML = `
      <p class="text-sm font-semibold text-ink-soft">Ajoute l'app à ton écran d'accueil : elle s'ouvre en plein écran et fonctionne sans réseau.</p>
      <button type="button" id="install-btn" class="btn-accent w-full mt-3">${icon('phone', 'w-5 h-5')} Installer l'application</button>`;
  } else if (isIOS) {
    box.innerHTML = `
      <p class="text-sm font-semibold text-ink-soft">Pour l'installer sur iPhone : dans <b>Safari</b>, touche
      <span class="inline-flex align-middle mx-0.5 text-accent-ink">${icon('share', 'w-4 h-4')}</span> <b>Partager</b>, puis <b>« Sur l'écran d'accueil »</b>.</p>`;
  } else {
    box.innerHTML = `<p class="text-sm font-semibold text-ink-soft">Ouvre le menu du navigateur puis <b>« Installer l'application »</b> ou <b>« Ajouter à l'écran d'accueil »</b>.</p>`;
  }
}

function onSettingsInput() {
  store.updateSettings({
    name: $('#set-name').value.trim(),
    contractHours: Number($('#set-contract').value.replace(',', '.')) || 35,
    defaultBreak: Number($('#set-break').value) || 0,
    showMajoration: $('#set-majoration').checked,
    seasonFx: $('#set-fx').checked,
    mascot: $('#set-mascot').checked,
  });
  applySeason();
  renderHeader();
  renderSummary();
}

/* ------------------------------------------------------------------ */
/* Dialogues, toasts, gestes                                           */
/* ------------------------------------------------------------------ */
function openDialog(dlg) {
  if (dlg.open) return;
  dlg.showModal();
  document.documentElement.style.overflow = 'hidden';
}
function closeDialog(dlg) {
  dlg.close();
}
for (const dlg of $$('dialog')) {
  dlg.addEventListener('close', () => { if (!$('dialog[open]')) document.documentElement.style.overflow = ''; });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-close]')) closeDialog(dlg);
  });
}

let toastTimer;
function toast(message, { action, onAction, duration = 3200 } = {}) {
  const host = $('dialog[open]') || $('#toast-root');
  $$('.cs-toast').forEach((t) => t.remove());
  const el = document.createElement('div');
  el.className = 'cs-toast fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm flex items-center gap-3 rounded-2xl bg-coffee-900 text-coffee-50 dark:bg-coffee-100 dark:text-coffee-950 shadow-lift px-4 py-3 text-sm font-bold animate-pop pointer-events-auto';
  el.style.top = 'max(.75rem, env(safe-area-inset-top))';
  el.setAttribute('role', 'status');
  el.innerHTML = `<span class="flex-1">${esc(message)}</span>${action ? `<button type="button" class="text-tone-300 dark:text-tone-700 font-extrabold uppercase text-xs tracking-wider">${esc(action)}</button>` : ''}`;
  if (action) el.querySelector('button').addEventListener('click', () => { el.remove(); onAction?.(); });
  host.append(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), action ? duration + 2000 : duration);
}

function haptic() {
  navigator.vibrate?.(8);
}

function setupSwipe() {
  const zone = $('#main');
  let x0 = null, y0 = null, t0 = 0;
  zone.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1 || e.target.closest('input, textarea, select, .overflow-x-auto')) { x0 = null; return; }
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
  }, { passive: true });
  zone.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Date.now() - t0 < 600 && Math.abs(dx) > 70 && Math.abs(dy) < 45) {
      goToWeek(addDays(monday, dx < 0 ? 7 : -7));
      haptic();
    }
  }, { passive: true });
}

/* ------------------------------------------------------------------ */
/* Branchements                                                        */
/* ------------------------------------------------------------------ */
function bind() {
  $('#prev-week').addEventListener('click', () => goToWeek(addDays(monday, -7)));
  $('#next-week').addEventListener('click', () => goToWeek(addDays(monday, 7)));
  $('#back-today').addEventListener('click', () => goToWeek(new Date()));
  $('#date-jump').addEventListener('change', (e) => e.target.value && goToWeek(fromKey(e.target.value)));

  const days = $('#days');
  days.addEventListener('input', onFieldInput);
  days.addEventListener('change', onFieldInput);
  days.addEventListener('click', onDaysClick);
  $('#tools').addEventListener('click', onToolsClick);

  $('#btn-share').addEventListener('click', openShare);
  $('#btn-month').addEventListener('click', () => openMonth());
  $('#summary').addEventListener('click', (e) => e.target.closest('[data-act="open-month"]') && openMonth());
  $('#prev-month').addEventListener('click', () => shiftMonth(-1));
  $('#next-month').addEventListener('click', () => shiftMonth(1));
  $('#month-body').addEventListener('click', (e) => {
    const row = e.target.closest('[data-week]');
    if (!row) return;
    closeDialog(dlgMonth);
    goToWeek(fromKey(row.dataset.week));
  });
  $('#month-share').addEventListener('click', async () => {
    try {
      const r = await shareText(buildMonthText(store.monthStats(monthCursor.y, monthCursor.m)), 'Mon mois');
      if (r === 'copied') toast('Texte copié — colle-le dans ton message 📋');
    } catch {
      toast('Partage indisponible sur cet appareil');
    }
  });
  $$('[data-mode]', dlgShare).forEach((b) => b.addEventListener('click', () => {
    if (shareMode === b.dataset.mode) return;
    shareMode = b.dataset.mode;
    refreshPreview();
  }));
  $('#share-native').addEventListener('click', async () => {
    if (!shareBlob) return;
    const r = await shareFile(shareBlob, shareFilename(), shareTitle());
    if (r === 'downloaded') toast('Image enregistrée ✓');
  });
  $('#share-download').addEventListener('click', () => {
    if (!shareBlob) return;
    downloadBlob(shareBlob, shareFilename());
    toast('Image enregistrée ✓');
  });
  $('#share-text').addEventListener('click', async () => {
    try {
      const r = await shareText(buildText(week, monday, settings(), shareMode, weekSeason()), shareTitle());
      if (r === 'copied') toast('Texte copié — colle-le dans ton message 📋');
    } catch {
      toast('Partage indisponible sur cet appareil');
    }
  });

  $('#btn-settings').addEventListener('click', openSettings);
  $('#season-picker').addEventListener('click', (e) => {
    const b = e.target.closest('[data-season]');
    if (!b) return;
    store.updateSettings({ season: b.dataset.season });
    renderSeasonPicker();
    applySeason();
    haptic();
  });
  $('#mascot').addEventListener('click', (e) => e.target.closest('#gb-btn') && pokeMascot());
  for (const id of ['#set-name', '#set-contract', '#set-break', '#set-majoration', '#set-fx', '#set-mascot']) {
    $(id).addEventListener('input', onSettingsInput);
    $(id).addEventListener('change', onSettingsInput);
  }
  $('#install-box').addEventListener('click', async (e) => {
    if (!e.target.closest('#install-btn') || !installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => {});
    installPrompt = null;
    renderInstall();
  });
  $('#backup-export').addEventListener('click', async () => {
    const blob = new Blob([store.exportJSON()], { type: 'application/json' });
    const r = await shareFile(blob, `coffee-schedule-sauvegarde-${toKey(new Date())}.json`, 'Sauvegarde Coffee & Schedule');
    if (r !== 'cancelled') toast('Sauvegarde exportée ✓');
  });
  $('#backup-import').addEventListener('click', () => $('#backup-file').click());
  $('#backup-file').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const n = store.importJSON(await file.text());
      week = store.getWeek(weekKey);
      openSettings();
      applySeason({ rerender: false });
      renderAll();
      toast(`${n} semaine${n > 1 ? 's' : ''} importée${n > 1 ? 's' : ''} ✓`);
    } catch {
      toast('Fichier de sauvegarde invalide');
    }
  });
  $('#reset-all').addEventListener('click', () => {
    if (!confirm('Effacer toutes les semaines et réglages de ce téléphone ? Cette action est définitive.')) return;
    store.resetAll();
    applySeason({ rerender: false });
    closeDialog(dlgSettings);
    goToWeek(new Date());
    toast('Tout a été effacé');
  });

  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; if (dlgSettings.open) renderInstall(); });
  addEventListener('appinstalled', () => { installPrompt = null; toast('Application installée ☕︎'); });

  // Retour au premier plan : rafraîchit « aujourd'hui » et le message d'accueil
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { applySeason({ rerender: false }); renderHeader(); renderSummary(); renderDays(); renderTools(); }
  });

  setupSwipe();
}

/* ------------------------------------------------------------------ */
/* Démarrage                                                           */
/* ------------------------------------------------------------------ */
$('#app-version').textContent = APP_VERSION;
bind();
applySeason({ rerender: false });
goToWeek(new Date(), { animate: false });

navigator.storage?.persist?.().catch(() => {});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW', e)));
}
