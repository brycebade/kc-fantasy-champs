import { 
    getRegularSeasonMatchups, 
    getPlayoffMatchups,
    getCompletedRegularSeasonMatchups, 
    getCurrentSeason } from "../api/matchupsApi.js"

import { getStandings } from "../api/standingsApi.js"
import { getTeams } from "../api/teamsApi.js"
import { getCurrentSeasonSettings } from "../api/seasonSettingsApi.js"

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
            teamName: team.current_name || team.team_name || team.name || team.id,
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

const getPowerRankingWeights = (currentWeek) => {
    if (currentWeek <= 5) {
        return {
            recentForm: 0.20,
            totalPoints: 0.30,
            winPct: 0.20,
            strengthOfSchedule: 0.05,
            averageMargin: 0.20,
            pointsAgainst: 0.05
        }
    }

    if (currentWeek <= 10) {
        return {
            recentForm: 0.20,
            totalPoints: 0.25,
            winPct: 0.25,
            strengthOfSchedule: 0.07,
            averageMargin: 0.20,
            pointsAgainst: 0.03
        }
    }

    return {
        recentForm: 0.25,
        totalPoints: 0.20,
        winPct: 0.25,
        strengthOfSchedule: 0.07,
        averageMargin: 0.20,
        pointsAgainst: 0.03
    }
}

const calculatePowerScores = (normalizedTeamStats, currentWeek) => {
    const weights = getPowerRankingWeights(currentWeek)

    const teamsWithPowerScores = normalizedTeamStats.map((team) => {
        const powerScore = 
            team.normalized.recentForm * weights.recentForm +
            team.normalized.totalPoints * weights.totalPoints +
            team.normalized.winPct * weights.winPct +
            team.normalized.strengthOfSchedule * weights.strengthOfSchedule +
            team.normalized.averageMargin * weights.averageMargin +
            team.normalized.pointsAgainst * weights.pointsAgainst

        return {
            ...team,
            powerScore: roundToTwo(powerScore)
        }
    })

    return teamsWithPowerScores
}

const rankTeams = (teamsWithPowerScores) => {
    const sortedTeams = [...teamsWithPowerScores].sort((a, b) => {
        if (b.powerScore !== a.powerScore) {
            return b.powerScore - a.powerScore
        }

        if (b.strengthOfSchedule !== a.strengthOfSchedule) {
            return b.strengthOfSchedule - a.strengthOfSchedule
        }

        if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints
        }

        return b.pointsAgainst - a.pointsAgainst
    })

    const rankedTeams = sortedTeams.map((team, index) => {
        return {
            ...team,
            rank: index + 1
        }
    })
    return rankedTeams
}

const buildStandingsRankings = (teams, standings) => {
    const hasFinalRank = standings.every((standing) => {
        return standing.final_rank !== null && standing.final_rank !== undefined
    })

    let sortedStandings

    if (hasFinalRank) {
        sortedStandings = [...standings].sort((a, b) => {
            return a.final_rank - b.final_rank
        })
    } else {
        sortedStandings = [...standings].sort((a, b) => {
            if (b.win !== a.win) {
                return b.win - a.win
            }

            if (a.loss !== b.loss) {
                return a.loss - b.loss
            }

            return b.points_for - a.points_for
        })
    }

    const rankedStandings = sortedStandings.map((standing, index) => {
        const team = teams.find((team) => {
            return team.id === standing.team_id
        })

        let rank

        if (hasFinalRank) {
            rank = standing.final_rank
        } else {
            rank = index + 1
        }

        return {
            rank,
            teamId: standing.team_id,
            teamName: team?.current_name || team?.team_name || team?.name || standing.team_id,
            wins: standing.win,
            losses: standing.loss
        }
    })

    return rankedStandings
}

const renderRankingsList = (container, rankedTeams, subtitle) => {
    container.innerHTML = `
        <p class="mt-2 mb-3 text-xs opacity-70">
            ${subtitle}
        </p>

        <div class="divide-y divide-base-300">
            ${rankedTeams.map((team) => {
                return `
                    <div class="flex items-center justify-between gap-3 py-2">
                        <div class="flex items-center gap-3 min-w-0">
                            <span class="font-bold text-sm w-8 shrink-0 text-right text-primary">
                                #${team.rank}
                            </span>

                            <p class="text-sm font-semibold truncate">
                                ${team.teamName}
                            </p>
                        </div>

                        <span class="text-xs font-medium opacity-70 shrink-0">
                            ${team.wins !== undefined && team.losses !== undefined
                                ? `${team.wins}-${team.losses}`
                                : ""}
                        </span>
                    </div>
                `
            }).join("")}
    `
}

