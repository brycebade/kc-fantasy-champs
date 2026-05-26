import { getStandings } from "../api/standingsApi.js"
import { getTeams } from "../api/teamsApi.js"
import { getMatchups } from "../api/matchupsAPI.js"
import { getHeadToHeadWinner } from "../utils/standingsUtils.js"

const season = 2025

const isSeasonFinished = (matchups) => {
    const week17Matchups = matchups.filter((matchup) => {
        return Number(matchup.week) === 17
    })

    const allWeek17GamesComplete = week17Matchups.every((matchup) => {
        return matchup.winner_team_id
    })

    return week17Matchups.length === 6 && allWeek17GamesComplete
}

const sortStandings = (standings, matchups) => {
    const regularSeasonMatchups = matchups.filter((matchup) => {
        return matchup.matchup_type === "regular"
    })

    standings.sort((a, b) => {
        if (b.win !== a.win) {
            return b.win - a.win
        }

        const winner = getHeadToHeadWinner(
            a.team_id,
            b.team_id,
            regularSeasonMatchups
        )

        if (winner === String(a.team_id).trim()) return -1
        if (winner === String(b.team_id).trim()) return 1

        return b.points_for - a.points_for
    })
}

const findTeam = (teams, teamId) => {
    return teams.find((team) => {
        return String(team.id).trim() === String(teamId).trim()
    })
}

const sortByFinalRank = (standings) => {
    standings.sort((a, b) => {
        return a.final_rank - b.final_rank
    })
}

export const renderStandings = async () => {
    const standingsTableBody = document.getElementById("standingsTableBody")

    if (!standingsTableBody) return

    const standings = await getStandings(season)
    const teams = await getTeams()
    const matchups = await getMatchups(season)

    const seasonFinished = isSeasonFinished(matchups)

    if (seasonFinished) {
        sortByFinalRank(standings)
    } else {
        sortStandings(standings, matchups)
    }

    standingsTableBody.innerHTML = ""

    standings.forEach((standing, index) => {
        const team = findTeam(teams, standing.team_id)

        const tr = document.createElement("tr")

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${team?.current_name || "Unknown Team"}</td>
            <td>${standing.win}</td>
            <td>${standing.loss}</td>
            <td>${standing.points_for}</td>
            <td>${standing.points_against}</td>
            <td>${standing.streak}</td>
        `

        standingsTableBody.appendChild(tr)
    })
}

export const renderCompactStandings = async () => {
    const standingsPreview = document.getElementById("standingsPreview")

    if (!standingsPreview) return

    const standings = await getStandings(season)
    const teams = await getTeams()
    const matchups = await getMatchups(season)

    const seasonFinished = isSeasonFinished(matchups)

    if (seasonFinished) {
        sortByFinalRank(standings)
    } else {
        sortStandings(standings, matchups)
    }

    standingsPreview.innerHTML = ""
    
    standings.forEach((standing, index) => {
        const team = findTeam(teams, standing.team_id)
    

        const row = document.createElement("div")

        row.className = "flex items-center justify-between gap-3"

        row.innerHTML = `
            <span class="truncate">
                ${index + 1}. ${team?.current_name || "Unknown"}
            </span>

            <span class="font-semibold whitespace-nowrap">
                (${standing.win}-${standing.loss})
            </span>
        `

        standingsPreview.appendChild(row)
    })
}