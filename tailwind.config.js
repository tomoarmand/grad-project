module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        // Your original fonts - untouched
        bravura: ['Bravura', 'sans-serif'],
        bravuraText: ['BravuraText', 'serif'],
        // Brothers theme fonts
        heading: [process.env.VITE_FONT_HEADING || 'Bebas Neue', 'sans-serif'],
        body: [process.env.VITE_FONT_BODY || 'Raleway', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: process.env.VITE_PRIMARY || '#dc2626',
          primaryHover: process.env.VITE_PRIMARY_HOVER || '#b91c1c',
          bgDark: process.env.VITE_BG_DARK || '#171717',
          bgLight: process.env.VITE_BG_LIGHT || '#f9fafb',
          ctaFrom: process.env.VITE_CTA_FROM || '#f97316',
          ctaTo: process.env.VITE_CTA_TO || '#dc2626',
          bannerBg: process.env.VITE_BANNER_BG || '#eab308',
          success: process.env.VITE_SUCCESS || '#22c55e',
          highlight: process.env.VITE_HIGHLIGHT || '#eff6ff',
        }
      }
    }
  },
  plugins: [],
};