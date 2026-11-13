// Goombouille : petit champignon grognon façon Goomba (dessin SVG fait main),
// habillé selon la saison, dont l'humeur suit les heures de la semaine.

const C = {
  head1: '#C2733F', head2: '#8E4B27', lid: '#A45A31', stem: '#EFD2A8', stemShade: '#D9B486',
  feet: '#5E3621', brow: '#1E120C', ink: '#1E120C', mouth: '#3A2015', fang: '#FFFFFF', cheek: '#F29C8F',
};

/* ---------- Visage selon l'humeur ---------- */
const eyes = (pupilDY = 0) => [41, 59].map((x, i) => `
  <ellipse cx="${x}" cy="48" rx="6.5" ry="9.5" fill="#fff"/>
  <ellipse cx="${x + (i ? -1.5 : 1.5)}" cy="${50 + pupilDY}" rx="3.3" ry="4.7" fill="${C.ink}"/>
  <circle cx="${x + (i ? -0.5 : 2.5)}" cy="${47.2 + pupilDY}" r="1.4" fill="#fff"/>`).join('');

const brows = (l, r, w = 5.5) => `<path d="${l}" stroke="${C.brow}" stroke-width="${w}" stroke-linecap="round" fill="none"/>
  <path d="${r}" stroke="${C.brow}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;

/** Deux crocs qui pointent vers le haut aux coins de la bouche. */
const fangs = (lx, ly, rx, ry, h = 7) => `<g fill="${C.fang}" stroke="#D8CBBB" stroke-width=".6" stroke-linejoin="round">
  <path d="M${lx - 2.6} ${ly} L${lx} ${ly - h} L${lx + 2.6} ${ly - 0.6} Z"/>
  <path d="M${rx - 2.6} ${ry - 0.6} L${rx} ${ry - h} L${rx + 2.6} ${ry} Z"/></g>`;

const cheeks = (o = 0.45) => `<ellipse cx="29" cy="58" rx="4.5" ry="2.6" fill="${C.cheek}" opacity="${o}"/><ellipse cx="71" cy="58" rx="4.5" ry="2.6" fill="${C.cheek}" opacity="${o}"/>`;

function face(mood) {
  switch (mood) {
    case 'angry': // le Goomba classique : sourcils en V, moue, crocs
      return `<g class="gb-eyes">${eyes(1)}</g>
        ${brows('M28 35 Q38 32 46.5 41.5', 'M72 35 Q62 32 53.5 41.5', 6)}
        <path d="M40.5 64 Q50 58.5 59.5 64" stroke="${C.mouth}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        ${fangs(41.5, 64.5, 58.5, 64.5)}
        <path d="M80 30l2 -4M84 33l4 -2M83 38h4" stroke="#B5473A" stroke-width="2" stroke-linecap="round"/>`;
    case 'tired':
      return `<g class="gb-eyes">${eyes(2.5)}</g>
        <path d="M34.5 47.5 A6.5 9.5 0 0 1 47.5 47.5 Z M52.5 47.5 A6.5 9.5 0 0 1 65.5 47.5 Z" fill="${C.lid}"/>
        <path d="M34.5 47.5h13M52.5 47.5h13" stroke="${C.head2}" stroke-width="1.6" stroke-linecap="round"/>
        ${brows('M30 39.5 Q38 38.5 45.5 33.5', 'M70 39.5 Q62 38.5 54.5 33.5', 5)}
        <path d="M42 63.5q2-1.8 4 0t4 0 4 0 4 0" stroke="${C.mouth}" stroke-width="2.3" stroke-linecap="round" fill="none"/>
        ${fangs(42, 64, 58, 64, 5)}
        <path d="M81 28c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z" fill="#8EC5E8" stroke="#5B9CC4" stroke-width="1"/>`;
    case 'star': {
      const star = (x) => `<path d="M${x} 41l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="#F2B33D" stroke="#B9801C" stroke-width=".9" stroke-linejoin="round"/>`;
      return `${star(41)}${star(59)}
        ${brows('M31 31 Q38 27 45 31', 'M69 31 Q62 27 55 31', 4.6)}
        ${cheeks(0.55)}
        <path d="M40 59 Q50 73 60 59 Z" fill="#7A1E1E"/><ellipse cx="50" cy="66" rx="5" ry="2.6" fill="#E8798A"/>
        ${fangs(41.8, 60.6, 58.2, 60.6, 6)}`;
    }
    case 'sleep':
      return `<path d="M35 50q6 4.5 12 0M53 50q6 4.5 12 0" stroke="${C.ink}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
        ${brows('M31 38 Q38 36 45 38', 'M69 38 Q62 36 55 38', 4.6)}
        ${cheeks(0.5)}
        <path d="M45.5 63q4.5 2.4 9 0" stroke="${C.mouth}" stroke-width="2.3" stroke-linecap="round" fill="none"/>
        ${fangs(45.5, 63.3, 54.5, 63.3, 4.5)}
        <g class="gb-zzz" fill="rgb(var(--accent-ink))" font-family="Fredoka, Nunito, sans-serif" font-weight="700">
          <text x="78" y="30" font-size="11">z</text><text x="85" y="21" font-size="15">Z</text></g>`;
    default: // content
      return `<g class="gb-eyes">${eyes(0)}</g>
        ${brows('M30.5 35.5 Q38 30.5 45.5 35', 'M69.5 35.5 Q62 30.5 54.5 35', 5)}
        ${cheeks()}
        <path d="M41 60.5 Q50 68 59 60.5" stroke="${C.mouth}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        ${fangs(42.3, 61.8, 57.7, 61.8, 6)}`;
  }
}

