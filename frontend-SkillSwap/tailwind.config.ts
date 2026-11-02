import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#0B0F19',
        surface: '#0f172a',
        emerald: {
          DEFAULT: '#10b981',
          light: '#34d399'
        },
        cyan: {
          DEFAULT: '#06b6d4'
        },
        amber: {
          DEFAULT: '#f59e0b'
        },
        violet: {
          DEFAULT: '#8b5cf6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
