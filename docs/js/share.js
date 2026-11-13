// Carte « Coffee & Schedule » : génération HTML, export PNG (html2canvas) et partage natif.
import { DAY_NAMES, DAY_SHORT, addDays, fmtClock, fmtDur, isoWeek, monthLabel, weekRangeLong, weekRangeShort } from './time.js';
import { weekStats } from './store.js';
import { SEASONS, cardDecor } from './seasons.js';
import { DAY_KINDS } from './store.js';
import { holidayName } from './holidays.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const range = (s) => `${fmtClock(s.start)} – ${fmtClock(s.end)}`;
/** +30 min / +1h15 / −15 min */
export const fmtDiff = (m) => (Math.abs(m) < 60 ? `${m > 0 ? '+' : '−'}${Math.abs(m)} min` : fmtDur(m, { sign: true }));
const hasShift = (s) => !!(s.start && s.end);
const sameShift = (a, b) => a.start === b.start && a.end === b.end && (Number(a.brk) || 0) === (Number(b.brk) || 0);

const cupSVG = (c, season) => `
<svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M24 10c-3 4 3 6 0 10M33 8c-3 4 3 6 0 10" stroke="${c.steam}" stroke-width="3" stroke-linecap="round"/>
  <path d="M12 26h34v10a17 17 0 0 1-17 17 17 17 0 0 1-17-17V26Z" fill="#F5ECE0"/>
  <path d="M46 30h3a7 7 0 0 1 0 14h-4" stroke="#F5ECE0" stroke-width="4" stroke-linecap="round"/>
  <circle cx="29" cy="38" r="8" fill="${c.dial}"/>
  <path d="M29 33.5V38l3 2" stroke="#33211A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 57h44" stroke="#C09A74" stroke-width="3" stroke-linecap="round"/>
  ${season === 'winter' ? '<path d="M11 27c2-3 6-3 8-1 2-3 7-3 9-1 2-3 7-3 9 0 2-2 6-2 8 1 2-1 4 0 4 2v1H11z" fill="#FFFFFF"/>' : ''}
</svg>`;

/**
 * Construit le HTML de la carte.
 * mode : 'planning' (horaires prévus, à envoyer en début de semaine)
 *        'bilan'    (heures réellement effectuées + heures supp.)
 */
