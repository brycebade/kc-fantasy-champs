import { 
    getRegularSeasonMatchups, 
    getPlayoffMatchups,
    getCompletedRegularSeasonMatchups, 
    getCurrentSeason } from "../api/matchupsApi.js"

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

    container.innerHTML = `<p class="text-base-content/70">Loading Power Rankings...</p>`

    try {
        const season = await getCurrentSeason()

        const currentWeek = 14

        const teams = await getTeams()
        const matchups = await getCompletedRegularSeasonMatchups(season, currentWeek)

        console.log("Power Rankings Season:", season)
        console.log("Power Rankings Team:", teams)
        console.log("Power Rankings Matchups:", matchups)

        container.innerHTML = `
            <div class="mt-4 space-y-2 text-sm">
                <p>
                    <span class="font-semibold">Season</span>
                    ${season}
                </p>
                <p>
                    <span class="font-semibold">Current Week:</span>
                    ${currentWeek}
                </p>
                <p>
                    <span class="font-semibold">Teams Loaded:</span>
                    ${teams.length}
                </p>
                <p>
                    <span class="font-semibold">Completed Matchups Loaded:</span>
                    ${matchups.length}
                </p>
            </div>
        `   
    } catch (error) {
        console.error("Error rendering power rankings:", error)

        container.innerHTML = `
            <div class="card bg-base-100 shadow-md border border-base-300">
                <div class="card-body">
                    <p class="text-sm text-error">Power rankings could no be loaded</p>
                </div>
            </div>
        `
    }
}