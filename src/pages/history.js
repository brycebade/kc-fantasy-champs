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

    const LEAGUE_AVG = 0.5
    const CONFIDENCE = 50

    const owners_agg = {}

    seasons.forEach((season) => {
        const seasonStandings = standingsBySeason[season] || []
        seasonStandings.forEach((s) => {
            const h = historyFor(s.team_id, season)
            const ownerId = h ? h.owner_id : null
            if (ownerId == null) return

            if (!owners_agg[ownerId]) {
                owners_agg[ownerId] = { ownerId, titles: 0, wins: 0, losses: 0, pointsFor: 0, teams: {} }
            }
            const o = owners_agg[ownerId]
            o.wins += s.win || 0
            o.losses += s.loss || 0
            o.pointsFor += s.points_for || 0
            if (s.final_rank === 1) o.titles += 1

            if (h) {
                if (!o.teams[h.id]) {
                    o.teams[h.id] = {
                        historyId: h.id,
                        teamId: s.team_id,
                        name: h.name,
                        startYear: h.start_year,
                        wins: 0,
                        losses: 0
                    }
                }
                const era = o.teams[h.id]
                era.wins += s.win || 0
                era.losses += s.loss || 0
            }
        })
    })

    const adjustedWinPct = (wins, losses) => {
        const games = wins + losses
        return (wins + CONFIDENCE * LEAGUE_AVG) / (games + CONFIDENCE)
    }

    const ownerRows = Object.values(owners_agg)
        .map((o) => {
            const owner = owners.find((ow) => ow.id === o.ownerId)
            const ownerName = owner ? owner.name : "Unknown Owner"
            const isActiveOwner = owner ? owner.current === true : false

            const teamLines = Object.values(o.teams)
                .sort((a, b) => a.startYear - b.startYear)
                .map((era, i, arr) => {
                    const sep = i < arr.length - 1 ? " •" : ""
                    const teamRow = teams.find((t) => t.id === era.teamId)
                    const isCurrentName = 
                        teamRow &&
                        teamRow.current_owner_id === o.ownerId &&
                        teamRow.current_name === era.team_name
                    return `<span class="whitespace-nowrap">${era.name} (${era.wins}-${era.losses})${sep}</span>`
                })
                .join(" ")

            return {
                ...o,
                ownerName,
                isActiveOwner,
                teamLines,
                adjPct: adjustedWinPct(o.wins, o.losses)
            }
        })
        .sort((a, b) => {
            if (b.titles !== a.titles) return b.titles - a.titles
            return b.adjPct - a.adjPct
        })

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

    const renderOwnerRow = (o) => `
        <div class="flex items-start justify-between gap-3 py-3 border-b border-base-300 last:border-0">
            <div class="min-w-0">
                <p class="font-semibold">${o.ownerName}${!o.isActiveOwner ? ` <span class="text-xs font-normal opacity-50">(former)</span>` : ""}</p>
                <p class="text-xs opacity-70 mt-0.5">${o.teamLines}</p>
            </div>
            <span class="text-xs opacity-70 shrink-0 text-right">${o.titles} titles<br>${o.wins}-${o.losses}<br>${round1(o.pointsFor)} PF</span>
        </div>
    `

    const allOwnersBody = ownerRows.length === 0
        ? `<p class="text-sm opacity-60">No Records Yet</p>`
        : ownerRows.map(renderOwnerRow).join("")
    
    container.innerHTML = 
        card("Champions", championsBody) +
        card("All-Time Franchise Records", allOwnersBody)
}