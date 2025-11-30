/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: { DEFAULT: '#901b20', hover: '#701519', dark: '#f87171' },
                leet: {
                    bg: '#1a1a1a',
                    card: '#282828',
                    input: '#333333',
                    text: '#eff2f6',
                    sub: '#8a8a8a',
                    border: '#444444'
                }
            }
        },
    },
    plugins: [],
}
