import { getAllCompletedMatchups } from "../api/matchupsApi.js"
import { getOwners } from "../api/ownersApi.js"
import { getAllTeamHistory } from "../api/teamsHistoryApi.js"

export const renderHeadToHead = async (ownerId) => {
    const container = document.getElementById("headToHeadContainer")
    if (!container) return
    
    const [matchups, owners, teamHistory] = await Promise.all([
        getAllCompletedMatchups(),
        getOwners(),
        getAllTeamHistory()
    ])

    const ownerOf = (teamId, season) => {
        const h = teamHistory.find((h) => 
            h.team_id === teamId &&
            season >= h.start_year && 
            (h.end_year == null || season <= h.end_year)
        )
        return h ? h.owner_id : null
    }

    const nameOf = (teamId, season) => {
        const h = teamHistory.find((h) => 
            h.team_id === teamId &&
            season >= h.start_year &&
            (h.end_year == null || season <= h.end_year)
        )
        return h ? h.name : teamId
    }

    const ownerNameFor = (id) => {
        const o = owners.find((ow) => ow.id === id)
        return o ? o.name : "Unknown Owner"
    }

    const vsOwner = {}

    matchups.forEach((m) => {
        const season = m.season
        const owner1 = ownerOf(m.team_1_id, season)
        const owner2 = ownerOf(m.team_2_id, season)
        if (owner1 == null || owner2 == null) return
        if (owner1 !== ownerId && owner2 !== ownerId) return
        if (owner1 === owner2) return

        const usIsTeam1 = owner1 === ownerId
        const oppOwnerId = usIsTeam1 ? owner2 : owner1
        const oppTeamId = usIsTeam1 ? m.team_2_id : m.team_1_id
        const oppName = nameOf(oppTeamId, season)

        const usWon = m.winner_team_id === (usIsTeam1 ? m.team_1_id : m.team_2_id)
        const isTie = m.is_tie === true

        if (!vsOwner[oppOwnerId]) {
            vsOwner[oppOwnerId] = { ownerId: oppOwnerId, wins: 0, losses: 0, ties: 0, eras: {} }   
        }
        const rec = vsOwner[oppOwnerId]

        if (!rec.eras[oppName]) {
            rec.eras[oppName] = { name: oppName, wins: 0, losses: 0, ties: 0, lastSeason: -Infinity }
        }

        const era = rec.eras[oppName]
        if (season > era.lastSeason) era.lastSeason = season

        if (isTie) {
            rec.ties++
            era.ties++
        } else if (usWon) {
            rec.wins++ 
            era.wins++
        } else {
            rec.losses++
            era.losses++
        }
    })

    const opponents = Object.values(vsOwner)

    if (opponents.length === 0) {
        container.innerHTML = `<p class="p-4 text-sm opacity-70">No game played yet</p>`
        return
    }

    const fmtRecord = (w, l, t) => t > 0 ? `${w}-${l}-${t}` : `${w}-${l}`

    opponents.sort((a, b) =>
        (b.wins + b.losses + b.ties) - (a.wins + a.losses + a.ties)    
    )

    container.innerHTML = opponents.map((opp) => {
        const sortedEras = Object.values(opp.eras).sort((a, b) => b.lastSeason - a.lastSeason)
        const headerName = sortedEras[0]?.name || ownerNameFor(opp.ownerId)

        const eraLine = sortedEras.length <= 1
            ? ""
            : sortedEras
                .map((era, i, arr) => {
                    const sep = i < arr.length - 1 ? " •" : ""
                    return `<span class="whitespace-nowrap">${era.name} (${fmtRecord(era.wins, era.losses, era.ties)})${sep}</span>`   
                })
                .join(" ")

        return `
            <div class="flex items-start justify-between gap-3 px-4 py-3 border-b border-base-300 last:border-0">
                <div class="min-w-0">
                    <p class="font-semibold">${headerName}</p>
                    <p class="text-xs opacity-60">${ownerNameFor(opp.ownerId)}</p>
                    <p class="text-xs opacity-70 mt-1">${eraLine}</p>
                </div>
                <span class="text-sm font-medium opacity-80 shrink-0">${fmtRecord(opp.wins, opp.losses, opp.ties)}</span>
            </div>
        `
    }).join("")
}