/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            // Font Family
            fontFamily: {
                sans: ["'Inter'", '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
                mono: ["'Fira Code'", "'JetBrains Mono'", '"Courier New"', 'monospace']
            },
            colors: {
                // Existing brand colors (preserved)
                brand: { DEFAULT: '#901b20', hover: '#701519', dark: '#f87171' },
                
                // Existing dark mode colors (preserved)
                leet: {
                    bg: '#1a1a1a',
                    card: '#282828',
                    input: '#333333',
                    text: '#eff2f6',
                    sub: '#8a8a8a',
                    border: '#444444'
                },
                
                // Semantic colors (new)
                primary: {
                    50: '#fef2f2',
                    100: '#fee2e2',
                    500: '#901b20',
                    600: '#701519',
                    700: '#5a1114'
                },
                success: {
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    500: '#10b981',
                    600: '#059669'
                },
                warning: {
                    50: '#fffbeb',
                    100: '#fef3c7',
                    500: '#f59e0b',
                    600: '#d97706'
                },
                danger: {
                    50: '#fef2f2',
                    100: '#fee2e2',
                    500: '#ef4444',
                    600: '#dc2626'
                },
                neutral: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    700: '#374151',
                    800: '#1f2937',
                    900: '#111827'
                }
            }
        },
    },
    plugins: [],
}
