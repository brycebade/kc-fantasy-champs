import { 
    getRegularSeasonMatchups, 
    getPlayoffMatchups,
    getCompletedRegularSeasonMatchups, 
    getCurrentSeason } from "../api/matchupsApi.js"

import { getStandings } from "../api/standingsApi.js"
import { getTeams } from "../api/teamsApi.js"

const roundToTwo = (number) => {
    return Math.round(number * 100) / 100
}

const buildTeamLogs = (teams, matchups) => {
    const teamGameLogs = {}

    teams.forEach((team) => {
        teamGameLogs[team.id] = []
    })

    matchups.forEach((matchup) => {
        const team1Score = Number(matchup.team_1_score)
        const team2Score = Number(matchup.team_2_score)

        const team1Game = {
            week: matchup.week,
            teamId: matchup.team_1_id,
            opponentId: matchup.team_2_id,
            pointsFor: team1Score,
            pointsAgainst: team2Score,
            margin: roundToTwo(team1Score - team2Score),
            won: matchup.winner_team_id === matchup.team_1_id,
            tied: matchup.is_tie === true, 
        }

        const team2Game = {
            week: matchup.week,
            teamId: matchup.team_2_id,
            opponentId: matchup.team_1_id,
            pointsFor: team2Score,
            pointsAgainst: team1Score,
            margin: roundToTwo(team2Score - team1Score),
            won: matchup.winner_team_id === matchup.team_2_id,
            tied: matchup.is_tie === true
        }

        teamGameLogs[matchup.team_1_id].push(team1Game)
        teamGameLogs[matchup.team_2_id].push(team2Game)
    })

    return teamGameLogs
}

const average = (numbers) => {
    if (numbers.length === 0) return 0

    const total = numbers.reduce((sum, number) => {
        return sum + number
    }, 0)

    return roundToTwo(total / numbers.length)
}

const normalize = (value, min, max) => {
    if (max === min) {
        return 50
    }

    return roundToTwo(((value - min) / (max - min)) * 100)
}

const calculateRawTeamStats = (teams, teamGameLogs) => {
    const baseStats = teams.map((team) => {
        const games = teamGameLogs[team.id]

        const wins = games.filter((game) => game.won).length
        const ties = games.filter((game) => game.tied).length
        const losses = games.length - wins - ties

        const totalPoints = games.reduce((sum, game) => {
            return sum + game.pointsFor
        }, 0)

        const pointsAgainst = games.reduce((sum, game) => {
            return sum + game.pointsAgainst
        }, 0)

        const averageMargin = average(games.map((game) => {
            return game.margin
        }))

        const recentGames = games.slice(-3)

        const recentForm = average(recentGames.map((game) => {
            return game.pointsFor
        }))

        let winPct

        if (games.length === 0) {
            winPct = 0
        } else {
            winPct = roundToTwo((wins + ties * 0.5) / games.length)
        }

        let averagePointsFor

        if (games.length === 0) {
            averagePointsFor = 0
        } else {
            averagePointsFor = roundToTwo(totalPoints / games.length)
        }

        return {
            teamId: team.id,
            teamName: team.current_name,
            gamesPlayed: games.length,
            wins,
            losses,
            ties,
            totalPoints: roundToTwo(totalPoints),
            pointsAgainst: roundToTwo(pointsAgainst),
            averagePointsFor,
            averageMargin,
            recentForm,
            winPct
        }
    })

    const statsWithStrengthOfSchedule = baseStats.map((teamStats) => {
        const games = teamGameLogs[teamStats.teamId]

        const opponentAverageScores = games.map((game) => {
            const opponentStats = baseStats.find((stat) => {
                return stat.teamId === game.opponentId
            })

            if (!opponentStats) {
                return 0
            }

            return opponentStats.averagePointsFor
        })

        const strengthOfSchedule = average(opponentAverageScores)

        return {
            ...teamStats,
            strengthOfSchedule
        }
    })

    return statsWithStrengthOfSchedule
}

const normalizeTeamStats = (rawTeamStats) => {
    const statKeys = [
        "recentForm",
        "totalPoints",
        "winPct",
        "strengthOfSchedule",
        "averageMargin",
        "pointsAgainst"
    ]

    const minMaxValues = {}

    statKeys.forEach((key) => {
        const values = rawTeamStats.map((team) => {
            return team[key]
        })

        minMaxValues[key] = {
            min: Math.min(...values),
            max: Math.max(...values)
        }
    })

    const normalizedStats = rawTeamStats.map((team) => {
        const normalized = {}

        statKeys.forEach((key) => {
            normalized[key] = normalize(
                team[key],
                minMaxValues[key].min,
                minMaxValues[key].max
            )
        })

        return {
            ...team,
            normalized
        }
    })

    return normalizedStats
}

export const renderPowerRankings = async () => {
    const container = document.getElementById("powerRankingsContainer")

    if (!container) return

    container.innerHTML = `<p class="text-base-content/70">Loading Power Rankings...</p>`

    try {
        const season = await getCurrentSeason()

        const currentWeek = 14

        const teams = await getTeams()
        const matchups = await getCompletedRegularSeasonMatchups(season, currentWeek)
        
        const teamGameLogs = buildTeamLogs(teams, matchups)
        const rawTeamStats = calculateRawTeamStats(teams, teamGameLogs)
        const normalizedTeamStats = normalizeTeamStats(rawTeamStats)

        console.log("Normalized Team Stats:", normalizedTeamStats)
        console.log("Raw Team Stats:", rawTeamStats)
        console.log("Team Game Logs:", teamGameLogs)
        console.log("Power Rankings Season:", season)
        console.log("Power Rankings Team:", teams)
        console.log("Power Rankings Matchups:", matchups)

        container.innerHTML = `
            <div class="mt-4 space-y-2 text-sm">
                <p>
                    <span class="font-semibold">Season</span>
                    ${season}
                </p>
                <p>
                    <span class="font-semibold">Current Week:</span>
                    ${currentWeek}
                </p>
                <p>
                    <span class="font-semibold">Teams Loaded:</span>
                    ${teams.length}
                </p>
                <p>
                    <span class="font-semibold">Completed Matchups Loaded:</span>
                    ${matchups.length}
                </p>
            </div>
        `   
    } catch (error) {
        console.error("Error rendering power rankings:", error)

        container.innerHTML = `
            <div class="card bg-base-100 shadow-md border border-base-300">
                <div class="card-body">
                    <p class="text-sm text-error">Power rankings could no be loaded</p>
                </div>
            </div>
        `
    }
}