/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui';

export default {
    content: [],
    extend: {
        screens: {
             'max-sm': {'max': '639px'},
        },
    },
    plugins: [daisyui],
    daisyui: {
        themes: ["light"], // Only include the light theme
        darkTheme: "light", // Optional: ensures "darkTheme" fallback also uses light
    }
}