const buildPlayoffSeedData = (teams, standings) => {
    return standings.map((standing) => {
        const team = teams.find((team) => {
            return team.id === standing.team_id
        })

        let bracketType
        let bracketSeed

        if(standing.seed <= 6) {
            bracketType = "championship"
            bracketSeed = standing.seed
        } else {
            bracketType = "toilet"
            bracketSeed = standing.seed - 6
        }

        return {
            teamId: standing.team_id,
            teamName: team?.current_name || team?.team_name || team?.name || standing.team_id,
            overallSeed: standing.seed,
            bracketSeed,
            bracketType,
            wins: standing.win,
            losses: standing.loss
        }
    })
}

const buildPlayoffTeamLogs = (playoffSeedData, playoffMatchups) => {
    const playoffTeamLogs = {}

    playoffSeedData.forEach((team) => {
        playoffTeamLogs[team.teamId] = []
    })

    const completedPlayoffMatchups = playoffMatchups.filter((matchup) => {
        return (
            matchup.team_1_id &&
            matchup.team_2_id &&
            matchup.team_1_score !== null &&
            matchup.team_2_score !== null &&
            matchup.winner_team_id &&
            matchup.loser_team_id
        )
    })

    completedPlayoffMatchups.forEach((matchup) => {
        const team1Score = Number(matchup.team_1_score)
        const team2Score = Number(matchup.team_2_score)

        const team1Game = {
            week: matchup.week,
            bracketType: matchup.bracket_type,
            playoffRound: matchup.playoff_round,
            placementType: matchup.placement_type,
            teamId: matchup.team_1_id,
            opponentId: matchup.team_2_id,
            pointsFor: team1Score,
            pointsAgainst: team2Score,
            won: matchup.winner_team_id === matchup.team_1_id,
            lost: matchup.loser_team_id === matchup.team_1_id
        }

        const team2Game = {
            week: matchup.week,
            bracketType: matchup.bracket_type,
            playoffRound: matchup.playoff_round,
            placementType: matchup.placement_type,
            teamId: matchup.team_2_id,
            opponentId: matchup.team_1_id,
            pointsFor: team2Score,
            pointsAgainst: team1Score,
            won: matchup.winner_team_id === matchup.team_2_id,
            lost: matchup.loser_team_id === matchup.team_2_id
        }

        playoffTeamLogs[matchup.team_1_id].push(team1Game)
        playoffTeamLogs[matchup.team_2_id].push(team2Game)
    })

    return playoffTeamLogs
}

const getPlacementResult = (game) => {
    if (!game.placementType) return null

    if (game.placementType === "championship_final") {
        if (game.won) {
            return 1
        } else {
            return 2
        }
    }

    if (game.placementType === "third_place") {
        if (game.won) {
            return 3
        } else {
            return 4
        }
    }

    if (game.placementType === "fifth_place") {
        if (game.won) {
            return 5 
        } else {
            return 6
        }
    }

    if (game.placementType === "seventh_place") {
        if (game.won) {
            return 7 
        } else {
            return 8
        }
    }

    if (game.placementType === "ninth_place") {
        if (game.won) {
            return 9 
        } else {
            return 10
        }
    }

    if (game.placementType === "toilet_final") {
        if (game.won) {
            return 11 
        } else {
            return 12
        }
    }

    return null
}

