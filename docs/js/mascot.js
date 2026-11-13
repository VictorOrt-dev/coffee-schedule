// Goombouille : petite mascotte (châtaigne pâtissière) habillée selon la saison,
// dont l'humeur suit la semaine (heures supp., jour off, contrat rempli…).
// Dessin original en SVG.

const C = {
  body1: '#B07A48', body2: '#7A4A2B', belly: '#EBCB9F', feet: '#4A3021', ink: '#2B1B12',
  cheek: '#F2A0A0', apron: '#FFFDF7', apronLine: '#E6D6C2',
};

/* ---------- Visage selon l'humeur ---------- */
function face(mood) {
  const eye = (x) => `
    <ellipse cx="${x}" cy="55" rx="6.5" ry="8" fill="#fff"/>
    <circle cx="${x + 0.5}" cy="57" r="4.2" fill="${C.ink}"/>
    <circle cx="${x + 2}" cy="54.6" r="1.6" fill="#fff"/>`;
  const cheeks = `<ellipse cx="32" cy="65" rx="5" ry="3" fill="${C.cheek}" opacity=".75"/><ellipse cx="68" cy="65" rx="5" ry="3" fill="${C.cheek}" opacity=".75"/>`;
  switch (mood) {
    case 'tired': return `
      <g class="gb-eyes">${eye(40)}${eye(60)}</g>
      <path d="M33 52.5q7-3.5 14 0M53 52.5q7-3.5 14 0" stroke="${C.body2}" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M33.5 51h13M53.5 51h13" stroke="${C.body1}" stroke-width="5" stroke-linecap="round"/>
      ${cheeks}
      <path d="M44 68q3-2 6 0t6 0" stroke="${C.feet}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <path d="M77 36c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z" fill="#8EC5E8" stroke="#5B9CC4" stroke-width="1"/>`;
    case 'star': {
      const star = (x) => `<path d="M${x} 48l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8z" fill="#F2B33D" stroke="#C98A1E" stroke-width=".8" stroke-linejoin="round"/>`;
      return `${star(40)}${star(60)}${cheeks}
        <path d="M43 65q7 8 14 0z" fill="${C.feet}"/><path d="M46 67.6q4 2.6 8 0" stroke="#E07A7A" stroke-width="2" stroke-linecap="round"/>`;
    }
    case 'sleep': return `
      <path d="M34 56q6 4.5 12 0M54 56q6 4.5 12 0" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
      ${cheeks}
      <ellipse cx="50" cy="68" rx="2.6" ry="2.2" fill="${C.feet}"/>
      <g class="gb-zzz" fill="rgb(var(--accent-ink))" font-family="Fredoka, Nunito, sans-serif" font-weight="700">
        <text x="74" y="36" font-size="11">z</text><text x="81" y="27" font-size="14">Z</text></g>`;
    default: return `
      <g class="gb-eyes">${eye(40)}${eye(60)}</g>
      ${cheeks}
      <path d="M44.5 65.5q5.5 5.5 11 0" stroke="${C.feet}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`;
  }
}

