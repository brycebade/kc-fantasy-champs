import { getAllCompletedMatchups } from "../api/matchupsApi.js"
import { getTeams } from "../api/teamsApi.js"
import { getStandings } from "../api/standingsApi.js"
import { computeSeasonAwards } from "../utils/seasonAwards.js"

const AWARD_DEFINITIONS = [
    { title: "Highest Score", description: "Most points scored in a single regular-season game." },
    { title: "Stinker of the Year", description: "Fewest points scored in a single regular-season game." },
    { title: "Offensive Juggernaut", description: "Most total points scored across the regular season." },
    { title: "Biggest Blowout", description: "Largest margin of victory in a single." },
    { title: "Backed In", description: "Lowest-scoring win of the season." },
    { title: "Hard-Luck", description: "Highest-scoring loss of the season." },
    { title: "Nail-Biter", description: "Closest final margin in a decided game." },
    { title: "Unluckiest", description: "Most total points among teams that missed the playoffs. "}
]

export const renderAwards = async () => {
    const container = document.getElementById("awardsHubContainer")
    if (!container) return

    const [matchups, teams] = await Promise.all([getAllCompletedMatchups(), getTeams()])

    const nameFor = (id) => {
        const team = teams.find((t) => t.id === id)
        return team?.current_name || team?.team_name || team?.name || id
    }

    const bySeason = {}
    matchups.forEach((game) => {
        if (!bySeason[game.season]) bySeason[game.season] = []
        bySeason[game.season].push(game)
    })
    const seasons = Object.keys(bySeason).map(Number).sort((a, b) => b - a)

    const winnersByAward = {}
    seasons.forEach((season) => {
        computeSeasonAwards(season, bySeason[season]).forEach((award) => {
            if (!winnersByAward[award.title]) winnersByAward[award.title] = []
            winnersByAward[award.title].push({ ...award, season })
        })
    })

    const titleRows = []
    for (const season of seasons) {
        const standings = await getStandings(season)
        const champ = standings.find((s) => s.final_rank === 1)
        const toilet = standings.find((s) => s.final_rank === 12)
        if (champ || toilet) {
            titleRows.push({
                season,
                champion: champ ? nameFor(champ.team_id) : "—",
                toilet: toilet ? nameFor(toilet.team_id) : "—"
            })
        }
    }

    const detailFor = (award) =>
        award.week
            ? `${award.value} pts • Wk ${award.week} vs ${nameFor(award.opponentId)}`
            : `${award.value} pts`

    const championsHtml = `
        <div class="card bg-base-100 shadow-md border border-base-300 rounded-xl overflow-hidden mb-6">
            <div class="bg-neutral text-white px-4 py-2">
                <h2 class="font-bold uppercase tracking-wide text-sm">Champions</h2>
            </div>
            <div class="card-body p-4">
                ${titleRows.length === 0
                    ? `<p class="text-sm opacity-60">No Champions Recorded Yet</p>`
                    : titleRows.map((row) => `
                        <div class="flex items-center justify-between gap-3 py-2 border-b border-base-300 last:border-0">
                            <span class="font-bold text-primary w-14 shrink-0">${row.season}</span>
                            <div class="flex-1 text-sm">
                                <p><span class="opacity-60">Champion:</span> <span class="font-semibold">${row.champion}</span></p>
                                <p><span class="opacity-60">Toilet:</span> <span class="font-semibold">${row.toilet}</span></p>
                            </div>
                        </div>
                    `).join("")}
            </div>
        </div>
    `

    const awardsHtml = `
        <div class="card bg-base-100 shadow-md border border-base-300 rounded-xl overflow-hidden">
            <div class="bg-neutral text-white px-4 py-2">
                <h2 class="font-bold uppercase tracking-wide text-sm">Season Awards</h2>
            </div>
            <div class="card-body p-4 space-y-5">
                ${AWARD_DEFINITIONS.map((award) => {
                    const winners = winnersByAward[award.title] || []
                    return `
                        <div class="border-b border-base-300 last:border-0 pb-4 last:pb-0"
                            <h3 class="font-bold text-primary">${award.title}</h3>
                            <p class="text-xs opacity-70 mb-2">${award.description}</p>
                            ${winners.length === 0
                                ? `<p class="text-xs opacity-50">Not Awarded Yet</p>`
                                : winners.map((w) => `
                                    <div class="flex items-center justify-between gap-3 text-sm py-1>
                                        <span><span class="font-bold text-primary mr-2">${w.season}</span>${nameFor(w.teamId)}</span>
                                        <span class="opacity-70 text-xs shrink-0">${detailFor(w)}</span>
                                    </div>
                                `).join("")}
                        </div>
                    `
                }).join("")}
            </div>
        </div>
    `

    container.innerHTML = championsHtml + awardsHtml
}