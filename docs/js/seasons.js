// Ambiances de saison : textes, couleurs de la carte de partage, logo, décors et particules.
// Les couleurs de l'interface sont dans src/styles.css (variables CSS par [data-season]).

/** Saisons météorologiques : hiver déc.–févr., printemps mars–mai, été juin–août, automne sept.–nov. */
export function seasonOf(date = new Date()) {
  const m = date.getMonth();
  if (m === 11 || m < 2) return 'winter';
  if (m < 5) return 'spring';
  if (m < 8) return 'summer';
  return 'autumn';
}

export const SEASON_IDS = ['winter', 'spring', 'summer', 'autumn'];

export const SEASONS = {
  winter: {
    label: 'Hiver',
    emoji: '❄️',
    tagline: 'saison chocolat chaud',
    offTitle: 'Repos bien au chaud',
    offText: 'Plaid, chocolat chaud et chaussettes en laine ❄️',
    notePlaceholder: 'Note (bûches de Noël, galettes des rois…)',
    themeColor: { light: '#E9EDF1', dark: '#12161C' },
    card: {
      frame: '#DCE4EC', head1: '#2E3747', head2: '#1D232E', kicker: '#F0B8BF', week: '#B9C5D3', title: '#F2F5F8',
      bg: '#F7F9FB', tile: '#EAEFF4', acc1: '#E48C98', acc2: '#BE4153', accInk: '#7A1F33', pill: '#A03244',
      muted: '#7A8696', line: '#DCE4EC', off: '#6F8FA8', steam: '#F0B8BF', dial: '#D4606F',
    },
  },
  spring: {
    label: 'Printemps',
    emoji: '🌸',
    tagline: 'saison matcha & cerisiers',
    offTitle: 'Repos fleuri',
    offText: 'Balade au soleil et matcha latte en terrasse 🌸',
    notePlaceholder: 'Note (fraisiers, œufs de Pâques…)',
    themeColor: { light: '#F3F1E7', dark: '#1A1316' },
    card: {
      frame: '#F3E1E6', head1: '#5B3A45', head2: '#3E2A30', kicker: '#F6C4D3', week: '#E2C3CD', title: '#FFF4F7',
      bg: '#FFFBFC', tile: '#F8EDF0', acc1: '#EEA0B8', acc2: '#D05F84', accInk: '#6E2341', pill: '#B0486C',
      muted: '#A07A86', line: '#F1DCE2', off: '#7E9A5C', steam: '#F6C4D3', dial: '#E27D9D',
    },
  },
  summer: {
    label: 'Été',
    emoji: '☀️',
    tagline: 'saison iced latte',
    offTitle: 'Repos ensoleillé',
    offText: 'Iced latte, terrasse et lunettes de soleil ☀️',
    notePlaceholder: 'Note (tartes aux fruits, glaces maison…)',
    themeColor: { light: '#FAF3E3', dark: '#0F1716' },
    card: {
      frame: '#F6E7C8', head1: '#1F5F55', head2: '#17463F', kicker: '#FFD66B', week: '#A9D9CC', title: '#FFF9EC',
      bg: '#FFFDF6', tile: '#F6EFDD', acc1: '#4DB8A3', acc2: '#2F9C88', accInk: '#0F4038', pill: '#237E6E',
      muted: '#9A8466', line: '#F1E5C6', off: '#7E9A5C', steam: '#FFD66B', dial: '#F2B33D',
    },
  },
  autumn: {
    label: 'Automne',
    emoji: '🍂',
    tagline: 'saison latte cannelle',
    offTitle: 'Repos bien mérité',
    offText: 'Plaid, chocolat chaud et pieds au chaud 🍂',
    notePlaceholder: 'Note (tartes aux pommes, inventaire…)',
    themeColor: { light: '#F5ECE0', dark: '#1A110C' },
    card: {
      frame: '#EADBC8', head1: '#4A3021', head2: '#33211A', kicker: '#ECB566', week: '#D8BFA0', title: '#F5ECE0',
      bg: '#FBF7F1', tile: '#F5ECE0', acc1: '#ECB566', acc2: '#D0822F', accInk: '#6E3E1F', pill: '#B06625',
      muted: '#A07652', line: '#EADBC8', off: '#86965F', steam: '#ECB566', dial: '#D0822F',
    },
  },
};

/* ------------------------------------------------------------------ */
/* Petits dessins SVG                                                  */
/* ------------------------------------------------------------------ */
const svg = (size, body, style = '', vb = 40) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 ${vb} ${vb}" style="${style}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;

export const leaf = (color, size = 40, rot = 0) => svg(size,
  `<path d="M20 2C8 12 6 26 20 38 34 26 32 12 20 2Z" fill="${color}"/><path d="M20 8v28" stroke="rgba(0,0,0,.18)" stroke-width="1.6" stroke-linecap="round"/>`,
  `transform:rotate(${rot}deg)`);

