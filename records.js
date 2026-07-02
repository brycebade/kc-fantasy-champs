import { renderNavbar } from "./src/components/navbar.js"
import { getAllCompletedMatchups } from "./src/api/matchupsApi.js"
import { getTeams } from "./src/api/teamsApi.js"
import { getAllTeamHistory } from "./src/api/teamsHistoryApi.js"

const round1 = (n) => Math.round(n * 10) / 10

const init = async () => {
    await renderNavbar()
    await renderSingleGameRecords()
}

const renderSingleGameRecords = async () => {
    const container = document.getElementById("recordsContainer")
    if (!container) return

    const [matchups, teams, teamHistory] = await Promise.all([
        getAllCompletedMatchups(),
        getTeams(),
        getAllTeamHistory()
    ])

    const seasonNameFor = (teamId, season) => {
        const h = teamHistory.find((h) => 
            h.team_id === teamId &&
            season >= h.start_year &&
            (h.end_year == null || season <= h.end_year)
        )
        if (h) return h.name
        const team = teams.find((t) => t.id === teamId)
        return team?.current_name || teamId
    }

    const allPerformances = []
    const allBlowouts = []

    matchups.forEach((m) => {
        const s1 = Number(m.team_1_score)
        const s2 = Number(m.team_2_score)
        allPerformances.push({ teamId: m.team_1_id, score: s1, season: m.season, week: m.week })
        allPerformances.push({ teamId: m.team_2_id, score: s2, season: m.season, week: m.week })
        allBlowouts.push({
            margin: round1(Math.abs(s1 - s2)),
            winnerId: m.winner_team_id,
            loserId: m.loser_team_id,
            season: m.season,
            week: m.week
        })
    })

    const TOP_N = 5
    const topHighest = [...allPerformances].sort((a, b) => b.score - a.score).slice(0, TOP_N)
    const topLowest = [...allPerformances].sort((a, b) => a.score - b.score).slice(0, TOP_N)
    const topBlowouts = [...allBlowouts].sort((a, b) => b.margin - a.margin).slice(0, TOP_N)

    const rankedList = (items, renderItem) => 
        items.map((item, i) => `
            <div class="flex items-center justify-between gap-3 py-2 border-b border-base-300 last:border-0">
                <span class="text-sm"><span class="font-bold text-primary mr-2">${i + 1}</span>${renderItem(item)}</span>
            </div>
    `).join("")

    const card = (title, body) => `
        <div class="card bg-base-100 shadow-md border border-base-300 rounded-xl overflow-hidden mb-6">
            <div class="bg-neutral text-white px-4 py-2">
                <h2 class="font-bold uppercase tracking-wide text-sm">${title}</h2>
            </div>
            <div class="card-body p-4">${body}</div>
        </div>
    `

    container.innerHTML =
        card("Highest Scores", rankedList(topHighest, (p) => `${round1(p.score)} — ${seasonNameFor(p.teamId, p.season)} (${p.season} Wk ${p.week})`)) +
        card("Lowest Scores", rankedList(topLowest, (p) => `${round1(p.score)} — ${seasonNameFor(p.teamId, p.season)} (${p.season} WK ${p.week})`)) +
        card("Biggest Blowouts", rankedList(topBlowouts, (b) => `${b.margin} — ${seasonNameFor(b.winnerId, b.season)} over ${seasonNameFor(b.loserId, b.season)} (${b.season} Wk ${b.week})`))
}

init()