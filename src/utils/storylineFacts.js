import { getAllCompletedMatchups } from "../api/matchupsApi.js"
import { getStandings } from "../api/standingsApi.js"
import { getAllTeamHistory } from "../api/teamsHistoryApi.js"
import { getOwners } from "../api/ownersApi.js"

export const getStorylineFacts = async () => {
    const [matchups, teamHistory, owners] = await Promise.all([
        getAllCompletedMatchups(),
        getAllTeamHistory(),
        getOwners()
    ])

    const seasons = [...new Set(matchups.map((m) => m.season))].sort((a, b) => b - a)

    const historyFor = (teamId, season) =>
        teamHistory.find((h) =>
            h.team_id === teamId &&
            season >= h.start_year &&
            (h.end_year == null || season <= h.end_year)
        )

    const standingsBySeason = {}
    for (const season of seasons) {
        standingsBySeason[season] = await getStandings(season)
    }

    const owners_agg = {}

    seasons.forEach((season) => {
        const seasonStandings = standingsBySeason[season] || []
        seasonStandings.forEach((s) => {
            const h = historyFor(s.team_id, season)
            const ownerId = h ? h.owner_id : null
            if (ownerId == null) return

            if (!owners_agg[ownerId]) {
                owners_agg[ownerId] = { ownerId, titles: 0, runnerUps: 0, toiletFinishes: 0, wins: 0, losses: 0 }
            }
            const o = owners_agg[ownerId]
            o.wins += s.win || 0
            o.losses += s.loss || 0
            if (s.final_rank === 1) o.titles += 1
            if (s.final_rank === 2) o.runnerUps += 1

            const ranked = seasonStandings.filter((st) => st.final_rank != null)
            const lastRank = ranked.length ? Math.max(...ranked.map((st) => st.final_rank)) : null
            if (s.final_rank === lastRank) o.toiletFinishes += 1
        })
    })

    const rows = Object.values(owners_agg).map((o) => {
        const owner = owners.find((ow) => ow.id === o.ownerId)
        return { ...o, ownerName: owner ? owner.name : "Unknown Owner", isActive: owner ? owner.current === true : false }    
    })

    const reigningChamp = rows.find((o) => {
        const latestSeason = seasons[0]
        const standings = standingsBySeason[latestSeason] || []
        const champStanding = standings.find((s) => s.final_rank === 1)
        if (!champStanding) return false
        const h = historyFor(champStanding.team_id, latestSeason)
        return h && h.owner_id === o.ownerId
    })

    const nearMilestone = rows.filter((o) => o.wins >= 90 || o.losses >= 90)
    const bridesmaids = rows.filter((o) => o.titles === 0 && o.runnerUps >= 2)
    const worstRecord = [...rows].sort((a, b) => (a.wins - a.losses) - (b.wins - b.losses))[0]
    const mostToilets = [...rows].sort((a, b) => b.toiletFinishes - a.toiletFinishes)[0]

    return { rows, reigningChamp, nearMilestone, bridesmaids, worstRecord, mostToilets }
}

export const buildStoryLinesPrompt = (facts, adminNotes) => {
    const lines = []

    if (facts.reigningChamp) {
        lines.push(`Reigning Champion: ${facts.reigningChamp.ownerName} (${facts.reigningChamp.titles}) career titles, ${facts.reigningChamp.wins}-${facts.reigningChamp.losses} all-time`)
    }

    facts.nearMilestone.forEach((o) => {
        if (o.wins >= 90) lines.push(`${o.ownerName} has ${o.wins} career wins, closing in on 100`)
        if (o.losses >= 90) lines.push(`${o.ownerName} has ${o.losses} career losses, closing in on 100`)
    })

    facts.bridesmaids.forEach((o) => {
        lines.push(`${o.ownerName} has ${o.runnerUps} runner-up finishes but 0 titles`)
    })

    if (facts.worstRecord) {
        lines.push(`${facts.worstRecord.ownerName} has the worst all-time record at ${facts.worstRecord.wins}-${facts.worstRecord.losses}`)
    }

    if (facts.mostToilets && facts.mostToilets.toiletFinishes > 0) {
        lines.push(`${facts.mostToilets.ownerName} has finished last (Toilet Bowl) ${facts.mostToilets.toiletFinishes} times`)
    }

    const prompt = `Here are storyline facts for our 12-team fantasy football league heading into this season. Write a punchy news-style headline (one sentence) plus a 1-2 sentence blurb for each storyline below that's worth covering. Some facts may not be interesting enough for a story — use your judgment.\n\nComputed facts:\n${lines.join("\n")}${adminNotes ? `\n\nAdditional context from the commissioner:\n${adminNotes}` : ""}`

    return prompt
}