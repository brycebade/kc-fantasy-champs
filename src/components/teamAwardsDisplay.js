import { getAllCompletedMatchups } from "../api/matchupsApi.js"
import { getTeams } from "../api/teamsApi.js"
import { computeSeasonAwards } from "../utils/seasonAwards.js"

export const renderTeamAwards = async (teamId) => {
    const container = document.getElementById("awardsContainer")
    if (!container) return
    
    const [matchups, teams] = await Promise.all([
        getAllCompletedMatchups(),
        getTeams()
    ])

    const nameFor = (id) => {
        const team = teams.find((t) => t.id === id)
        return team?.current_name || id || ""
    }

    const bySeason = {}
    matchups.forEach((game) => {
        if (!bySeason[game.season]) bySeason[game.season] = []
        bySeason[game.season].push(game)
    })

    const teamsAwards = []
    Object.keys(bySeason).forEach((season) => {
        computeSeasonAwards(Number(season), bySeason[season])
            .filter((award) => award.teamId === teamId)
            .forEach((award) => teamsAwards.push({...award, season }))
    })

    container.innerHTML = ""

    if (teamsAwards.length === 0) {
        container.innerHTML = `<p class="p-4 text-sm opacity-70">No Awards Yet</p>`
        return
    }

    teamsAwards
        .sort((a, b) => b.season - a.season)
        .forEach((award) => {
            const detail = award.week
                ? `${award.value} pts • Week ${award.week} vs ${nameFor(award.opponentId)}`
                : `${award.value} pts`  

        const row = document.createElement("div")
        row.className = "px-4 py-2"
        row.innerHTML = `
            <p class="text-xs uppercase tracking-wide text-primary font-bold">${award.season}</p>
            <div class="flex items-center justify-between">
                <span class="font-semibold">${award.title}</span>
                <span class="text-sm opacity-80">${detail}</span>
            </div>
        `
        container.appendChild(row)
    })
}