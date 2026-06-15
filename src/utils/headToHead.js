export const computeHeadToHead = (teamId, matchups) => {
    const records = {}

    const ensure = (id) => {
        if (!records[id]) {
            records[id] = { 
                wins: 0, 
                losses: 0,
                ties: 0,
                pointsFor: 0,
                pointsAgainst: 0
            }
        }

        return records[id]
    }

    matchups.forEach((m) => {
        let opponentId, myScore, oppScore

        if (m.team_1_id === teamId) {
            opponentId = m.team_2_id
            myScore = m.team_1_score
            oppScore = m.team_2_score
        } else if (m.team_2_id === teamId) {
            opponentId = m.team_1_id
            myScore = m.team_2_score
            oppScore = m.team_1_score
        } else {
            return
        }

        const rec = ensure(opponentId)
        rec.pointsFor += Number(myScore)
        rec.pointsAgainst += Number(oppScore)

        if (m.is_tie) rec.ties += 1
        else if (m.winner_team_id === teamId) rec.wins += 1
        else rec.losses += 1
    })

    return records
}