const determinePlayoffTeamStatuses = (playoffSeedData, playoffTeamLogs) => {
    return playoffSeedData.map((team) => {
        const games = playoffTeamLogs[team.teamId] || []

        const placementGame = games.find((game) => {
            return game.placementType
        })

        if (placementGame) {
            const finalRank = getPlacementResult(placementGame)

            if (finalRank !== null) {
                return {
                    ...team,
                    playoffStatus: "placement_complete",
                    finalRank
                }
            }
        }

        const bracketGames = games.filter((game) => {
            return game.bracketType === team.bracketType
        })

        const losses = bracketGames.filter((game) => {
            return game.loserTeam
        })

        const wins = bracketGames.filter((game) => {
            return game.won
        })

        if (team.bracketType === "championship") {
            if (games.length === 0 && team.bracketSeed <= 2) {
                return {
                    ...team,
                    playoffStatus: "championship_bye",
                    finalRank: null
                }
            }

            const quarterfinalLoss = losses.find((game) => {
                return game.playoffRound === "quarterfinals"
            })

            if (quarterfinalLoss) {
                return {
                    ...team,
                    playoffStatus: "fifth_place_pending",
                    finalRank: null
                }
            }

            const semifinalLoss = losses.find((game) => {
                return game.playoffRound === "semifinals"
            })

            if (semifinalLoss) {
                return {
                    ...team,
                    playoffStatus: "third_place_pending",
                    finalRank: null
                }
            }

            const semifinalWin = wins.find((game) => {
                return game.playoffRound === "semifinals"
            })

            if (semifinalWin) {
                return {
                    ...team,
                    playoffStatus: "championship_final_pending",
                    finalRank: null
                }
            }

            return {
                ...team,
                playoffStatus: "championship_alive",
                finalRank: null
            }
        }

        if (team.bracketType === "toilet") {
            if (games.length === 0 && team.bracketSeed <= 2) {
                return {
                    ...team,
                    playoffStatus: "toilet_bye",
                    finalRank: null
                }
            }

            const toiletLosses = losses.length

            const round3Game = games.find((game) => {
                return game.playoffRound === "round3"
            })

            if (round3Game && round3Game.placementType === "toilet_final") {
                const finalRank = getPlacementResult(round3Game)

                return {
                    ...team,
                    playoffStatus: "placement_complete",
                    finalRank 
                }
            }

            if (toiletLosses >= 2) {
                return {
                    ...team,
                    playoffStatus: "last_place_game_pending",
                    finalRank: null
                }
            }

            if (toiletLosses === 1) {
                return {
                    ...team,
                    playoffStatus: "toilet_danger",
                    finalRank: null
                }
            }

            return {
                ...team,
                playoffStatus: "toilet_safe",
                finalRank: null
            }
        }

        return {
            ...team,
            playoffStatus: "unknown",
            finalRank: null
        }
    })
}

const getPlayoffStatusSortValue = (team) => {
    if (team.finalRank !== null && team.finalRank !== undefined) {
        return team.finalRank
    }

    if (team.playoffStatus === "championship_final_pending") {
        return 1
    }

    if (team.playoffStatus === "championship_bye") {
        return 1
    }

    if (team.playoffStatus === "championship_alive") {
        return 3
    }

    if (team.playoffStatus === "third_place_pending") {
        return 3
    }

    if (team.playoffStatus === "fifth_place_pending") {
        return 5
    }

    if (team.playoffStatus === "toilet_bye") {
        return 7
    }

    if (team.playoffStatus === "toilet_safe") {
        return 7
    }

    if (team.playoffStatus === "toilet_danger") {
        return 9
    }

    if (team.playoffStatus === "last_place_game_pending") {
        return 11
    }

    return 99
}

const rankLivePlayoffTeams = (playoffStatuses) => {
    const sortedTeams = [...playoffStatuses].sort((a, b) => {
        const aSortValue = getPlayoffStatusSortValue(a)
        const bSortValue = getPlayoffStatusSortValue(b)

        if (aSortValue !== bSortValue) {
            return aSortValue - bSortValue
        }

        if (a.bracketType === "championship" && b.bracketType === "toilet") {
            return -1
        }

        if (a.bracketType === "toilet" && b.bracketType === "championship") {
            return 1
        }

        return a.overallSeed - b.overallSeed
    })

    const rankedTeams = sortedTeams.map((team, index) => {
        return {
            ...team,
            rank: index + 1
        }
    })

    return rankedTeams
}

