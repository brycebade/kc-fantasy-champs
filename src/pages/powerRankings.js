import { getRegularSeasonMatchups, getPlayoffMatchups, getCurrentSeason } from "../api/matchupsAPI.js"
import { getStandings } from "../api/standingsApi.js"
import { getTeams } from "../api/teamsApi.js"

const getRankingsMode = (currentWeek) => {
    if (!currentWeek || currentWeek === 0) return "offseason"
    if (currentWeek <= 14) return "regular"
    if (currentWeek <= 17) return "playoffs"
    return "final"
}

export const renderPowerRankings = async () => {
    const container = document.getElementById("powerRankingsContainer")
    if (!container) return

    const season = await getCurrentSeason()
    const matchups = await getRegularSeasonMatchups(season)

    let currentWeek = 0

    if (matchups.length > 0) {
        const weeks = matchups.map(m => m.week)
        currentWeek = Math.max(...weeks)
    }

    const mode = getRankingsMode(currentWeek) 

    if (mode === "offseason") {
        await renderOffseasonRankings()
    } else if (mode === "regular") {
        await renderAlgorithmRankings(currentWeek, matchups)
    } else if (mode === "playoffs") {
        await renderPlayoffRankings()
    } else {
        await renderFinalRankings()
    }
}

export const renderOffseasonRankings = async (season) => {
    const container = document.getElementById("powerRankingsContainer")
    if (!container) return 

    const teams = await getTeams()
    const standings = await getStandings(season)

    const sorted = standings.sort((a, b) => a.final_rank - b.final_rank)

    sorted.forEach((standing) => {
        const team = teams.find(t => t.id === standing.team_id)
    })

}