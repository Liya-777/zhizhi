/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'oklch(0.97 0 0)',
        'bg-secondary': 'oklch(0.93 0 0)',
        surface: {
          DEFAULT: 'oklch(1.0 0 0)',
          muted: 'oklch(0.95 0 0)',
        },
        separator: {
          DEFAULT: 'oklch(0.86 0 0)',
          opaque: 'oklch(0.78 0 0)',
        },
        ink: {
          DEFAULT: 'oklch(0 0 0)',
          secondary: 'oklch(0.36 0 0)',
          tertiary: 'oklch(0.48 0 0)',
          quaternary: 'oklch(0.60 0 0)',
        },
        metal: {
          DEFAULT: 'oklch(0.35 0 0)',
          hover: 'oklch(0.25 0 0)',
          ghost: 'oklch(0.93 0 0)',
        },
        green: {
          DEFAULT: 'oklch(0.55 0.18 145)',
        },
        orange: {
          DEFAULT: 'oklch(0.62 0.18 65)',
        },
        red: {
          DEFAULT: 'oklch(0.52 0.22 21)',
        },
      },

      boxShadow: {
        'card': '0 1px 3px oklch(0 0 0 / 0.04)',
        'card-hover': '0 2px 8px oklch(0 0 0 / 0.06)',
        'modal': '0 20px 60px oklch(0 0 0 / 0.08), 0 8px 20px oklch(0 0 0 / 0.06)',
      },

      fontSize: {
        caption2:  ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.01em' }],
        caption1:  ['0.75rem',   { lineHeight: '1.3' }],
        footnote:  ['0.8125rem', { lineHeight: '1.4' }],
        subhead:   ['0.9375rem', { lineHeight: '1.4' }],
        callout:   ['1rem',      { lineHeight: '1.5' }],
        body:      ['1.0625rem', { lineHeight: '1.5' }],
        headline:  ['1.0625rem', { lineHeight: '1.4', fontWeight: '600' }],
        title3:    ['1.25rem',   { lineHeight: '1.3' }],
        title2:    ['1.375rem',  { lineHeight: '1.3' }],
        title1:    ['1.75rem',   { lineHeight: '1.2', letterSpacing: '0.01em', fontWeight: '700' }],
        'lg-title':['2.125rem',  { lineHeight: '1.1', letterSpacing: '0.02em', fontWeight: '700' }],
      },

      animation: {
        'fade-in':    'fadeIn 0.3s cubic-bezier(0.17, 0.17, 0, 1.0)',
        'fade-in-up': 'fadeInUp 0.3s cubic-bezier(0.17, 0.17, 0, 1.0)',
        'scale-in':   'scaleIn 0.25s cubic-bezier(0.25, 0.1, 0.25, 1.0)',
        'spring-pop': 'springPop 0.35s cubic-bezier(0.17, 0.67, 0.35, 1.3) both',
        'squish':     'sendSquish 0.25s cubic-bezier(0.25, 0.1, 0.25, 1.0)',
        'skeleton':   'skeletonPulse 1.5s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        springPop: {
          '0%':   { opacity: '0', transform: 'scale(0.95) translateY(4px)' },
          '60%':  { opacity: '1', transform: 'scale(1.01) translateY(-1px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        sendSquish: {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(0.88)' },
          '100%': { transform: 'scale(1)' },
        },
        skeletonPulse: {
          '0%, 100%': { opacity: '0.3' },
          '50%':      { opacity: '0.6' },
        },
      },

      borderRadius: {
        xs:   '4px',
        sm:   '6px',
        md:   '10px',
        lg:   '13px',
        xl:   '18px',
        '2xl':'22px',
        full: '9999px',
      },

      spacing: {
        0: '0',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10:'40px',
        12:'48px',
        16:'64px',
      },
    },
  },
  plugins: [],
};