/* ---------- Accessoires de saison ---------- */
function outfit(season) {
  switch (season) {
    case 'winter': return {
      head: `
        <path d="M25 42c0-17 11-24 25-24s25 7 25 24z" fill="#BE4153"/>
        <path d="M33 23v17M42 19v21M50 18v22M58 19v21M67 23v17" stroke="#A03244" stroke-width="2" opacity=".55"/>
        <rect x="22" y="37" width="56" height="9" rx="4.5" fill="#F2F5F8"/>
        <path d="M27 38v7M33 38v7M39 38v7M45 38v7M51 38v7M57 38v7M63 38v7M69 38v7" stroke="#D8E0E8" stroke-width="1.6"/>
        <circle cx="50" cy="16" r="6.5" fill="#F2F5F8"/><circle cx="48" cy="14" r="2" fill="#fff"/>`,
      neck: `
        <path d="M23 70q27 10 54 0v6q-27 10-54 0z" fill="#D4606F"/>
        <path d="M62 76l3 12h7l-3-13z" fill="#BE4153"/><path d="M64 84h6" stroke="#F0B8BF" stroke-width="1.6"/>`,
      hand: `
        <g transform="translate(80 60)"><path d="M0 0h12v9a5 5 0 0 1-5 5H5a5 5 0 0 1-5-5z" fill="#F5ECE0"/>
        <path d="M12 3h1.5a3 3 0 0 1 0 6H12" stroke="#F5ECE0" stroke-width="2" fill="none"/>
        <ellipse cx="6" cy="1" rx="6" ry="1.8" fill="#6B3E26"/><circle cx="3.5" cy="0" r="1.6" fill="#fff"/><circle cx="7" cy="-.4" r="1.8" fill="#fff"/>
        <path d="M4 -4c-1.5 1.5 1.5 2.5 0 4M8 -5c-1.5 1.5 1.5 2.5 0 4" stroke="#D8E0E8" stroke-width="1.2" stroke-linecap="round" fill="none"/></g>`,
      extra: `<g fill="#fff" stroke="#AFC3D6" stroke-width=".6"><circle cx="12" cy="30" r="2"/><circle cx="90" cy="20" r="1.6"/><circle cx="8" cy="54" r="1.3"/></g>`,
    };
    case 'spring': {
      const fl = (x, y, s, col) => `<g transform="translate(${x} ${y}) scale(${s})">${[0, 72, 144, 216, 288].map((a) =>
        `<ellipse cy="-4.6" rx="3.3" ry="4.6" fill="${col}" transform="rotate(${a})"/>`).join('')}<circle r="2.2" fill="#FFE59A"/></g>`;
      return {
        head: `
          <path d="M28 33q22-16 44 0" stroke="#86965F" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          <ellipse cx="31" cy="30" rx="4" ry="2" fill="#86965F" transform="rotate(-30 31 30)"/>
          <ellipse cx="69" cy="30" rx="4" ry="2" fill="#86965F" transform="rotate(30 69 30)"/>
          ${fl(34, 30, 1, '#F6C4D3')}${fl(42, 25.5, 1.1, '#EEA0B8')}${fl(50, 23.5, 1.25, '#F6C4D3')}${fl(58, 25.5, 1.1, '#EEA0B8')}${fl(66, 30, 1, '#F6C4D3')}`,
        neck: '',
        hand: `<g transform="translate(83 52)"><path d="M3 22c0-8 0-14 2-20" stroke="#86965F" stroke-width="1.8" fill="none" stroke-linecap="round"/>
          ${fl(5, 2, 1.25, '#EEA0B8')}<ellipse cx="1" cy="12" rx="3.5" ry="1.8" fill="#86965F" transform="rotate(-35 1 12)"/></g>`,
        extra: `<g class="gb-fly" transform="translate(12 22)"><ellipse cx="-3" cy="0" rx="3.6" ry="2.6" fill="#E27D9D" transform="rotate(-25)"/>
          <ellipse cx="3" cy="0" rx="3.6" ry="2.6" fill="#E27D9D" transform="rotate(25)"/><path d="M0 -2v5" stroke="#5A273C" stroke-width="1.2" stroke-linecap="round"/></g>`,
      };
    }
    case 'summer': return {
      head: `
        <ellipse cx="50" cy="35" rx="35" ry="7" fill="#E9C46A"/>
        <path d="M33 34c1-15 33-15 34 0z" fill="#F2D27E"/>
        <path d="M33.6 30.5q16.4 4 32.8 0l.4 3.5q-16.8 4-33.6 0z" fill="#2F9C88"/>
        <path d="M22 33q28 9 56 0" stroke="#D9B154" stroke-width="1" fill="none" opacity=".7"/>
        <g transform="translate(50 25)"><rect x="-14" y="-3" width="11" height="7" rx="3.5" fill="#33211A"/><rect x="3" y="-3" width="11" height="7" rx="3.5" fill="#33211A"/>
        <path d="M-3 0h6" stroke="#33211A" stroke-width="1.6"/><path d="M-11 -1h4M6 -1h4" stroke="#fff" stroke-width="1" opacity=".6" stroke-linecap="round"/></g>`,
      neck: '',
      hand: `
        <g transform="translate(80 50)"><path d="M0 6h12l-1.4 18H1.4z" fill="#FFFFFF" opacity=".85" stroke="#C9E6DE" stroke-width="1"/>
        <path d="M1 13h10l-1 11H2z" fill="#B07A48"/><path d="M1.2 10.5h9.6l-.2 2.5H1.4z" fill="#F3E3C8"/>
        <rect x="2.5" y="14" width="3" height="3" rx=".6" fill="#fff" opacity=".7"/><rect x="6.2" y="17" width="3" height="3" rx=".6" fill="#fff" opacity=".6"/>
        <path d="M7 6l3-8" stroke="#2F9C88" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="6" cy="6" rx="6.4" ry="1.6" fill="#E2F3EE"/></g>`,
      extra: `<g transform="translate(14 24)"><circle r="5.5" fill="#FFD66B"/>${[0, 60, 120, 180, 240, 300].map((a) =>
        `<path d="M0 -8v-2.5" stroke="#FFD66B" stroke-width="1.8" stroke-linecap="round" transform="rotate(${a})"/>`).join('')}</g>`,
    };
    default: return {
      head: `
        <g transform="rotate(-18 50 24)"><path d="M50 6c-10 8-12 17-1 26 11-9 10-18 1-26z" fill="#D0822F"/>
        <path d="M49.6 11v19" stroke="#8C4E21" stroke-width="1.2" stroke-linecap="round" opacity=".7"/></g>`,
      neck: `
        <path d="M23 70q27 10 54 0v6q-27 10-54 0z" fill="#E2A13F"/>
        <path d="M30 76l-3 12h7l2-12z" fill="#D0822F"/><path d="M28.5 84h6" stroke="#F4D09A" stroke-width="1.6"/>`,
      hand: `
        <g transform="translate(80 60)"><path d="M1 2h10l-1.2 11.5a2 2 0 0 1-2 1.5H4.2a2 2 0 0 1-2-1.5z" fill="#F5ECE0"/>
        <rect x="0" y="0" width="12" height="3" rx="1.2" fill="#8C4E21"/><rect x="1.5" y="6" width="9" height="4" fill="#D0822F"/>
        <path d="M4 -3c-1.5 1.5 1.5 2.5 0 4M8 -4c-1.5 1.5 1.5 2.5 0 4" stroke="#C09A74" stroke-width="1.2" stroke-linecap="round" fill="none"/></g>`,
      extra: `<g opacity=".9"><path d="M10 36c-5 4-6 8 0 13 6-5 5-9 0-13z" fill="#B5473A" transform="rotate(25 10 42)"/></g>`,
    };
  }
}

