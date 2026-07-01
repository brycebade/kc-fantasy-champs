const FUNCTION_URL = "https://gqpbcujbwtgqgiepdihc.supabase.co/functions/v1/fantasy-news"



export const renderFantasyNews = async () => {
    const container = document.getElementById("fantasyNewsContainer")
    if (!container) return

    try {
        const res = await fetch(FUNCTION_URL)
        const data = await res.json()
        const items = data.items || []

        if (items.length === 0) {
            container.innerHTML = `<p class="text-sm opacity-70">News Temporarily Unavailable</p>`
            return
        }

        container.innerHTML = items.slice(0, 6).map((item) => `
            <a href="${item.link}" target="_blank" rel="noopener"
                class="block px-4 py-2 hover:bg-base-200 border-b border-base-300 last:border-0">
                <span class="text-sm">${item.title}</span>
            </a>
        `).join("")
    } catch (error) {
        console.error("Error loading fantasy news:", error)
        container.innerHTML = `<p class="text-sm opacity-70">News Temporarily Unavailable</p>`
    }
}