export const snowflake = (color, size = 40, rot = 0) => svg(size,
  `<g stroke="${color}" stroke-width="2.6" stroke-linecap="round" fill="none">
     <path d="M20 3v34M5.3 11.5l29.4 17M5.3 28.5l29.4-17"/>
     <path d="M15 6l5 4 5-4M15 34l5-4 5 4M5 17l6.3-.3L9 11M35 23l-6.3.3L31 29M5 23l6.3.3L9 29M35 17l-6.3-.3L31 11"/>
   </g>`, `transform:rotate(${rot}deg)`);

export const blossom = (color, size = 40, rot = 0, heart = '#FFF2C4') => svg(size,
  `<g transform="translate(20 20)">${[0, 72, 144, 216, 288].map((a) =>
    `<ellipse cx="0" cy="-9.5" rx="6.5" ry="9" fill="${color}" transform="rotate(${a})"/>`).join('')}
    <circle r="4.2" fill="${heart}"/></g>`, `transform:rotate(${rot}deg)`);

export const petal = (color, size = 16, rot = 0) => svg(size,
  `<path d="M10 1c6 4 7 11 0 18C3 12 4 5 10 1z" fill="${color}"/>`, `transform:rotate(${rot}deg)`, 20);

export const lemon = (size = 40, rot = 0) => svg(size,
  `<circle cx="20" cy="20" r="18" fill="#F2B33D"/><circle cx="20" cy="20" r="14.5" fill="#FFE08A"/>
   <g stroke="#F2B33D" stroke-width="2" stroke-linecap="round">${[0, 45, 90, 135].map((a) =>
    `<path d="M20 7v26" transform="rotate(${a} 20 20)"/>`).join('')}</g><circle cx="20" cy="20" r="2.5" fill="#FFF6D6"/>`,
  `transform:rotate(${rot}deg)`);