export function buildCardHTML(week, monday, settings, mode = 'planning', season = 'autumn') {
  const c = SEASONS[season].card;
  const decor = cardDecor(season, c);
  const st = weekStats(week, settings);
  const name = settings.name?.trim();
  const isBilan = mode === 'bilan';

  const rows = week.days.map((d, i) => {
    const date = addDays(monday, i);
    const ds = st.days[i];
    const note = d.note?.trim();
    let hours = '—', sub = 'Non renseigné', dur = '', pill = '', cls = '';

    if (d.off) {
      cls = 'is-off';
      hours = DAY_KINDS[d.kind].label;
      sub = note || (d.kind === 'ferie' ? holidayName(date) || '' : d.kind === 'off' ? 'Jour off' : '');
    } else if (isBilan && hasShift(d.actual)) {
      hours = range(d.actual);
      dur = fmtDur(ds.actual);
      if (hasShift(d.planned) && !sameShift(d.planned, d.actual)) sub = `prévu ${range(d.planned)}`;
      else sub = hasShift(d.planned) ? 'comme prévu' : '';
      if (ds.diff > 0) pill = `<span class="sc-pill">${fmtDiff(ds.diff)}</span>`;
      if (note) sub = sub ? `${sub} · ${note}` : note;
      sub ||= Number(d.actual.brk) ? `pause ${d.actual.brk} min` : '';
    } else if (hasShift(d.planned)) {
      hours = range(d.planned);
      dur = fmtDur(ds.planned);
      const brk = Number(d.planned.brk) ? `pause ${d.planned.brk} min` : 'sans pause';
      sub = isBilan ? 'prévu · pas encore saisi' : brk;
      if (note) sub = `${sub} · ${note}`;
    } else if (note) {
      sub = note;
    }

    return `
      <div class="sc-row ${cls}">
        <div class="sc-day"><b>${date.getDate()}</b><span>${DAY_SHORT[i]}</span></div>
        <div class="sc-main">
          <div class="sc-hours"><span>${esc(hours)}</span>${pill}</div>
          ${sub ? `<div class="sc-sub">${esc(sub)}</div>` : ''}
        </div>
        <div class="sc-dur">${esc(dur)}</div>
      </div>`;
  }).join('');

  const tiles = isBilan
    ? [
        ['Effectué', fmtDur(st.actual)],
        ['Prévu', fmtDur(st.planned)],
        ['Supp.', st.overtime > 0 ? fmtDur(st.overtime, { sign: true }) : '0h', st.overtime > 0],
      ]
    : [
        ['Prévu', fmtDur(st.planned)],
        ['Contrat', fmtDur(st.contract)],
        ['Supp.', st.plannedOvertime > 0 ? fmtDur(st.plannedOvertime, { sign: true }) : '0h', st.plannedOvertime > 0],
      ];

  const line = isBilan
    ? `${fmtDur(st.actual)} effectuées = ${st.overtime >= 0 ? fmtDur(st.overtime, { sign: true }) + ' supp.' : fmtDur(-st.overtime) + ' sous le contrat'}`
    : `${st.plannedDays} jour${st.plannedDays > 1 ? 's' : ''} de travail · ${st.offDays} off`;

  const title = isBilan
    ? (name ? `Le bilan de ${esc(name)}` : 'Mon bilan de la semaine')
    : (name ? `Le planning de ${esc(name)}` : 'Mon planning');

  return `
    <div class="share-frame" style="padding:18px;background:${c.frame};position:relative;overflow:hidden;width:396px;
      --sc-bg:${c.bg};--sc-h1:${c.head1};--sc-h2:${c.head2};--sc-title:${c.title};--sc-kicker:${c.kicker};--sc-week:${c.week};
      --sc-line:${c.line};--sc-muted:${c.muted};--sc-off:${c.off};--sc-pill:${c.pill};--sc-tile:${c.tile};
      --sc-acc1:${c.acc1};--sc-acc2:${c.acc2};--sc-acc-ink:${c.accInk};">
      ${decor.frame}
      <div class="share-card" style="position:relative">
        <div class="sc-head">
          ${decor.head}
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;position:relative">
            <div>
              <div class="sc-kicker">Coffee &amp; Schedule · ${SEASONS[season].label}</div>
              <div class="sc-title" style="margin-top:8px">${title}</div>
              <div class="sc-week">Semaine ${isoWeek(monday)} · ${weekRangeLong(monday)}</div>
            </div>
            ${cupSVG(c, season)}
          </div>
        </div>
        <div class="sc-body">${rows}</div>
        <div class="sc-foot">
          <div class="sc-totals">
            ${tiles.map(([k, v, over]) => `<div class="sc-total ${over ? 'is-over' : ''}"><small>${k}</small><strong>${v}</strong></div>`).join('')}
          </div>
          <div class="sc-sign"><span>${esc(line)}</span><span>S${isoWeek(monday)} · ${weekRangeShort(monday)}</span></div>
        </div>
      </div>
    </div>`;
}

