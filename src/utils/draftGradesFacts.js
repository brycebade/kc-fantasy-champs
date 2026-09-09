import { getDraftResultsByYear } from "../api/draftResultsApi.js"
import { getTeams } from ".../api/teamsApi.js"

export const getDraftGradeFacts = async (season) => {
    const draftResults = await getDraftResultsByYear(season)
    const teams = await getTeams()

    const nameFor = (teamId) => {
        const team = teams.find((t) => t.id === teamId)
        return team?.current_name || teamId
    }

    const byTeam = {}
    draftResults.forEach((pick) => {
        if (!byTeam[pick.team_id]) byTeam[pick.team_id] = []
        byTeam[pick.team_id].push(pick)
    })

    const teamLines = Object.entries(byTeam).map(([teamId, picks]) => {
        const sortedPicks = picks.sort((a, b) => a.round - b.round)
        const pickList = sortedPicks
            .map((p) => `Rd ${p.round} (Pick ${p.overall} overall): ${p.player}, ${p.position}, ${p.nfl_team}`)
            .join("\n ")
        return `${nameFor(teamId)}:\n ${pickList}`
    })

    return teamLines.join("\n\n")
}

export const buildDraftGradesPrompt = (season, draftLines, adminNotes) => {
    const prompt = `Here are the ${season}fantasy football draft results for all 12 teams in our league, "KC Fantasy Champs." Grade each team's draft (A+ through F) based on positional value, upside, and roster balance. Write one punchy news-style headline covering the draft class as a whole, followed by a 3-4 paragraph article that grades each team, calls out the biggest steals and reaches, and highlights the most and least impressive overall draft classes. Write it with some personality - like a real sports outlet's draft guide column, not a dry recap.\n\nDraft results by team:\n\n${draftLines}${adminNotes ? `\n\nAdditional context from the commissioner:\n${adminNotes}` : ""}`

    return prompt
}