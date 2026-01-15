/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Теперь у нас есть класс bg-primary, text-primary и т.д.
                primary: 'rgb(var(--color-primary) / <alpha-value>)',
            },
            fontFamily: {
                // Можно сменить шрифт на более широкий, если текущий кажется узким
                sans: ['Inter', 'system-ui', 'sans-serif'],
            }
        },
    },
    plugins: [],
}