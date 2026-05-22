import { getStandings } from "../api/standingsApi.js"
import { getTeams } from "../api/teamsApi.js"

export const renderStandings = async () => {
    const standingsTableBody = document.getElementById("standingsTableBody")

    if (!standingsTableBody) return

    const standings = await getStandings(2025)
    const teams = await getTeams()

    console.log("standings", standings)
    console.log("teams", teams)

    standingsTableBody.innerHTML = ""

    standings.forEach((standing, index) => {
        const team = teams.find((team) => {
            return String(team.id).trim() === String(standing.team_id).trim()
        })

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

    const standings = await getStandings(2025)
    const teams = await getTeams()

    standingsPreview.innerHTML = ""

    standings.forEach((standing, index) => {
        const team = teams.find((team) => {
            return String(team.id).trim() === String(standing.team_id).trim()
        })

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