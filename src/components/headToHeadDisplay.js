import { getAllCompletedMatchups } from "../api/matchupsApi.js"
import { getTeams } from "../api/teamsApi.js"
import { computeHeadToHead } from "../utils/headToHead.js"

export const renderHeadToHead = async (teamId) => {
    const container = document.getElementById("headToHeadContainer")
    if (!container) return
    
    const [matchups, teams] = await Promise.all([
        getAllCompletedMatchups(),
        getTeams()
    ])

    const records = computeHeadToHead(teamId, matchups)

    const nameFor = (id) => {
        const team = teams.find((t) => t.id === id)
        return team?.current_name || id || ""
    }

    const opponents = Object.keys(records)

    if (opponents.length === 0) {
        container.innerHTML = `<p class="p-4 text-sm opacity-70">No games played yet</p>`
        return
    }

    container.innerHTML = ""

    opponents   
        .sort((a, b) => nameFor(a).localeCompare(nameFor(b)))
        .forEach((opponentId) => {
            const r = records[opponentId]
            const record = `${r.wins} - ${r.losses}${r.ties ? "-" + r.ties : ""}`

            const row = document.createElement("div")
            row.className = "flex items-center justify-between px-4 py-2 text-sm"
            row.innerHTML = `
                <span class="font-semibold">${nameFor(opponentId)}</span>
                <span class="opacity-80">${record}</span>
            `
            container.appendChild(row)
        })
}