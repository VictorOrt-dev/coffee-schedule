/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ['./docs/**/*.html', './docs/js/**/*.js'],
  darkMode: 'media',
  future: { hoverOnlyWhenSupported: true }, // pas d'état « hover » collant au doigt
  theme: {
    extend: {
      colors: {
        // Palette fixe « coffee shop d'automne »
        coffee: {
          50: '#FBF7F1',   // mousse de lait
          100: '#F5ECE0',  // avoine
          200: '#EADBC8',  // crème
          300: '#D8BFA0',  // latte clair
          400: '#C09A74',  // latte
          500: '#A07652',  // noisette
          600: '#82593B',  // cannelle
          700: '#66432C',  // chocolat chaud
          800: '#4A3021',  // moka
          900: '#33211A',  // espresso
          950: '#1F1410',  // ristretto
        },
        caramel: {
          50: '#FDF6EC',
          100: '#FAE8CC',
          200: '#F4D09A',
          300: '#ECB566',
          400: '#E29C45',  // ambre
          500: '#D0822F',  // caramel
          600: '#B06625',
          700: '#8C4E21',
          800: '#6E3E1F',
          900: '#5A341C',
        },
        sage: { 100: '#E9EDDC', 300: '#C2CDA4', 500: '#86965F', 700: '#5C6A3C' },
        berry: { 100: '#F6DEDA', 500: '#B5473A', 700: '#8A3329' },

        // Jetons sémantiques (basculent en mode sombre « espresso »)
        bg: token('bg'),
        surface: token('surface'),
        'surface-2': token('surface-2'),
        ink: token('ink'),
        'ink-soft': token('ink-soft'),
        muted: token('muted'),
        line: token('line'),
        accent: token('accent'),
        'accent-ink': token('accent-ink'),
      },
      fontFamily: {
        sans: ['Nunito', 'ui-rounded', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Fredoka', 'Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '4xl': '2rem' },
      boxShadow: {
        soft: '0 1px 2px rgb(51 33 26 / .06), 0 8px 24px -12px rgb(51 33 26 / .18)',
        lift: '0 2px 4px rgb(51 33 26 / .08), 0 18px 40px -16px rgb(51 33 26 / .35)',
      },
    },
  },
  plugins: [],
};
