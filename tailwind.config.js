/** @type {import('tailwindcss').Config} */
export default {
  // Indicamos a Tailwind dónde buscar clases para purgar el CSS no utilizado
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Fuente principal de la aplicación
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Paleta de marca personalizada (naranja para el tema de tacos)
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        }
      }
    },
  },
  plugins: [],
}