/** SVG complet de Goombouille. */
export function goombouilleSVG(season = 'autumn', mood = 'happy', size = 76) {
  const o = outfit(season);
  return `
<svg class="gb" width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="gb-body" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="${C.body1}"/><stop offset="1" stop-color="${C.body2}"/></radialGradient>
  </defs>
  ${o.extra}
  <ellipse cx="50" cy="94" rx="24" ry="3.5" fill="rgb(51 33 26 / .16)"/>
  <g class="gb-bob">
    <ellipse cx="38" cy="88" rx="10" ry="6" fill="${C.feet}"/><ellipse cx="62" cy="88" rx="10" ry="6" fill="${C.feet}"/>
    <ellipse cx="19" cy="64" rx="5" ry="6.5" fill="${C.body2}"/>
    <ellipse cx="81" cy="64" rx="5" ry="6.5" fill="${C.body2}"/>
    <path d="M50 24c20 0 32 16 32 36 0 18-14 28-32 28S18 78 18 60c0-20 12-36 32-36z" fill="url(#gb-body)"/>
    ${season === 'summer' ? '' : `<path d="M50 24c-1-5 2-9 6-11" stroke="${C.body2}" stroke-width="3" stroke-linecap="round" fill="none"/>`}
    <path d="M21 70c8 10 50 10 58 0-2 11-13 18-29 18S23 81 21 70z" fill="${C.belly}"/>
    <path d="M37 70h26v11q-13 6-26 0z" fill="${C.apron}"/>
    <path d="M37 70h26" stroke="${C.apronLine}" stroke-width="1.4"/><rect x="45" y="75" width="10" height="4" rx="1" fill="none" stroke="${C.apronLine}" stroke-width="1.2"/>
    ${o.neck}
    ${face(mood)}
    ${o.head}
    ${o.hand}
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
