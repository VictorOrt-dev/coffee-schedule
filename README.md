# ☕ Coffee & Schedule

Une PWA mobile pour suivre ses heures de travail, pensée pour une pâtissière en coffee shop
(contrat 35 h, horaires qui changent souvent, heures supp. régulières), dans une ambiance
coffee shop d'automne.

- **Saisie par semaine** (lundi → dimanche) : horaires prévus et réels, pause, note, bouton « Off »
- **Raccourcis** : « Comme prévu », +15 min / +30 min / +1 h, copie de la semaine dernière, validation des jours passés en un tap, annulation
- **Calculs en direct** : total prévu, total effectué, heures supp. (« 39h30 effectuées = +4h30 supp. »), jauge vs contrat, détail indicatif des majorations (+25 % / +50 %)
- **Total du mois** (bouton 📅 ou encart « Total novembre ») : heures prévues et effectuées du mois, heures supp., jours travaillés, comparaison à la base mensualisée (35 h × 52 / 12 = 151h40), détail semaine par semaine et partage en texte. Les heures supp. restent calculées par semaine ; une semaine à cheval compte dans le mois où elle se termine
- **Planning propre** : carte « Coffee & Schedule » en PNG (html2canvas, ×3 = 1188 px de large), en version *Planning prévu* ou *Bilan effectué*, partagée via l'API Web Share (WhatsApp, SMS…), ou téléchargée, ou envoyée en texte
- **100 % local** : `localStorage`, sans compte ni serveur. Export / import d'une sauvegarde JSON
- **Ambiance de saison** (automatique selon la date, ou choisie dans ⚙︎ Réglages) :
  - ❄️ **Hiver** (déc.–févr.) : guimauve & canneberge, neige posée sur les cartes et le bouton, flocons qui tombent
  - 🌸 **Printemps** (mars–mai) : matcha & fleur de cerisier, fleurs dans les coins, pétales qui volent
  - ☀️ **Été** (juin–août) : sable, iced latte & menthe, rondelles de citron, bulles qui remontent, halo de soleil
  - 🍂 **Automne** (sept.–nov.) : caramel & avoine, feuilles mortes
  - Logo, messages des jours off, idées de notes et carte de partage changent aussi (la carte prend la saison de la semaine partagée). Mode sombre décliné pour chaque saison ; animations désactivables
- **Goombouille, la mascotte** (désactivable dans les réglages) : petite châtaigne pâtissière (dessin original) sur l'écran d'accueil, avec une tenue par saison (bonnet et chocolat chaud, couronne de fleurs, chapeau de paille et iced latte, feuille et latte cannelle). Elle réagit à la semaine : fatiguée en cas d'heures supp., yeux étoilés quand le contrat est pile rempli, endormie les jours off, rappel des horaires du jour… et lance une phrase de saison quand on la touche
- **PWA** : installable sur l'écran d'accueil, fonctionne hors-ligne (Service Worker), mode sombre « espresso » automatique

## Structure

```
coffee-schedule/
├── .github/workflows/deploy.yml   # Build Tailwind + déploiement GitHub Pages
├── docs/                          # ← site statique publié (prêt à l'emploi)
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── sw.js                      # Service Worker (pré-cache + hors-ligne)
│   ├── .nojekyll
│   ├── css/app.css                # Tailwind compilé (versionné)
│   ├── js/
│   │   ├── app.js                 # Interface, saisie, dialogues, gestes
│   │   ├── store.js               # localStorage + calculs de la semaine
│   │   ├── share.js               # Carte, export PNG, Web Share, texte
│   │   ├── seasons.js             # Ambiances de saison : textes, décors, logo, particules
│   │   ├── mascot.js              # Goombouille : dessin SVG, tenues, humeurs, phrases
│   │   └── time.js                # Dates, semaines ISO, durées
│   ├── fonts/                     # Nunito + Fredoka (auto-hébergées)
│   ├── vendor/html2canvas.min.js  # Chargé à la demande
│   └── icons/                     # SVG + PNG (192, 512, maskable, Apple)
├── src/styles.css                 # Source Tailwind (palette + composants)
├── tailwind.config.js             # Palette coffee / caramel / sage
├── scripts/
│   ├── copy-vendor.mjs            # Copie polices & html2canvas dans docs/
│   └── generate-icons.mjs         # Régénère les PNG depuis icon.svg (Playwright)
└── package.json
```

Pas de bundler : du JavaScript natif en modules ES, servi tel quel. Le seul build est Tailwind,
et `docs/css/app.css` est versionné, donc le dossier `docs/` marche sans aucun build.

## Déploiement sur GitHub Pages

```bash
git init && git add . && git commit -m "Coffee & Schedule"
git branch -M main
git remote add origin https://github.com/<toi>/coffee-schedule.git
git push -u origin main
```

Ensuite, choisis **une** des deux options dans *Settings → Pages* :

1. **GitHub Actions (recommandé)** : *Source → GitHub Actions*. Le workflow `deploy.yml`
   recompile le CSS et estampille le Service Worker à chaque push sur `main`.
2. **Dossier `/docs`** : *Source → Deploy from a branch → `main` / `/docs`*. Aucun build
   (pense à lancer `npm run build:css` avant de committer si tu modifies les classes).

L'app sera disponible sur `https://<toi>.github.io/coffee-schedule/`. Tous les chemins sont
relatifs, donc elle fonctionne dans un sous-dossier.

## Développement local

```bash
npm install
npm run dev        # Tailwind en mode watch + serveur sur http://localhost:5173
```

Le Service Worker ne s'active qu'en `http://localhost` ou en HTTPS.

## Personnalisation

- **Couleurs** : `tailwind.config.js` (palettes `coffee`, `tone` = accent de saison, `sage`, `berry`) et variables
  CSS par saison et par mode clair/sombre dans `src/styles.css` (`:root[data-season=…]`).
- **Saisons** : textes, couleurs de la carte et décors dans `docs/js/seasons.js`.
- **Carte de partage** : styles `.share-card` dans `src/styles.css`, contenu dans `docs/js/share.js`.
  Les couleurs sont fixes (toujours claire) pour un rendu identique partout.
- **Contrat / pause par défaut / prénom** : directement dans l'app (⚙︎ Réglages).

## Notes

- La majoration affichée (+25 % les 8 premières heures supp., +50 % au-delà) suit les taux légaux
  par défaut ; une convention collective peut prévoir d'autres taux. C'est une indication.
- Les données ne quittent jamais le téléphone. Sur iPhone, Safari peut effacer les données des sites
  peu visités : **installe l'app sur l'écran d'accueil** et exporte une sauvegarde de temps en temps.
