import { getAllCompletedMatchups } from "../api/matchupsApi.js"
import { getTeams } from "../api/teamsApi.js"
import { getStandings } from "../api/standingsApi.js"

export const renderLeagueHistory = async () => {
    const container = document.getElementById("leagueHistoryContainer")
    if (!container) return
    
    const [matchups, teams] = await Promise.all([getAllCompletedMatchups(), getTeams()])

    const nameFor = (id) => {
        const team = teams.find((t) => t.id === id)
        return team?.current_name || team?.team_name || team?.name || id
    }
    const round1 = (n) => Math.round(n * 10) / 10

    const seasons = [...new Set(matchups.map((m) => m.season))].sort((a, b) => b -a)

    const standingsBySeason = {}
    for (const season of seasons) {
        standingsBySeason[season] = await getStandings(season)
    }

    const championRows = seasons
        .map((season) => {
            const standings = standingsBySeason[season] || []
            const ranked = standings.filter((s) => s.final_rank != null)
            if (ranked.length === 0) return null
            const lastRank = Math.max(...ranked.map((s) => s.final_rank))
            const champ = standings.find((s) => s.final_rank === 1)
            const toilet = standings.find((s) => s.final_rank === lastRank)
            if (!champ && !toilet) return null
            return {
                season,
                champion: champ ? nameFor(champ.team_id) : "—",
                toilet: toilet ? nameFor(toilet.team_id) : "—"
            }
        })
        .filter(Boolean)

    const franchise = {}
    seasons.forEach((season) => {
        (standingsBySeason[season] || []).forEach((s) => {
            if (!franchise[s.team_id]) franchise[s.team_id] = { titles: 0, wins: 0, losses: 0, pointsFor: 0 }
            const f = franchise[s.team_id]
            f.wins += s.win || 0
            f.losses += s.loss || 0
            f.pointsFor += s.points_for || 0
            if (s.final_rank === 1) f.titles += 1
        })
    })

    const isActive = (id) => {
        const team = teams.find((t) => t.id === id)
        return team ? team.active !== false : true
    }

    const franchiseRows = Object.keys(franchise)
        .map((teamId) => ({ 
            teamId, 
            active: isActive(teamId), 
            ...franchise[teamId] 
        }))
        .sort((a, b) => {
            if (a.active !== b.active) return a.active ? -1 : 1
            return b.titles - a.titles || b.wins - a.wins || b.pointsFor - a.pointsFor
        })

    let highest = null
    let lowest = null
    let blowout = null

    matchups.forEach((m) => {
        const performances = [
            { teamId: m.team_1_id, score: Number(m.team_1_score) },
            { teamId: m.team_2_id, score: Number(m.team_2_score) }
        ]
        performances.forEach((p) => {
            if (!highest || p.score > highest.score) highest = { ...p, season: m.season, week: m.week }
            if (!lowest || p.score < lowest.score) lowest = { ...p, season: m.season, week: m.week }
        })

        const margin = Math.abs(Number(m.team_1_score) - Number(m.team_2_score))
        if (!blowout || margin > blowout.margin) {
            blowout = { margin: round1(margin), winnerId: m.winner_team_id, loserId: m.loser_team_id, season: m.season, week: m.week }
        }
    })

    const card = (title, body) => `
        <div class="card bg-base-100 shadow-md border border-base-300 rounded-xl overflow-hidden mb-6">
            <div class="bg-neutral text-white px-4 py-2">
                <h2 class="font-bold uppercase tracking-wide text-sm">${title}</h2>
            </div>
            <div class="card-body p-4">${body}</div>
        </div>
    `

    const championsBody = championRows.length === 0
        ? `<p class="text-sm opacity-60">No Champions Recorded Yet</p>`
        : championRows.map((row) => `
            <div class="flex items-center justify-between gap-3 py-2 border-b border-base-300 last:border-0">
                <span class="font-bold text-primary w-14 shrink-0">${row.season}</span>   
                <div class="flex-1 text-sm">
                    <p><span class="opacity-60">Champion:</span> <span class="font-semibold">${row.champion}</span></p>
                    <p><span class="opacity-60">Toilet:</span> <span class="font-semibold">${row.toilet}</span></p>
                </div>
            </div>
        `).join("")

    const hasFormer = franchiseRows.some((f) => !f.active)
    const franchiseBody = franchiseRows.length === 0
        ? `<p class="text-sm opacity-60">No Records Yet</p>`
        : franchiseRows.map((f) => {
            const rowClass = f.active ? "" : "opacity-60 italic"
            const mark = f.active ? "" : " *"
            return `
                <div class="flex items-center justify-between gap-3 py-2 border-b border-base-300 last:border-0">
                    <span class="font-semibold truncate">${nameFor(f.teamId)}${mark}</span>
                    <span class="text-xs opacity-70 shrink-0">${f.titles} titles • ${f.wins}-${f.losses} • ${round1(f.pointsFor)} PF</span>
                </div>
            `
        }).join("") + (hasFormer ? `<p class="text-xs opacity-50 mt-3">* No longer in the league</p>` : "")

    const recordRow = (label, value) => `
        <div class="flex items-center justify-between gap-3 py-2 border-b border-base-300 last:border-0">
            <span class="font-semibold">${label}</span>
            <span class="text-sm opacity-80 text-right">${value}</span>
        </div>
    `

    const singleGameBody = matchups.length === 0
        ? `<p class="text-sm opacity-60">No Games Recorded Yet</p>`
        : recordRow("Highest Score", highest ? `${round1(highest.score)} — ${nameFor(highest.teamId)} (${highest.season} Wk ${highest.week})` : "—")
            + recordRow("Lowest Score", lowest ? `${round1(lowest.score)} — ${nameFor(lowest.teamId)} (${lowest.season} Wk ${lowest.week})` : "—")
            + recordRow("Biggest Blowout", blowout ? `${blowout.margin} — ${nameFor(blowout.winnerId)} over ${nameFor(blowout.loserId)} (${blowout.season} Wk ${blowout.week})` : "—")

    container.innerHTML =
        card("Champions", championsBody) + 
        card("All-Time Franchise Records", franchiseBody) +
        card("All-Time Single-Game Records", singleGameBody)
}