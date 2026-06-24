import { getAllCompletedMatchups } from "../api/matchupsApi.js"
import { getTeams } from "../api/teamsApi.js"
import { getStandings } from "../api/standingsApi.js"
import { getAllTeamHistory } from "../api/teamsHistoryApi.js"
import { getOwners } from "../api/ownersApi.js"

export const renderLeagueHistory = async () => {
    const container = document.getElementById("leagueHistoryContainer")
    if (!container) return
    
    const [matchups, teams, teamHistory, owners] = await Promise.all([
        getAllCompletedMatchups(), 
        getTeams(),
        getAllTeamHistory(),
        getOwners()
    ])

    const nameFor = (id) => {
        const team = teams.find((t) => t.id === id)
        return team?.current_name || team?.team_name || team?.name || id
    }
    const round1 = (n) => Math.round(n * 10) / 10

    const seasons = [...new Set(matchups.map((m) => m.season))].sort((a, b) => b -a)

    const historyFor = (teamId, season) => 
        teamHistory.find((h) =>
            h.team_id === teamId &&
            season >= h.start_year &&
            (h.end_year == null || season <= h.end_year)
        )

    const seasonNameFor = (teamId, season) => {
        const h = historyFor(teamId, season)
        if (h) return h.name
        const team = teams.find((t) => t.id === teamId)
        return team?.current_name || team?.team_name || team?.name || teamId
    }

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
                champion: champ ? seasonNameFor(champ.team_id, season) : "—",
                toilet: toilet ? seasonNameFor(toilet.team_id, season) : "—"
            }
        })
        .filter(Boolean)

    const card = (title, body) => `
        <div class="card bg-base-100 shadow-md border border-base-300 rounded-xl overflow-hidden mb-6">
             <div class="bg-neutral text-white px-4 py-2">
                <h2 class="font-bold uppercase tracking-wide text-sm">${title}</h2>
            </div>
            <div class="card-body p-4">${body}</div>
        </div>
    `

    let highest = null
    let lowest = null
    let blowout = null

    matchups.forEach((m) => {
        const performances = [
            { teamId: m.team_1_id, score: Number(m.team_1_score) },
            { teamId: m.team_2_id, score: Number(m.team_2_score) } 
        ]
        performances.forEach((p) => {
            if (!highest || p.score > highest.score) highest = { ...p, season: m.season, week: m.week}
            if (!lowest || p.score < lowest.score) lowest = { ...p, season: m.season, week: m.week }
        })

        const margin = Math.abs(Number(m.team_1_score) - Number(m.team_2_score))
        if (!blowout || margin > blowout.margin) {
            blowout = { margin: round1(margin), winnerId: m.winner_team_id, loserId: m.loser_team_id, season: m.season, week: m.week}
        }
    })   

    const ownerNameFor = (ownerId) => {
        const owner = owners.find((o) => o.id === ownerId)
        return owner ? owner.name : "Unknown Owner"
    }

    const teamFor = (id) => teams.find((tm) => tm.id === id)

    const tenures = {}
    seasons.forEach((season) => {
        (standingsBySeason[season] || []).forEach((s) => {
            const h = historyFor(s.team_id,  season)
            const ownerId = h ? h.owner_id : null
            const key = `${s.team_id}__${ownerId}`

            if (!tenures[key]) {
                tenures[key] = { teamId: s.team_id, ownerId, titles: 0, wins: 0, losses: 0, pointsFor: 0, lastYear: -Infinity, lastName: null }  
            }
            const t = tenures[key]
            t.wins += s.win || 0
            t.losses += s.loss || 0
            t.pointsFor += s.points_for || 0
            if (s.final_rank === 1) t.titles += 1
            if (h && season >= t.lastYear) {
                t.lastYear = season
                t.lastName = h.name
            }
        })
    })

    const tenureRows = Object.values(tenures)
        .map((t) => {
            const team = teamFor(t.teamId)
            const active = team ? team.current_owner_id === t.ownerId : false
            const teamName = active ? team.current_name : (t.lastName || team?.current_name || t.teamId)
            return { ...t, active, label: `${ownerNameFor(t.ownerId)} - ${teamName}`}
        })
        .sort((a, b) => {
            if (a.active !== b.active) return a.active ? -1 : 1
            return b.titles - a.titles || b.wins - a.wins || b.pointsFor - a.pointsFor
        })

    const hasFormer = tenureRows.some((t) => !t.active)
    const franchiseBody = tenureRows.length === 0
        ? `<p class="text-sm opacity-60">No Records Yet</p>`
        : tenureRows.map((t) => {
            const rowClass = t.active ? "" : "opacity-60 italic"
            const mark = t.active ? "" : " *"
            return `
                <div class="flex items-center justify-between gap-3 py-2 border-b border-base-300 last:border-0 ${rowClass}">
                    <span class="font-semibold truncate">${t.label}${mark}</span>
                    <span class="text-xs opacity-70 shrink-0">${t.titles} titles • ${t.wins}-${t.losses} • ${round1(t.pointsFor)} PF</span>
                </div>
            `
        }).join("") + (hasFormer ? `<p class="text-xs opacity-50 mt-3">* No longer the current owner</p>` : "")

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