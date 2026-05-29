export const renderFantasyNews = async () => {
    const RSS_URL = "https://www.rotowire.com/rss/news.php?sport=NFL"
    const API_URL = `https://api.allorigins.win/get?url=${encodeURIComponent(RSS_URL)}`
    

    const response = await fetch(API_URL)
    const data = await response.json() 

    const fantasyNewsContainer = document.getElementById("fantasyNewsContainer")
    fantasyNewsContainer.innerHTML = ""

    if (!data.contents) {
        fantasyNewsContainer.innerHTML = "<p>News unavailable at this time.</p>"
        return
    }    

    const parser = new DOMParser()
    const xml = parser.parseFromString(data.contents, "text/xml")
    const items = xml.querySelectorAll("item")

    items.forEach((item) => {
        const title = item.querySelector("title")?.textContent
        const link = item.querySelector("guid")?.textContent
        const description = item.querySelector("description")?.textContent

        const row = document.createElement("div")

        row.innerHTML = `
            <h3>${title}</h3>
            <p>${description}</p>
            <a href="${link}" target="_blank">Read More</a>
        `
        fantasyNewsContainer.appendChild(row)
    })
}