const RSS_URL = "https://www.rotowire.com/rss/news.php?sport=NFL"

const PROXIES = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`
]

const fetchThroughProxies = async (url) => {
    for (const buildProxyUrl of PROXIES) {
        try {
            const response = await fetch(buildProxyUrl(url))
            if (response.ok) return await response.text()
        } catch (error) {
    }
    }
    throw new Error("All proxies failed")
}

export const renderFantasyNews = async () => {
    const fantasyNewsContainer = document.getElementById("fantasyNewsContainer")
    if (!fantasyNewsContainer) return

    fantasyNewsContainer.innerHTML = "<p>Loading fantasy news...</p>"

    try {
        const text = await fetchThroughProxies(RSS_URL)
        const xml = new DOMParser().parseFromString(text, "text/xml")
        const items = xml.querySelectorAll("item")

        fantasyNewsContainer.innerHTML = ""

        items.forEach((item, index) => {
            if (index >= 6) return

            const title = item.querySelector("title")?.textContent || "No title"
            const link =
                item.querySelector("link")?.textContent ||
                item.querySelector("guid")?.textContent ||
                "#"

            const row = document.createElement("div")
            row.className = "py-2 border-b border-base-300"
            row.innerHTML = `
                <a href="${link}" target="_blank" rel="noopener noreferrer"
                   class="text-sm font-semibold hover:text-primary">
                    ${title}
                </a>
            `
            fantasyNewsContainer.appendChild(row)
        })
    } catch (error) {
        console.error("Fantasy news fetch failed:", error)
        fantasyNewsContainer.innerHTML = `<p class="text-sm opacity-60 py-2">News Temporarily Unavailable</p>`
    }
}