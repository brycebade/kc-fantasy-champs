import { getAllCompletedMatchups } from "../api/matchupsApi.js"
import { getTeams } from "../api/teamsApi.js"
import { getStandings } from "../api/standingsApi.js"
import { computeSeasonAwards } from "../utils/seasonAwards.js"
import { getAllTeamHistory } from "../api/teamsHistoryApi.js"

export const renderTeamAwards = async (teamId) => {
    const container = document.getElementById("awardsContainer")
    if (!container) return
    
    const [matchups, teams, teamHistory] = await Promise.all([
        getAllCompletedMatchups(),
        getTeams(),
        getAllTeamHistory()
    ])

    const nameFor = (id) => {
        const team = teams.find((t) => t.id === id)
        return team?.current_name || team?.team_name || team?.name || id || ""
    }

    const seasonNameFor = (id, season) => {
        const h = teamHistory.find((h) => 
            h.team_id === id &&
            season >= h.start_year && (h.end_year == null || season <= h.end_year)
        )
        if (h) return h.name
        return nameFor(id)
    }

    const bySeason = {}
    matchups.forEach((game) => {
        if (!bySeason[game.season]) bySeason[game.season] = []
        bySeason[game.season].push(game)
    })

    const seasons = Object.keys(bySeason).map(Number)

    const titleAwards = []
    for (const season of seasons) {
        const standings = await getStandings(season)
        const ranked = standings.filter((s) => s.final_rank != null)
        if (ranked.length === 0) continue
        const lastRank = Math.max(...ranked.map((s) => s.final_rank))
        const row = standings.find((s) => s.team_id === teamId)
        if (!row || row.final_rank == null) continue
        if (row.final_rank === 1) titleAwards.push({ title: "Champion", season, seasonName: seasonNameFor(teamId, season) })
        else if (row.final_rank === lastRank) titleAwards.push({ title: "Toilet Champion", season, seasonName: seasonNameFor(teamId, season) }) 
    }

    const statAwards = []
    seasons.forEach((season) => {
        computeSeasonAwards(season, bySeason[season])
            .filter((award) => award.teamId === teamId)
            .forEach((award) => statAwards.push({ ...award, season }))
    })

    container.innerHTML = ""

    if (titleAwards.length === 0 && statAwards.length === 0) {
        container.innerHTML = `<p class="p-4 text-sm opacity-70">No Awards Yet</p>`
        return
    }

    titleAwards
        .sort((a, b) => b.season - a.season)
        .forEach((award) => {
            const color = award.title === "Champion" ? "text-secondary" : "text-error"
            const row = document.createElement("div")
            row.className = "px-4 py-2"
            row.innerHTML = `
                <p class="text-xs uppercase tracking-wide text-primary font-bold">${award.season}</p>
                <span class="font-bold ${color}">${award.title}</span>
                <span class="text-xs opacity-60 ml-2">${award.seasonName}</span>
            `
            container.appendChild(row)
        })

   

    statAwards
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