const buildPlayoffPlacementRankings = (teams, standings, playoffMatchups) => {
    const placementRankMap = {
        championship_final: {
            winnerRank: 1,
            loserRank: 2
        },
        third_place: {
            winnerRank: 3,
            loserRank: 4
        },
        fifth_place: {
            winnerRank: 5,
            loserRank: 6
        },
        seventh_place: {
            winnerRank: 7,
            loserRank: 8
        },
        ninth_place: {
            winnerRank: 9,
            loserRank: 10
        },
        toilet_final: {
            winnerRank: 11,
            loserRank: 12
        }
    }

    const completedPlacementGames = playoffMatchups.filter((matchup) => {
        return (
            matchup.placement_type &&
            matchup.winner_team_id &&
            matchup.loser_team_id
        )
    })

    const rankings = []

    completedPlacementGames.forEach((matchup) => {
        const placementRanks = placementRankMap[matchup.placement_type]

        if (!placementRanks) return

        const winnerTeam = teams.find((team) => {
            return team.id === matchup.winner_team_id
        })

        const loserTeam = teams.find((team) => {
            return team.id === matchup.loser_team_id
        })

        const winnerStanding = standings.find((standing) => {
            return standing.team_id === matchup.winner_team_id
        })

        const loserStanding = standings.find((standing) => {
            return standing.team_id === matchup.loser_team_id
        })

        rankings.push({
            rank: placementRanks.winnerRank,
            teamId: matchup.winner_team_id,
            teamName: winnerTeam?.current_name || winnerTeam?.team_name || winnerTeam?.name || matchup.winner_team_id,
            wins: winnerStanding?.win,
            losses: winnerStanding?.loss
        })

        rankings.push({
            rank: placementRanks.loserRank,
            teamId: matchup.loser_team_id,
            teamName: loserTeam?.current_name || loserTeam?.team_name || loserTeam?.name || matchup.loser_team_id,
            wins: loserStanding?.win,
            losses: loserStanding?.loss
        })
    })

    const sortedRankings = rankings.sort((a, b) => {
        return a.rank - b.rank
    })

    return sortedRankings
}

export const renderPowerRankings = async () => {
    const container = document.getElementById("powerRankingsContainer")

    if (!container) return

    container.innerHTML = `<p class="text-base-content/70">Loading Power Rankings...</p>`

    try {
        const seasonSettings = await getCurrentSeasonSettings()

        console.log("Season Settings:", seasonSettings)

        const season = seasonSettings.season
        const currentWeek = seasonSettings.current_week
        const phase = seasonSettings.phase
        
        const teams = await getTeams()

        if (phase === "offseason") {
            const standings = await getStandings(season)
            const rankedStandings = buildStandingsRankings(teams, standings)

            renderRankingsList(
                container,
                rankedStandings,
                `${season} offseason rankings based on standings`
            )

            return
        }

        if (phase === "final") {
            const standings = await getStandings(season)

            const rankedStandings = buildStandingsRankings(teams, standings)

            renderRankingsList(
                container,
                rankedStandings,
                `${season} final rankings`
            )

            return
        }

        if (phase === "playoffs") {
            const standings = await getStandings(season)
            const playoffMatchups = await getPlayoffMatchups(season)

            const playoffSeedData = buildPlayoffSeedData(teams, standings)
            const playoffTeamLogs = buildPlayoffTeamLogs(playoffSeedData, playoffMatchups)
            const playoffStatuses = determinePlayoffTeamStatuses(playoffSeedData, playoffTeamLogs)
            const livePlayoffRankings = rankLivePlayoffTeams(playoffStatuses)

            console.log("Playoff Seed Data:", playoffSeedData)
            console.log("Playoff Matchups:", playoffMatchups)
            console.log("Playoff Team Logs:", playoffTeamLogs)
            console.log("Playoff Statuses:", playoffStatuses)
            console.log("Live Playoff Rankings:", livePlayoffRankings)

            const playoffRankings = buildPlayoffPlacementRankings(
                teams,
                standings,
                playoffMatchups
            )

            renderRankingsList(
                container,
                livePlayoffRankings,
                `${season} Live Playoff Rankings`
            )

            return
        }
        
        if (phase !== "regular") {
            container.innerHTML = `
                <p class="text-sm text-erro">
                    Unknown rankings phase: ${phase}
                </p>
            `
            return
        }

        const matchups = await getCompletedRegularSeasonMatchups(season, currentWeek)

        const teamGameLogs = buildTeamLogs(teams, matchups)
        const rawTeamStats = calculateRawTeamStats(teams, teamGameLogs)
        const normalizedTeamStats = normalizeTeamStats(rawTeamStats)
        const teamsWithPowerScores = calculatePowerScores(normalizedTeamStats, currentWeek)
        const rankedTeams = rankTeams(teamsWithPowerScores)

        renderRankingsList(
            container,
            rankedTeams,
            `Regular Seson Rankings Through Week ${currentWeek}`
        )   
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