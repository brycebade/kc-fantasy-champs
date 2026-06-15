const AWARDS_START_SEASON = 2026

const findHighest = (items, getValue) =>
    items.reduce((best, item) => (getValue(item) > getValue(best) ? item : best))

const findLowest = (items, getValue) => 
    items.reduce((best, item) => (getValue(item) < getValue(best) ? item : best))

export const computeSeasonAwards = (season, matchups) => {
    if (season < AWARDS_START_SEASON) return []

    const games = matchups.filter(
        (game) => game.matchup_type === "regular" && game.team_1_score != null && game.team_2_score != null
    )
    if (games.length === 0) return []

    const performances = []
    games.forEach((game) => {
        performances.push({ 
            teamId: game.team_1_id, 
            score: Number(game.team_1_score),
            opponentId: game.team_2_id,
            week: game.week,
            won: game.winner_team_id === game.team_1_id,
            tie: game.is_tie
            })
        performances.push({
            teamId: game.team_2_id,
            score: Number(game.team_2_score),
            opponentId: game.team_2_id,
            week: game.week,
            won: game.winner_team_id === game.team_2_id,
            tie: game.is_tie
        })
    })

    const seasonTotals = {}
    performances.forEach((performance) => {
        seasonTotals[performance.teamId] = (seasonTotals[performance.teamId] || 0) + performance.score
    })
    const topScorerId = Object.keys(seasonTotals).reduce(
        (leaderId, challengerId) => (seasonTotals[leaderId] > seasonTotals[challengerId] ? leaderId : challengerId)    
    )

    const highestScore = findHighest(performances, (performance) => performance.score)
    const lowestScore = findLowest(performances, (performance) => performance.score)
    const winningPerformances = performances.filter((performance) => performance.won)
    const losingPerformances = performances.filter((performance) => !performance.won && !performance.tie)
    const biggestBlowout = findHighest(games, (game) => Math.abs(game.team_1_score - game.team_2_score))
    const decidedGames = games.filter((game) => !game.is_tie)

    const awards = [
        {
            title: "Highest Score", 
            teamId: highestScore.teamId,
            value: highestScore.score,
            week: highestScore.week,
            opponentId: highestScore.opponentId
        },
        {
            title: "Stinker of the Year",
            teamId: lowestScore.teamId,
            value: lowestScore.score,
            week: lowestScore.week,
            opponentId: lowestScore.opponentId
        },
        {
            title: "Offensive Juggernaut",
            teamId: topScorerId,
            value: Math.round(seasonTotals[topScorerId] * 10) / 10
        },
        {
            title: "Biggest Blowout",
            teamId: biggestBlowout.winner_team_id,
            value: Math.abs(biggestBlowout.team_1_score - biggestBlowout.team_2_score),
            week: biggestBlowout.week,
            opponentId: biggestBlowout.loser_team_id
        }
    ]

    if (winningPerformances.length) {
        const lowestScoringWin = findLowest(winningPerformances, (performance) => performance.score)
        awards.push({
            title: "Backed In",
            teamId: lowestScoringWin.teamId,
            value: lowestScoringWin.score,
            week: lowestScoringWin.week,
            opponentId: lowestScoringWin.opponentId
        })
    }
    if (losingPerformances.length) {
        const highestScoringLoss = findHighest(losingPerformances, (performance) => performance.score)
        awards.push({
            title: "Hard Luck",
            teamId: highestScoringLoss.teamId,
            value: highestScoringLoss.score,
            week: highestScoringLoss.week,
            opponentId: highestScoringLoss.opponentId
        })
    }
    if (decidedGames.length) {
        const closestGame = findLowest(decidedGames, (game) => Math.abs(game.team_1_score - game.team_2_score))
        awards.push({
            title: "Nail-Biter",
            teamId: closestGame.winner_team_id,
            value: Math.abs(closestGame.team_1_score - closestGame.team_2_score),
            week: closestGame.week,
            opponentId: closestGame.loser_team_id
        })
    }

    const toiletBracketTeams = new Set()
    matchups    
        .filter((game) => game.matchup_type === "playoff" && game.bracket_type === "toilet")
        .forEach((game) => {
            toiletBracketTeams.add(game.team_1_id)
            toiletBracketTeams.add(game.team_2_id)
        })

    const missedPlayoffTeams = Object.keys(seasonTotals).filter((teamId) => toiletBracketTeams.has(teamId))
    if (missedPlayoffTeams.length) {
        const unluckiestId = missedPlayoffTeams.reduce (
            (leaderId, challengerId) => (seasonTotals[leaderId] > seasonTotals[challengerId] ? leaderId : challengerId)
        )
        awards.push({
            title: "Unluckiest",
            teamId: unluckiestId,
            value: Math.round(seasonTotals[unluckiestId] * 10) / 10
        })
    }

    return awards
}