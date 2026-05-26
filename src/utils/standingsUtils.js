export const getHeadToHeadWinner = (teamAId, teamBId, matchups) => {
    const matchup = matchups.find((matchup) => {
        const team1 = String(matchup.team_1_id || "").trim()
        const team2 = String(matchup.team_2_id || "").trim()
        const teamA = String(teamAId || "").trim()
        const teamB = String(teamBId || "").trim()
        
        return (
            (team1 === teamA && team2 === teamB) ||
            (team1 === teamB && team2 === teamA)
        )
    })

    if (!matchup || !matchup.winner_team_id) return null
    
    return String(matchup.winner_team_id).trim()
}