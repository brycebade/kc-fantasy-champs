const CHIEFS_TEAM_ID = 12

export const getChiefsSchedule = async (season, seasonType) => {
    let url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${CHIEFS_TEAM_ID}/schedule`

    const params = []
        if (season) params.push(`season=${season}`)
        if (seasonType) params.push(`seasontype=${seasonType}`)
        if (params.length > 0) url += `?${params.join("&")}`

        const response = await fetch(url)
        const data = await response.json()

        return data.events || []
}

const centralDay = (date) => 
    new Date(date).toLocaleDateString("en-us", { timeZone: "America/Chicago" })

const isSameDay = (a, b) => centralDay(a) === centralDay(b)

const isPrimetime = (isoDate) => {
    const hour = new Date(isoDate).toLocaleString("en-US", {
        timeZone: "America/Chicago",
        hour: "numeric",
        hour12: false
    })
    return Number(hour) >= 18
}

const getSeasonYear = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return month <= 1 ? year - 1 : year
}

export const getChiefsThemeFacts = async (referenceDate = new Date()) => {
    const season = getSeasonYear(referenceDate)

    const [regularGames, postseasonGames] = await Promise.all([
        getChiefsSchedule(season, 2),
        getChiefsSchedule(season, 3)
    ])

    const titleGameToday = postseasonGames.some((game) => {
        const label = game.week?.text || ""
        const isTitle = label === "Conference Championship" || label === "Super Bowl"
        return isTitle && isSameDay(game.date, referenceDate)
    })

    const aliveInPlayoffs = postseasonGames.some((game) => {
        const gameTime = new Date(game.date).getTime()
        return isSameDay(game.date, referenceDate) || gameTime > referenceDate.getTime()
    })

    const primetimeToday = regularGames.some((game) => 
        isSameDay(game.date, referenceDate) && isPrimetime(game.date)
)

    return { titleGameToday, aliveInPlayoffs, primetimeToday }
}