/* ---------- Tenues & objets de saison (posés au sol : le Goomba n'a pas de bras) ---------- */
function outfit(season) {
  switch (season) {
    case 'winter': return {
      head: `
        <path d="M29 28C30 9 70 9 71 28z" fill="#BE4153"/>
        <path d="M37 13v15M44 10.5v17.5M50 10v18M56 10.5v17.5M63 13v15" stroke="#A03244" stroke-width="2" opacity=".55"/>
        <rect x="26" y="23" width="48" height="8.5" rx="4.2" fill="#F2F5F8"/>
        <path d="M31 24v6.5M36 24v6.5M41 24v6.5M46 24v6.5M51 24v6.5M56 24v6.5M61 24v6.5M66 24v6.5M70 24v6.5" stroke="#D8E0E8" stroke-width="1.5"/>
        <circle cx="50" cy="7.5" r="6.2" fill="#F2F5F8"/><circle cx="48" cy="5.5" r="2" fill="#fff"/>`,
      neck: `
        <rect x="35" y="65" width="30" height="8" rx="3.5" fill="#D4606F"/>
        <path d="M57 71l3 12h6.5l-3-12.5z" fill="#BE4153"/><path d="M59.5 79.5h6" stroke="#F0B8BF" stroke-width="1.5"/>`,
      ground: `
        <g transform="translate(83 81)"><path d="M0 0h11v8.5a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 0 8.5z" fill="#F5ECE0" stroke="#D8C7B0" stroke-width=".6"/>
        <path d="M11 2.5h1.4a2.8 2.8 0 0 1 0 5.6H11" stroke="#F5ECE0" stroke-width="1.8" fill="none"/>
        <ellipse cx="5.5" cy="1" rx="5.5" ry="1.6" fill="#6B3E26"/><circle cx="3.4" cy=".1" r="1.5" fill="#fff"/><circle cx="6.8" cy="-.3" r="1.7" fill="#fff"/>
        <path d="M3.5 -4c-1.4 1.4 1.4 2.4 0 3.8M7.5 -5c-1.4 1.4 1.4 2.4 0 3.8" stroke="#C7D3DF" stroke-width="1.1" stroke-linecap="round" fill="none"/></g>`,
      extra: `<g fill="#fff" stroke="#AFC3D6" stroke-width=".6"><circle cx="10" cy="26" r="2"/><circle cx="91" cy="14" r="1.6"/><circle cx="6" cy="52" r="1.3"/><circle cx="94" cy="58" r="1.4"/></g>`,
    };
    case 'spring': {
      const fl = (x, y, s, col) => `<g transform="translate(${x} ${y}) scale(${s})">${[0, 72, 144, 216, 288].map((a) =>
        `<ellipse cy="-4.6" rx="3.3" ry="4.6" fill="${col}" transform="rotate(${a})"/>`).join('')}<circle r="2.2" fill="#FFE59A"/></g>`;
      return {
        head: `
          <path d="M27 31q23-20 46 0" stroke="#86965F" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          <ellipse cx="29" cy="29" rx="4" ry="2" fill="#86965F" transform="rotate(-35 29 29)"/>
          <ellipse cx="71" cy="29" rx="4" ry="2" fill="#86965F" transform="rotate(35 71 29)"/>
          ${fl(33, 27.5, 1, '#F6C4D3')}${fl(41, 21.5, 1.1, '#EEA0B8')}${fl(50, 19, 1.3, '#F6C4D3')}${fl(59, 21.5, 1.1, '#EEA0B8')}${fl(67, 27.5, 1, '#F6C4D3')}`,
        neck: '',
        ground: `<g transform="translate(9 70)"><path d="M3 24c0-8 0-15 1-21" stroke="#86965F" stroke-width="1.8" fill="none" stroke-linecap="round"/>
          <ellipse cx="0" cy="15" rx="3.6" ry="1.8" fill="#86965F" transform="rotate(-35 0 15)"/><ellipse cx="7" cy="11" rx="3.6" ry="1.8" fill="#86965F" transform="rotate(35 7 11)"/>
          ${fl(4, 2, 1.25, '#EEA0B8')}</g>`,
        extra: `<g class="gb-fly" transform="translate(88 20)"><ellipse cx="-3" cy="0" rx="3.6" ry="2.6" fill="#E27D9D" transform="rotate(-25)"/>
          <ellipse cx="3" cy="0" rx="3.6" ry="2.6" fill="#E27D9D" transform="rotate(25)"/><path d="M0 -2v5" stroke="#5A273C" stroke-width="1.2" stroke-linecap="round"/></g>`,
      };
    }
    case 'summer': return {
      head: `
        <ellipse cx="50" cy="23" rx="34" ry="6.5" fill="#E9C46A"/>
        <path d="M35 22C36 6 64 6 65 22z" fill="#F2D27E"/>
        <path d="M35.4 18.5q14.6 3.6 29.2 0l.4 3.4q-15 3.6-30 0z" fill="#2F9C88"/>
        <path d="M23 21q27 8 54 0" stroke="#D9B154" stroke-width="1" fill="none" opacity=".7"/>
        <g transform="translate(50 13)"><rect x="-13" y="-3" width="10.5" height="6.5" rx="3.2" fill="#33211A"/><rect x="2.5" y="-3" width="10.5" height="6.5" rx="3.2" fill="#33211A"/>
        <path d="M-2.5 0h5" stroke="#33211A" stroke-width="1.5"/><path d="M-10.5 -1h4M5 -1h4" stroke="#fff" stroke-width="1" opacity=".6" stroke-linecap="round"/></g>`,
      neck: '',
      ground: `
        <g transform="translate(83 70)"><path d="M0 6h11l-1.3 17H1.3z" fill="#FFFFFF" opacity=".88" stroke="#C9E6DE" stroke-width="1"/>
        <path d="M1 12.5h9l-.9 10.5H1.9z" fill="#B07A48"/><path d="M1.2 10h8.6l-.2 2.5H1.4z" fill="#F3E3C8"/>
        <rect x="2.3" y="13.5" width="2.8" height="2.8" rx=".6" fill="#fff" opacity=".7"/><rect x="5.8" y="16.5" width="2.8" height="2.8" rx=".6" fill="#fff" opacity=".6"/>
        <path d="M6.5 6l3-8" stroke="#2F9C88" stroke-width="1.7" stroke-linecap="round"/><ellipse cx="5.5" cy="6" rx="6" ry="1.5" fill="#E2F3EE"/></g>`,
      extra: `<g transform="translate(12 18)"><circle r="5.5" fill="#FFD66B"/>${[0, 60, 120, 180, 240, 300].map((a) =>
        `<path d="M0 -8v-2.5" stroke="#FFD66B" stroke-width="1.8" stroke-linecap="round" transform="rotate(${a})"/>`).join('')}</g>`,
    };
    default: return {
      head: `
        <g transform="rotate(-20 50 18)"><path d="M50 1c-10 8-12 17-1 26 11-9 10-18 1-26z" fill="#D0822F"/>
        <path d="M49.6 6v19" stroke="#8C4E21" stroke-width="1.2" stroke-linecap="round" opacity=".7"/></g>`,
      neck: `
        <rect x="35" y="65" width="30" height="8" rx="3.5" fill="#E2A13F"/>
        <path d="M42 71l-3 12h6.5l2-12.5z" fill="#D0822F"/><path d="M40.3 79.5h6" stroke="#F4D09A" stroke-width="1.5"/>`,
      ground: `
        <g transform="translate(5 82)"><ellipse cx="7" cy="6" rx="7" ry="5.5" fill="#E2833A"/><ellipse cx="7" cy="6" rx="3.2" ry="5.5" fill="#EE9A4D"/>
        <path d="M7 1.2c0-2 1-3.2 2.6-3.6" stroke="#6B7A3E" stroke-width="1.8" stroke-linecap="round" fill="none"/></g>
        <g transform="translate(84 82)"><path d="M1 2h9l-1.1 10.5a2 2 0 0 1-2 1.5H4.1a2 2 0 0 1-2-1.5z" fill="#F5ECE0" stroke="#D8C7B0" stroke-width=".6"/>
        <rect x="0" y="0" width="11" height="2.8" rx="1.2" fill="#8C4E21"/><rect x="1.5" y="5.5" width="8" height="3.6" fill="#D0822F"/>
        <path d="M3.5 -3.5c-1.4 1.4 1.4 2.4 0 3.8M7.5 -4.5c-1.4 1.4 1.4 2.4 0 3.8" stroke="#C09A74" stroke-width="1.1" stroke-linecap="round" fill="none"/></g>`,
      extra: `<path d="M90 30c-5 4-6 8 0 13 6-5 5-9 0-13z" fill="#B5473A" opacity=".85" transform="rotate(25 90 36)"/>`,
    };
  }
}

