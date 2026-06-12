import { getStandings } from "../api/standingsApi.js"
import { getTeams } from "../api/teamsApi.js"
import { getMatchups } from "../api/matchupsApi.js"
import { getHeadToHeadWinner } from "../utils/standingsUtils.js"
import { renderNavbar } from "../components/navbar.js"

const init = async () => {
    await renderNavbar()
    await renderStandings()
}

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

        let rankColor = ""
        if (seasonFinished) {
            if (index === 0) rankColor = "bg-[#D4AF37] font-bold"
            if (index === 1) rankColor = "bg-[#C0C0C0] font-bold"
            if (index === 2) rankColor = "bg-[#CD7F32] font-bold"
            if (index === standings.length -1) rankColor = "bg-[#7B5E3B] font-bold text-white"
        }

        const tr = document.createElement("tr")

        tr.innerHTML = `
            <td class="${rankColor} rounded-l-lg">${index + 1}</td>
            <td class="${rankColor}">${team?.current_name || "Unknown Team"}</td>
            <td class="${rankColor}">${standing.win}</td>
            <td class="${rankColor} rounded-r-lg md:rounded-none">${standing.loss}</td>
            <td class="${rankColor} hidden md:table-cell">${standing.points_for}</td>
            <td class="${rankColor} hidden md:table-cell">${standing.points_against}</td>
            <td class="${rankColor} hidden md:table-cell md:rounded-r-lg">${standing.streak}</td>
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

init()