import { getStandings } from "../api/standingsApi.js"
import { getAllTeamHistory } from "../api/teamsHistoryApi.js"
import { getOwners } from "../api/ownersApi.js"

export const getSeasonStoryFacts = async (season) => {
    const [standings, teamHistory, owners] = await Promise.all([
        getStandings(season),
        getAllTeamHistory(),
        getOwners()
    ])

    const historyFor = (teamId) =>
        teamHistory.find((h) => 
            h.team_id === teamId &&
            season >= h.start_year &&
            (h.end_year == null || season <= h.end_year)
        )

    const ownerNameFor = (teamId) => {
        const h = historyFor(teamId)
        if (!h) return "Unknown Owner"
        const owner = owners.find((o) => o.id === h.owner_id)
        return owner ? owner.name : "Unknown Owner"
    }

    const teamNameFor = (teamId) => {
        const h = historyFor(teamId)
        return h ? h.name : "Unknown Team"
    }

    const ranked = standings.filter((s) => s.final_rank != null)
    const lastRank = ranked.length ? Math.max(...ranked.map((s) => s.final_rank)) : null

    const champStanding = standings.find((s) => s.final_rank === 1)
    const toiletStanding = standings.find((s) => s.final_rank === lastRank)

    const newOwnersThisSeason = teamHistory.filter((h) => h.start_year === season)
    const departedOwnersThisSeason = teamHistory.filter((h) => h.end_year === season)

    const standingsSummary = ranked
        .sort((a, b) => a.final_rank - b.final_rank)
        .map((s) => `${s.final_rank}, ${teamNameFor(s.team_id)} (${ownerNameFor(s.team_id)}) — ${s.win}-${s.loss}`)

    return {
        season,
        champion: champStanding ? { team: teamNameFor(champStanding.team_id), owner: ownerNameFor(champStanding.team_id), record: `${champStanding.win}-${champStanding.loss}` } : null,
        toilet: toiletStanding ? { team: teamNameFor(toiletStanding.team_id), owner: ownerNameFor(toiletStanding.team_id), record: `${toiletStanding.win}-${toiletStanding.loss}` } : null,
        newOwners: newOwnersThisSeason.map((h) => ownerNameFor(h.team_id)),
        departedOwners: departedOwnersThisSeason.map((h) => ownerNameFor(h.team_id)),
        standingsSummary
    }
}

export const buildSeasonStoryPrompt = (facts, adminNotes) => {
    const lines = []

    if (facts.champion) {
        lines.push(`Champion: ${facts.champion.team} (owner: ${facts.champion.owner}), finished ${facts.champion.record}`)
    }

    if (facts.toilet) {
        lines.push(`Last place (Toilet Bowl): ${facts.toilet.team} (owner: ${facts.toilet.owner}), finished ${facts.toilet.record}`)
    }

    if (facts.newOwners.length > 0) {
        lines.push(`New owner(s) joining the league this season: ${facts.newOwners.join(", ")}`)
    }

    if (facts.departedOwners.length > 0) {
        lines.push(`Owner(s) who left the league after this season: ${facts.departedOwners.join(", ")}`)
    }

    lines.push(`Full final standings:\n${facts.standingsSummary.join("\n")}`)

    const prompt = `Write a short chapter (2-3 paragrahs) covering the ${facts.season} season of our fantasy football league, "KC Fantasy Champs". Write it like an ESPN 30-for-30 documentary recap - treat the league as a real, established fotball league with genuine drama, rivalries, and stakes. Do not mention that this is a fantasy football league between friends; write about the teams and standings as if they are real competitive franchises. Give it a short, punchy chapter title.\n\nFacts for this season:\n${lines.join("\n")}${adminNotes ? `\n\nAdditional context from the commissioner:\n${adminNotes}` : ""}`

    return prompt
}