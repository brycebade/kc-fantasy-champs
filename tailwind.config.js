import daisyui from "daisyui"

export default {
    content: ["./index.html", "./src/**/*.{js,ts}"],
    plugins: [daisyui],

    daisyui: {
        themes: [
            {
                kcTheme: {
                    primary: "#E31837",
                    secondary: "#FFB81C",
                    accent: "#111827",
                    neutral: "#1f2937",
                    "base-100": "#ffffff",
                    "base-200": "#f3f4f6",
                    "base-300": "#e5e7eb"
                }
            },
            {
                nightGame: {
                    primary: "#E31837",
                    secondary: "#FFB81C",
                    accent: "#facc15",
                    neutral: "#020617",
                    "base-100": "#0f172a",
                    "base-200": "#111827",
                    "base-300": "#1f2937"
                }
            },
            {
                playoffs: {
                    primary: "#FFD700",
                    secondary: "#E31837",
                    accent: "#ffffff",
                    neutral: "#111111",
                    "base-100": "#0a0a0a",
                    "base-200": "#141414",
                    "base-300": "#1f1f1f"
                }
            },
            {
                championship: {
                    primary: "#FFD700",
                    secondary: "#ffffff",
                    accent: "#E31837",
                    neutral: "#000000",
                    "base-100": "#050505",
                    "base-200": "#0d0d0d",
                    "base-300": "#1a1a1a"
                }
            }
        ]
    }
}