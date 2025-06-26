/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Design System Colors
        background: '#0a0a0a',
        foreground: '#ffffff',
        primary: '#1a1a1a',
        muted: '#2a2a2a',
        'muted-foreground': '#a1a1aa',
        
        // Accent Colors
        'accent-mint': '#44b626',
        'accent-coral': '#FF6B9D',
        'accent-yellow': '#FFD93D',
        'accent-blue': '#74C0FC',
        'accent-purple': '#B794F6',
        
        // Semantic Colors
        card: '#1a1a1a',
        'card-foreground': '#ffffff',
        popover: '#1a1a1a',
        'popover-foreground': '#ffffff',
        'primary-foreground': '#000000',
        secondary: '#2a2a2a',
        'secondary-foreground': '#ffffff',
        accent: '#2a2a2a',
        'accent-foreground': '#ffffff',
        destructive: '#ef4444',
        'destructive-foreground': '#ffffff',
        border: 'rgba(255, 255, 255, 0.1)',
        input: 'rgba(255, 255, 255, 0.15)',
        ring: '#a1a1aa',
      },
      borderRadius: {
        lg: '1.25rem',
        md: '1rem',
        sm: '0.75rem',
        xl: '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.3), 0 4px 16px -4px rgba(0, 0, 0, 0.2)',
        'medium': '0 4px 12px -2px rgba(0, 0, 0, 0.4), 0 8px 24px -4px rgba(0, 0, 0, 0.3)',
        'strong': '0 8px 24px -4px rgba(0, 0, 0, 0.5), 0 16px 48px -8px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(100, 255, 218, 0.3)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
} 