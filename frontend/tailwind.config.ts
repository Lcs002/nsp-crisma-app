import type { Config } from 'tailwindcss'

const config: Config = {
  // --- ADD THIS LINE ---
  darkMode: 'class', // Enables class-based dark mode
  // --- END ADDITION ---
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    // --- ADD THIS LINE to get better default form styling ---
    require('@tailwindcss/forms'),
  ],
}
export default config