export const sun = (color = '#F2B33D', size = 40) => svg(size,
  `<circle cx="20" cy="20" r="8.5" fill="${color}"/><g stroke="${color}" stroke-width="3" stroke-linecap="round">${
    [0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M20 3.5v5" transform="rotate(${a} 20 20)"/>`).join('')}</g>`);

/** Grand motif discret dans le coin du résumé (couleur via currentColor). */
export function cornerArt(season, size = 96) {
  switch (season) {
    case 'winter': return snowflake('currentColor', size, 12);
    case 'spring': return blossom('currentColor', size, -12, 'rgba(255,255,255,.55)');
    case 'summer': return sun('currentColor', size);
    default: return leaf('currentColor', size, -12);
  }
}

/** Décors posés sur la carte de partage (positions absolues). */
export function cardDecor(season, c) {
  const at = (css, art) => `<div style="position:absolute;${css}">${art}</div>`;
  switch (season) {
    case 'winter': return {
      frame: at('right:-8px;bottom:-6px;opacity:.75', snowflake('#FFFFFF', 54, 10)) + at('left:-12px;top:58%;opacity:.7', snowflake('#FFFFFF', 38, -14))
        + at('left:24px;top:8px;opacity:.9', '<div style="width:7px;height:7px;border-radius:9px;background:#fff"></div>')
        + at('right:40px;top:30%;opacity:.9', '<div style="width:5px;height:5px;border-radius:9px;background:#fff"></div>'),
      head: at('right:70px;top:10px', snowflake('#6F8099', 26, 0)) + at('right:110px;top:26px', snowflake('#56647A', 16, 20))
        + at('left:200px;top:16px', '<div style="width:4px;height:4px;border-radius:9px;background:#8C9AB0"></div>')
        + at('left:150px;top:30px', '<div style="width:3px;height:3px;border-radius:9px;background:#8C9AB0"></div>'),
    };
    case 'spring': return {
      frame: at('right:-6px;bottom:-8px;opacity:.85', blossom('#EEA0B8', 54, 14)) + at('left:-12px;top:58%;opacity:.7', blossom('#F6C4D3', 38, -10))
        + at('left:30px;top:6px;opacity:.8', petal('#EEA0B8', 12, 30)),
      head: at('right:66px;top:-8px', blossom('#8E5A6C', 34, 20, '#B37A8C')) + at('right:108px;top:14px', petal('#8E5A6C', 12, 40)),
    };
    case 'summer': return {
      frame: at('right:-10px;bottom:-10px;opacity:.95', lemon(56, 18)) + at('left:-14px;top:58%;opacity:.8', lemon(38, -20)),
      head: at('right:62px;top:-18px', sun('#FFD66B', 46)),
    };
    default: return {
      frame: at('right:-6px;bottom:-8px;opacity:.55', leaf('#D0822F', 54, -28)) + at('left:-10px;top:60%;opacity:.4', leaf('#B5473A', 38, 32)),
      head: at('right:62px;top:-10px', leaf('#6E4A33', 40, 160)),
    };
  }
}

/** Logo de l'en-tête (tasse-horloge) habillé selon la saison. */
export function logoSVG(season, size = 44) {
  const c = SEASONS[season].card;
  let back = '', front = '';
  if (season === 'winter') {
    back = `<g fill="#fff" opacity=".9"><circle cx="96" cy="120" r="9"/><circle cx="420" cy="96" r="7"/><circle cx="440" cy="300" r="6"/><circle cx="70" cy="300" r="5"/><circle cx="400" cy="200" r="4"/></g>`;
    // neige posée sur le bord de la tasse
    front = `
      <path d="M136 222c10-14 30-16 44-8 12-12 34-12 46-2 14-10 38-10 50 2 14-10 36-8 46 4 14-6 34-2 46 8v18H136z" fill="#fff"/>
      <circle cx="170" cy="246" r="7" fill="#fff"/><circle cx="262" cy="250" r="8" fill="#fff"/><circle cx="330" cy="244" r="6" fill="#fff"/>`;
  } else if (season === 'spring') {
    front = `<g transform="translate(372 86)">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-26" rx="17" ry="25" fill="#F6C4D3" transform="rotate(${a})"/>`).join('')}<circle r="11" fill="#FFE59A"/></g>
      <g transform="translate(436 170) scale(.5)">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-26" rx="17" ry="25" fill="#EEA0B8" transform="rotate(${a})"/>`).join('')}<circle r="11" fill="#FFE59A"/></g>
      <path d="M90 410c18-8 34-4 40 12-18 8-34 4-40-12z" fill="#F6C4D3" opacity=".8"/>`;
  } else if (season === 'summer') {
    front = `<g transform="translate(392 104)"><circle r="36" fill="#FFD66B"/><g stroke="#FFD66B" stroke-width="14" stroke-linecap="round">${
      [0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M0 -54v-18" transform="rotate(${a})"/>`).join('')}</g></g>`;
  } else {
    back = `<path d="M400 70c-40 20-52 62-30 98 40-14 58-56 30-98z" fill="#D0822F" opacity=".85"/>
      <path d="M408 384c34 6 52 34 46 66-32-4-52-30-46-66z" fill="#B5473A" opacity=".55"/>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="lg-${season}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.head1}"/><stop offset="1" stop-color="${c.head2}"/></linearGradient></defs>
    <rect width="512" height="512" rx="116" fill="url(#lg-${season})"/>
    ${back}
    <g transform="translate(256 278)">
      <path d="M-44 -138c-18 22 18 36 0 60M8 -150c-18 22 18 36 0 60" fill="none" stroke="${c.steam}" stroke-width="16" stroke-linecap="round" opacity=".8"/>
      <path d="M-120 -56h208v62a104 104 0 0 1-104 104h0A104 104 0 0 1-120 6z" fill="#F5ECE0"/>
      <path d="M88 -32h18a40 40 0 0 1 0 80h-26" fill="none" stroke="#F5ECE0" stroke-width="24" stroke-linecap="round"/>
      <circle cx="-16" cy="12" r="56" fill="${c.dial}"/>
      <path d="M-16 -18v30l20 14" fill="none" stroke="#33211A" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M-150 136h268" stroke="#C09A74" stroke-width="18" stroke-linecap="round"/>
    </g>
    ${front}
  </svg>`;
}

/* ------------------------------------------------------------------ */
/* Particules d'arrière-plan (neige, pétales, feuilles, bulles)        */
/* ------------------------------------------------------------------ */
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function renderParticles(host, season, enabled) {
  host.innerHTML = '';
  if (!enabled || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const count = { winter: 22, spring: 12, summer: 11, autumn: 9 }[season];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const outer = document.createElement('span');
    const inner = document.createElement('span');
    outer.className = season === 'summer' ? 'fx fx-rise' : 'fx';
    outer.style.left = `${rand(-2, 98).toFixed(1)}%`;
    const dur = season === 'winter' ? rand(11, 22) : season === 'summer' ? rand(14, 26) : rand(12, 20);
    outer.style.animationDuration = `${dur.toFixed(1)}s`;
    outer.style.animationDelay = `${(-rand(0, dur)).toFixed(1)}s`;
    inner.style.animationDuration = `${rand(2.8, 5.5).toFixed(1)}s`;

    if (season === 'winter') {
      if (Math.random() < 0.28) {
        inner.innerHTML = snowflake('#FFFFFF', Math.round(rand(12, 20)));
        inner.className = 'fx-flake';
      } else {
        const s = rand(3, 7.5);
        inner.innerHTML = `<i class="fx-snow" style="width:${s}px;height:${s}px;opacity:${rand(0.6, 1).toFixed(2)}"></i>`;
      }
    } else if (season === 'spring') {
      inner.innerHTML = petal(pick(['#F6C4D3', '#EEA0B8', '#FBE3EA']), Math.round(rand(10, 17)), rand(0, 360));
    } else if (season === 'summer') {
      const s = rand(8, 20);
      inner.innerHTML = `<i class="fx-bubble" style="width:${s}px;height:${s}px"></i>`;
    } else {
      inner.innerHTML = leaf(pick(['#D0822F', '#E29C45', '#B5473A', '#B06625']), Math.round(rand(14, 22)), rand(0, 360));
      inner.style.opacity = rand(0.55, 0.85).toFixed(2);
    }
    outer.append(inner);
    frag.append(outer);
  }
  host.append(frag);
}