/** SVG complet de Goombouille. Humeurs : happy | tired | angry | star | sleep */
export function goombouilleSVG(season = 'autumn', mood = 'happy', size = 76) {
  const o = outfit(season);
  return `
<svg class="gb" width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="gb-head" cx=".4" cy=".28" r=".85"><stop offset="0" stop-color="${C.head1}"/><stop offset="1" stop-color="${C.head2}"/></radialGradient>
    <linearGradient id="gb-stem" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.stemShade}"/><stop offset=".45" stop-color="${C.stem}"/><stop offset="1" stop-color="${C.stemShade}"/></linearGradient>
  </defs>
  ${o.extra}
  <ellipse cx="50" cy="95.5" rx="33" ry="3.2" fill="rgb(51 33 26 / .16)"/>
  ${o.ground}
  <g class="gb-bob">
    <path d="M39.5 62c-1.8 8-2.6 16-1.5 24 5.5 3.8 18.5 3.8 24 0 1.1-8 .3-16-1.5-24z" fill="url(#gb-stem)"/>
    <path d="M20 90c0-8 10-10.5 20-8.5 6 1.2 8 6.5 6 10.5-6 3-22 3-26-2z" fill="${C.feet}"/>
    <path d="M80 90c0-8-10-10.5-20-8.5-6 1.2-8 6.5-6 10.5 6 3 22 3 26-2z" fill="${C.feet}"/>
    <path d="M24 85.5c4-2 10-2.3 15-1.3" stroke="#7A4A2F" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".7"/>
    <path d="M76 85.5c-4-2-10-2.3-15-1.3" stroke="#7A4A2F" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".7"/>
    ${o.neck}
    <g transform="translate(0 -5)">
    <path d="M50 16c17 0 29 14 34 30 4 12 6 20-2 24-8 4-20 2-32 2s-24 2-32-2c-8-4-6-12-2-24 5-16 17-30 34-30z" fill="url(#gb-head)"/>
    <path d="M16 64c-2 4 0 6 2 6 8 4 20 2 32 2s24 2 32-2c2 0 4-2 2-6-8 4-22 5-34 5s-26-1-34-5z" fill="rgb(0 0 0 / .13)"/>
    <ellipse cx="37" cy="27" rx="11" ry="5" fill="#fff" opacity=".16" transform="rotate(-22 37 27)"/>
    ${face(mood)}
    ${o.head}
    </g>
  </g>
</svg>`;
}

/* ---------- Phrases ---------- */
export const PHRASES = {
  winter: ['Un chocolat chaud pour te réchauffer ?', 'Il neige… parfait pour une bûche !', 'Mets ton écharpe, il fait froid ❄️', 'Guimauve dans le chocolat, obligatoire !'],
  spring: ['Les cerisiers sont en fleurs 🌸', 'Saison des fraisiers !', 'Un matcha latte pour la pause ?', 'Ça sent bon le printemps !'],
  summer: ['Un iced latte bien frais ? 🧊', 'Vive les tartes aux fruits !', 'Pense à boire de l’eau ☀️', 'Une glace après le service ?'],
  autumn: ['Latte cannelle et feuilles qui tombent 🍂', 'Saison des tartes aux pommes !', 'Plaid et chocolat après le service', 'Les citrouilles sont de retour 🎃'],
};
