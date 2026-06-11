export const renderFantasyNews = async () => {
    const fantasyNewsContainer = document.getElementById("fantasyNewsContainer")

    if (!fantasyNewsContainer) return

    fantasyNewsContainer.innerHTML = "<p>Loading fantasy news...</p>"

    const RSS_URL = "https://www.rotowire.com/rss/news.php?sport=NFL"
    const API_URL = `https://corsproxy.io/?${encodeURIComponent(RSS_URL)}`

    try {
        const response = await fetch(API_URL)

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`)
        }

        const text = await response.text()
        const parser = new DOMParser()
        const xml = parser.parseFromString(text, "text/xml")
        const items = xml.querySelectorAll("item")

        fantasyNewsContainer.innerHTML = ""

        items.forEach((item, index) => {
            if (index >= 6) return

            const title = item.querySelector("title")?.textContent || "No title"
            const link =
                item.querySelector("link")?.textContent ||
                item.querySelector("guid")?.textContent ||
                "#"
            const description = item.querySelector("description")?.textContent || ""

            const row = document.createElement("div")
            row.className = "py-2 border-b border-base-300"
            row.innerHTML = `
                <a 
                    href="${link}" target="_blank" rel="noopener noreferrer"
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