/** Résumé texte (SMS / WhatsApp) */
export function buildText(week, monday, settings, mode = 'planning', season = 'autumn') {
  const st = weekStats(week, settings);
  const isBilan = mode === 'bilan';
  const lines = [`☕ ${isBilan ? 'Mon bilan' : 'Mon planning'} – semaine ${weekRangeLong(monday)}`, ''];
  week.days.forEach((d, i) => {
    const date = addDays(monday, i);
    const label = `${DAY_NAMES[i]} ${date.getDate()}`;
    let v = '—';
    if (d.off) v = d.kind === 'off' ? `Repos ${SEASONS[season].emoji}` : `${DAY_KINDS[d.kind].label} ${DAY_KINDS[d.kind].emoji}`;
    else if (isBilan && hasShift(d.actual)) v = `${range(d.actual)} (${fmtDur(st.days[i].actual)})`;
    else if (hasShift(d.planned)) v = `${range(d.planned)} (${fmtDur(st.days[i].planned)})${isBilan ? ' prévu' : ''}`;
    lines.push(`• ${label} : ${v}${d.note?.trim() ? ' – ' + d.note.trim() : ''}`);
  });
  lines.push('');
  if (isBilan) {
    lines.push(`Total effectué : ${fmtDur(st.actual)} (contrat ${fmtDur(st.contract)})`);
    if (st.overtime > 0) lines.push(`Heures supp. : ${fmtDur(st.overtime, { sign: true })}`);
  } else {
    lines.push(`Total prévu : ${fmtDur(st.planned)} (contrat ${fmtDur(st.contract)})`);
    if (st.plannedOvertime > 0) lines.push(`Dont ${fmtDur(st.plannedOvertime, { sign: true })} d'heures supp. prévues`);
  }
  return lines.join('\n');
}

/** Résumé texte du mois (stats issues de store.monthStats) */
export function buildMonthText(ms) {
  const lines = [`☕ Mon mois – ${monthLabel(ms.year, ms.month)}`, ''];
  if (ms.hasActual) lines.push(`Total effectué : ${fmtDur(ms.actual)} (prévu ${fmtDur(ms.planned)})`);
  else lines.push(`Total prévu : ${fmtDur(ms.planned)}`);
  if (ms.overtime > 0) lines.push(`Heures supp. : ${fmtDur(ms.overtime, { sign: true })}`);
  lines.push(`Jours travaillés : ${ms.workedDays} · off : ${ms.offDays}`);
  lines.push('');
  for (const w of ms.weeks) {
    if (!w.ws) continue;
    const ot = w.countsHere && w.ws.hasActual && w.ws.overtime > 0 ? ` · ${fmtDur(w.ws.overtime, { sign: true })} supp.` : '';
    if (!w.inPlanned && !w.inActual && !ot) continue;
    const val = w.inActualDays ? fmtDur(w.inActual) : w.inPlanned ? `${fmtDur(w.inPlanned)} prévu` : '0h';
    lines.push(`• S${isoWeek(w.monday)} (${weekRangeShort(w.monday)}) : ${val}${w.straddles ? ' sur le mois' : ''}${ot}`);
  }
  return lines.join('\n');
}

/* ------------------------------------------------------------------ */
/* Export PNG                                                          */
/* ------------------------------------------------------------------ */

let h2cPromise = null;
function loadHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  h2cPromise ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'vendor/html2canvas.min.js';
    s.async = true;
    s.onload = () => resolve(window.html2canvas);
    s.onerror = () => { h2cPromise = null; reject(new Error('html2canvas indisponible')); };
    document.head.append(s);
  });
  return h2cPromise;
}

/** Rend le HTML de la carte en PNG (Blob) via une scène hors-écran. */
export async function renderPNG(html, scale = 3) {
  const h2c = await loadHtml2Canvas();
  await document.fonts?.ready;
  const stage = document.createElement('div');
  stage.setAttribute('aria-hidden', 'true');
  stage.style.cssText = 'position:absolute;left:-10000px;top:0;pointer-events:none;';
  stage.innerHTML = html;
  document.body.append(stage);
  try {
    const target = stage.firstElementChild;
    const canvas = await h2c(target, {
      scale,
      backgroundColor: '#EADBC8',
      logging: false,
      useCORS: true,
      windowWidth: 420,
    });
    return await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('PNG vide'))), 'image/png'));
  } finally {
    stage.remove();
  }
}

/** Partage natif d'un fichier (image, sauvegarde…), sinon téléchargement. Renvoie 'shared' | 'downloaded' | 'cancelled'. */
export async function shareFile(blob, filename, title) {
  const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
      // NotAllowedError (geste expiré) ou autre : on bascule sur le téléchargement
    }
  }
  downloadBlob(blob, filename);
  return 'downloaded';
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function shareText(text, title) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
    }
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
}
