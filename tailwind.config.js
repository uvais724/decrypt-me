/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [],
    extend: {
        screens: {
             'max-sm': {'max': '639px'},
        },
    },
    plugins: [require('daisyui')],
    daisyui: {
        themes: ["light"], // Only include the light theme
        darkTheme: "light", // Optional: ensures "darkTheme" fallback also uses light
    }
}
