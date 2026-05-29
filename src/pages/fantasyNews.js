export const renderFantasyNews = async () => {
    const fantasyNewsContainer = document.getElementById("fantasyNewsContainer")

    if (!fantasyNewsContainer) return

    fantasyNewsContainer.innerHTML = "<p>Loading fantasy news...</p>"

    const RSS_URL = "https://www.rotowire.com/rss/news.php?sport=NFL"
    const API_URL = `https://api.allorigins.win/get?url=${encodeURIComponent(RSS_URL)}`

    try {
        const response = await fetch(API_URL)

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`)
        }

        const data = await response.json()

        if (!data.contents) {
            fantasyNewsContainer.innerHTML = "<p>News unavailable at this time.</p>"
            return
        }

        const parser = new DOMParser()
        const xml = parser.parseFromString(data.contents, "text/xml")
        const items = xml.querySelectorAll("item")

        fantasyNewsContainer.innerHTML = ""

        items.forEach((item) => {
            const title = item.querySelector("title")?.textContent || "No title"
            const link =
                item.querySelector("link")?.textContent ||
                item.querySelector("guid")?.textContent ||
                "#"
            const description = item.querySelector("description")?.textContent || ""

            const row = document.createElement("div")

            row.innerHTML = `
                <h3>${title}</h3>
                <p>${description}</p>
                <a href="${link}" target="_blank" rel="noopener noreferer">Read More</a>
            `

            fantasyNewsContainer.appendChild(row)
        })
    } catch (error) {
        console.error("Fantasy news fetch failed:", error)

        fantasyNewsContainer.innerHTML = `
        <p>Fantasy news unavailable right now</p>
    `
    }
}