const darkThemes = ["nightGame", "playoffs", "championship"]

const isDarkTheme = () => {
    const theme = document.documentElement.getAttribute("data-theme")
    return darkThemes.includes(theme)
}

const themedLogo = (logoURL) => {
    return isDarkTheme() ? logoURL.replace("/500/", "/500-dark/") : logoURL
}

export const renderNFLScores = async () => {
    const container = document.getElementById("nflScoreContainer")
    if(!container) return
    
    const response = await fetch ("https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard")
    const data = await response.json()

    container.innerHTML = ""

    container.style.display = "flex"
    container.style.flexDirection = "row"
    container.style.overflowX = "auto"
    container.style.gap = "0.75rem"
    container.style.padding = "0.75rem 1rem"
    container.style.backgroundColor = "var(--color-base-100)"
    container.style.borderBottom = "1px solid var(--color-base-300)"

    data.events.forEach(event => {
        const competition = event.competitions[0]
        const home = competition.competitors.find(c => c.homeAway === "home")
        const away = competition.competitors.find(c => c.homeAway === "away")

        const gameDate = new Date(event.date)

        const displayDate = gameDate.toLocaleDateString("en-US", {
            month: "numeric",
            day: "numeric",
            timeZone: "America/Chicago"
        })

        const displayTime = gameDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            timeZone: "America/Chicago"
        })

        const isCompleted = competition.status.type.completed

        const card = document.createElement("div")
        card.className = "nfl-score-card"
        card.innerHTML = `
            <div class="flex flex-col">
                <div class="flex items-center gap-1">
                    <img src="${themedLogo(away.team.logo)}" style="width: 20px; height: 20px; object-fit: contain;">
                    <span class="text-xs font-bold">${away.team.abbreviation}</span>
                    ${isCompleted ? `<span class="text-xs font-bold">${away.score}</span>` : ""}
                </div>
                <div class="flex items-center gap-1">
                    <img src="${themedLogo(home.team.logo)}" style="width: 20px; height: 20px; object-fit: contain;">
                    <span class="text-xs font-bold">${home.team.abbreviation}</span>
                    ${isCompleted ? `<span class="text-xs font-bold">${home.score}</span>` : ""}
                </div>
                <span style="font-size: 0.65rem; opacity: 0.6; margin-top: 2px;">
                    ${isCompleted ? "FINAL"  : `${displayDate} ${displayTime}`}
                </span>
            </div>
        `
        container.appendChild(card)
    })
    
}