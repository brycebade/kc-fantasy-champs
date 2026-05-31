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
        console.log("raw text:", text)
        const parser = new DOMParser()
        const xml = parser.parseFromString(text, "text/xml")
        console.log("xml contents:", xml)
        console.log("items found:", xml.querySelectorAll("item").length)
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
            row.className = "card bg-base-100 shadow-md border-base-300"

            row.innerHTML = `
                <div class="card-body p-4">
                    <div class="flex items-center gap-2 text-xs uppercase font-bold text-primary">
                        <span>NFL News</span>
                        <span>•</span>
                        <span>Fantasy Update</span>
                    </div>
                    <h3 class="card-title text-base md:text-lg leading-snug">${title}</h3>
                    <p class="text-sm text-base-content/70 line-clamp-3">${description}</p>
                    <div class="card-actions justify-end mt-2">
                        <a 
                            href="${link}" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            class="btn btn-sm btn-primary"
                        >
                            Read More
                        </a>
                    </div>
                </div>
            `

            fantasyNewsContainer.appendChild(row)
        })
    } catch (error) {
        console.error("Fantasy news fetch failed:", error)

        fantasyNewsContainer.innerHTML = `
            <div class="card bg-base-100 shadow-md border border-base-300">
                <div class="card-body">
                    <h3 class="font-bold">News unavailable</h3>
                    <p class="text-sm text-base-content/70">
                        Fantasy news could not be loaded right now. Try refreshing the page.
                    </p>
                </div>
            </div>
        `
    }
}