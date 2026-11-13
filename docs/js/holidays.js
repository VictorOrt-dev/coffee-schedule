// Jours fériés en France métropolitaine (calculés, aucune connexion requise).
import { addDays, toKey } from './time.js';

/** Dimanche de Pâques (algorithme de Meeus/Jones/Butcher). */
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}

const cache = new Map();

/** Map "YYYY-MM-DD" -> nom du jour férié pour l'année y. */
export function holidaysOf(y) {
  if (cache.has(y)) return cache.get(y);
  const e = easter(y);
  const list = [
    [new Date(y, 0, 1), 'Jour de l’an'],
    [addDays(e, 1), 'Lundi de Pâques'],
    [new Date(y, 4, 1), 'Fête du Travail'],
    [new Date(y, 4, 8), 'Victoire 1945'],
    [addDays(e, 39), 'Ascension'],
    [addDays(e, 50), 'Lundi de Pentecôte'],
    [new Date(y, 6, 14), 'Fête nationale'],
    [new Date(y, 7, 15), 'Assomption'],
    [new Date(y, 10, 1), 'Toussaint'],
    [new Date(y, 10, 11), 'Armistice'],
    [new Date(y, 11, 25), 'Noël'],
  ];
  const map = new Map(list.map(([d, n]) => [toKey(d), n]));
  cache.set(y, map);
  return map;
}

/** Nom du jour férié, ou null. */
export const holidayName = (date) => holidaysOf(date.getFullYear()).get(toKey(date)) || null;
