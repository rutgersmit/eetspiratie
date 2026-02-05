import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#fad7ad',
          300: '#f6ba78',
          400: '#f19341',
          500: '#ee751c',
          600: '#df5b12',
          700: '#b94311',
          800: '#933616',
          900: '#772f15',
          950: '#401509',
        },
      },
    },
  },
  plugins: [],
}
export default config
