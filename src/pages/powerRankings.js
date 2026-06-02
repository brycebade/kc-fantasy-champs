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