import { getTeams } from "../api/teamsApi.js"
import { getDraftResultsByYear } from "../api/draftResultsApi.js"
import { renderTeamsDropdown } from "../components/navbar.js"

const teamName = document.getElementById("teamName")
const draftTableBody = document.getElementById("draftTableBody")
const draftCards = document.getElementById("draftCards")

const renderTeamPage = async () => {
    await renderTeamsDropdown()

    const params = new URLSearchParams(window.location.search)
    const teamSlug = params.get("team")

    const teams = await getTeams()

    const selectedTeam = teams.find((team) => {
        return team.slug === teamSlug
    })
    
    if (!selectedTeam) {
        teamName.textContent = "Team Not Found"
        return
    }

    const picks2025 = await getDraftResultsByYear(2025)

    const teamPicks = picks2025.filter((pick) => {
        return pick.team_id === selectedTeam.id
    })

    teamName.textContent = `${selectedTeam.current_name} Draft Results`

    teamPicks.forEach((pick) => {
        const row = document.createElement("tr")
        const card = document.createElement("div")

        row.className = "hover:bg-base-300 cursor-default"

        row.innerHTML = `
            <td class="text-center">${pick.round}</td>
            <td class="text-center">${pick.pick}</td>
            <td class="text-center">${pick.overall}</td>
            <td class="text-left font-semibold">${pick.player}</td>
            <td class="text-center">${pick.position}</td>
            <td class="text-center">${pick.nfl_team}</td>
        `
        
        draftTableBody.appendChild(row)

        card.innerHTML = `
            <div class="card bg-base-100 border border-base-300 shadow-sm">
                <div class="card-body p-4">
                    <p class="text-xs uppercase tracking-wide text-primary font-bold">
                        Round ${pick.round} • Pick ${pick.pick} • Overall ${pick.overall}
                    </p>

                    <h2 class="text-lg font-bold text-base-content leading-tight">
                        ${pick.player}
                    </h2>

                    <p class="text-sm opacity-80">
                        ${pick.position} • ${pick.nflTeam}
                    </p>
                </div>
            </div>
        `

        draftCards.appendChild(card)
    })
}

renderTeamPage()