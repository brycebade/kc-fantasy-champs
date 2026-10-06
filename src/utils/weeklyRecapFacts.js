import { getMatchups } from "../api/matchupsApi.js";
import { getTeams } from "../api/teamsApi.js";
import { getTeamBoxScore } from "../api/weeklyLineupsApi.js";
import { formatBoxScoreLine } from "./boxScoreFormat.js"

export const getWeeklyRecapFacts = async (season, week) => {
    const [allMatchups, teams] = await Promise.all([
        getMatchups(season),
        getTeams()
    ])

    const weekMatchups = allMatchups.filter((m) => m.week === week && m.matchup_type === "regular")
    const nameFor = (teamId) => teams.find((t) => t.id === teamId)?.current_name || teamId

    const matchupFacts = []
    for (const matchup of weekMatchups) {
        const [team1Box, team2Box] = await Promise.all([
            getTeamBoxScore(matchup.team_1_id, season, week),
            getTeamBoxScore(matchup.team_2_id, season, week)
        ])

        matchupFacts.push({
            team1Name: nameFor(matchup.team_1_id),
            team1Score: matchup.team_1_score,
            team1Starters: team1Box.map((s) => ({
                name: s.player_name,
                position: s.position,
                points: s.fantasy_points,
                gameWindow: s.game_window,
                line: formatBoxScoreLine({ ...s.raw_stats, position: s.position }),
                raw_stats: s.raw_stats
            })),
            team2Name: nameFor(matchup.team_2_id),
            team2Score: matchup.team_2_score,
            team2Starters: team2Box.map((s) => ({
                name: s.player_name,
                position: s.position,
                points: s.fantasy_points,
                gameWindow: s.game_window,
                line: formatBoxScoreLine({ ...s.raw_stats, position: s.position }),
                raw_stats: s.raw_stats
            })),
            winner: matchup.winner_team_id ? nameFor(matchup.winner_team_id) : null,
            isTie: matchup.is_tie
        })
    }

    return matchupFacts
}