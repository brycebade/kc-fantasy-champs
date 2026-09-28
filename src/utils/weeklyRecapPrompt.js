const WINDOW_ORDER = ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday Early", "Sunday Late", "Sunday Night", "Monday"]

const formatStarters = (starters) => {
    const sorted = [...starters].sort((a, b) => 
        WINDOW_ORDER.indexOf(a.gameWindow) - WINDOW_ORDER.indexOf(b.gameWindow)
    )
    return sorted
        .map((s) => ` - [${s.gameWindow}] ${s.name} (${s.position}): ${s.points} pts — ${s.line}`)
        .join("\n")
}

export const buildWeeklyRecapPrompt = (season, week, matchupFacts, notes) => {
    const matchupText = matchupFacts.map((m, i) => {
        const result = m.isTie
            ? "Ended in a tie"
            : `Winner: ${m.winner}`

        return `Game ${i + 1}: ${m.team1Name} ${m.team1Score} vs ${m.team2Name} ${m.team2Score} (${result})
        
    ${m.team1Name} starters:
    ${formatStarters(m.team1Starters)}

    ${m.team2Name} starters:
    ${formatStarters(m.team2Starters)}`
        }).join("\n\n")

        return `You are a sports columnist writing the ${season} Week ${week} recap for the KC Fantasy Champs, a 12-team fantasy football league. Write it like a newspaper article: a catchy headline, then roughly 500-700 words.
    
    TONE: Entertaining and a little ruthless. Roast teams that got embarrassed, celebrate the big performances, and keep it friendly since these are friends.

    STRUCTURE: Cover each matchup, but spend most the time on the closest and most lopesided games. Used the game windows (Thursday, Sunday Early, Sunday Late, Sunday Night, Monday) to tell the story of how each game unfolded. For example, a team jumping out to a lead Thursday, getting overtaken Sunday, then winning or losing it on Monday night.

    RULES: 
    - Only use the stats and names listed below. Do not invent players, numbers, or events.
    - The final score listed each game is official. Player points are only for context.
    - Return the headline on its own first line, then the article body.

    ${notes ? `EXTRA CONTEXT FROM THE COMMISSIONER:\n${notes}\n\n` : ""}MATCHUP DATA:

    ${matchupText}`
}