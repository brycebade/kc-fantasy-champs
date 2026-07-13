import { getAllCompletedMatchups } from "../api/matchupsApi.js"
import { getTeams } from "../api/teamsApi.js"
import { getStandings } from "../api/standingsApi.js"
import { computeSeasonAwards } from "../utils/seasonAwards.js"
import { getAllTeamHistory } from "../api/teamsHistoryApi.js"

const AWARD_DEFINITIONS = [
  {
    title: "Highest Score",
    description: "Most points scored in a single regular-season game.",
  },
  {
    title: "Stinker of the Year",
    description: "Fewest points scored in a single regular-season game.",
  },
  {
    title: "Offensive Juggernaut",
    description: "Most total points scored across the regular season.",
  },
  {
    title: "Biggest Blowout",
    description: "Largest margin of victory in a single game.",
  },
  { title: "Backed In", description: "Lowest-scoring win of the season." },
  { title: "Hard-Luck", description: "Highest-scoring loss of the season." },
  {
    title: "Nail-Biter",
    description: "Closest final margin in a decided game.",
  },
  {
    title: "Unluckiest",
    description: "Most total points among teams that missed the playoffs. ",
  },
]

const [matchups, teams, teamHistory] = await Promise.all([
  getAllCompletedMatchups(),
  getTeams(),
  getAllTeamHistory(),
])

export const renderAwards = async () => {
  const container = document.getElementById("awardsHubContainer")
  if (!container) return

  const [matchups, teams] = await Promise.all([
    getAllCompletedMatchups(),
    getTeams(),
  ])

  const nameFor = (id) => {
    const team = teams.find((t) => t.id === id)
    return team?.current_name || team?.team_name || team?.name || id
  }

  const seasonNameFor = (teamId, season) => {
    const h = teamHistory.find(
      (h) =>
        h.team_id === teamId &&
        season >= h.start_year &&
        (h.end_year == null || season <= h.end_year),
    )
    if (h) return h.name
    return nameFor(season)
  }

  const bySeason = {}
  matchups.forEach((game) => {
    if (!bySeason[game.season]) bySeason[game.season] = []
    bySeason[game.season].push(game)
  })
  const seasons = Object.keys(bySeason)
    .map(Number)
    .sort((a, b) => b - a)

  /*
    const winnersByAward = {}
    seasons.forEach((season) => {
        computeSeasonAwards(season, bySeason[season]).forEach((award) => {
            if (!winnersByAward[award.title]) winnersByAward[award.title] = []
            winnersByAward[award.title].push({ ...award, season })
        })
    })
    */

  const titleRows = [];
  for (const season of seasons) {
    const standings = await getStandings(season);
    const ranked = standings.filter((s) => s.final_rank != null);
    if (ranked.length === 0) continue;
    const lastRank = Math.max(...ranked.map((s) => s.final_rank));
    const champ = standings.find((s) => s.final_rank === 1);
    const toilet = standings.find((s) => s.final_rank === lastRank);
    if (champ || toilet) {
      titleRows.push({
        season,
        champion: champ ? seasonNameFor(champ.team_id, season) : "—",
        toilet: toilet ? seasonNameFor(toilet.team_id, season) : "—",
      })
    }
  }

  /*
    const detailFor = (award) =>
        award.week
            ? `${award.value} pts • Wk ${award.week} vs ${nameFor(award.opponentId)}`
            : `${award.value} pts`
    */

    const championsListHtml = titleRows.length === 0
        ? `<p class="text-sm opacity-60">No Champions Recorded Yet</p>`
        : titleRows.map((row) => `
            <div class="flex items-center justify-between gap-3 py-2 border-b border-base-300 last:border-0">
                <span class="font-bold text-primary w-14 shrink-0">${row.season}</span>
                <span class="font-semibold text-sm flex-1">${row.champion}</span>
            </div>
        `).join("")

    const toiletListHTML = titleRows.length === 0
        ? `<p class="text-sm opacity-60">No Toilet Champions Recorded Yet</p>`
        : titleRows.map((row) => `
            <div class="flex items-center justify-between gap-3 py-2 border-b border-base-300 last:border-0">
                <span class="font-bold text-primary w-14 shrink-0">${row.season}</span>
                <span class="font-semibold text-sm flex-1">${row.toilet}</span>
            </div>
        `).join("")

    const trophiesHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-6">
            <div>
                <div class="rounded-xl overflow-hidden shadow-md mb-4">
                    <img src="./assets/championships/champion.jpg" alt="Champion Trophy" class="w-full h-auto block">
                </div>
                <div class="card bg-base-100 shadow-md border border-base-300 rounded-xl overflow-hidden">
                    <div class="bg-neutral text-white px-4 py-2">
                        <h2 class="font-bold uppercase tracking-wide text-sm">Champions</h2>
                    </div>
                    <div class="card-body p-4">${championsListHtml}</div>
                </div>
            </div>
            <div>
                <div class="rounded-xl overflow-hidden shadow-md mb-4">
                    <img src="./assets/championships/toiletChampion.jpg" alt="Toilet Bowl Trophy" class="w-full h-auto block">
                </div>
                <div class="card bg-base-100 shadow-md border border-base-300 rounded-xl overflow-hidden">
                    <div class="bg-neutral text-white px-4 py-2">
                        <h2 class="font-bold uppercase tracking-wide text-sm">Toilet Bowl</h2>
                    </div>
                    <div class="card-body p-4">${toiletListHTML}</div>
                </div>
            </div>
        </div>
    `

    const awardsHtml = `
        <div class="card bg-base-100 shadow-md border border-base-300 rounded-xl overflow-hidden">
            <div class="bg-neutral text-white px-4 py-2">
                <h2 class="font-bold uppercase tracking-wide text-sm">Season Awards - Coming Offseason 2027</h2>
            </div>
            <div class="card-body p-4 space-y-5">
                ${AWARD_DEFINITIONS.map(
                  (award) => `
                    <div class="border-b border-base-300 last:border-0 pb-4 last:pb-0">
                        <h3 class="font-bold text-primary">${award.title}</h3>
                        <p class="text-xs opacity-70 mb-2">${award.description}</p>
                            ${
                              "" /* REACTIVATE 2027 
                                winners.length === 0
                                ? `<p class="text-xs opacity-50">Not Awarded Yet</p>`
                                : winners.map((w) => `
                                    <div class="flex items-center justify-between gap-3 text-sm py-1">
                                        <span><span class="font-bold text-primary mr-2">${w.season}</span>${nameFor(w.teamId)}</span>
                                        <span class="opacity-70 text-xs shrink-0">${detailFor(w)}</span>
                                    </div>
                                `).join("")
                            */
                            }
                    </div>
                    `,
                ).join("")}
            </div>
        </div>
    `

  container.innerHTML = trophiesHTML + awardsHtml
}