import { teams } from "../data/teams.js"
import { getDraftPicksForYear } from "../data/draftResultsByYear.js"
import { renderTeamsDropdown } from "../components/navbar.js"

renderTeamsDropdown()

const teamName = document.getElementById("teamName")
const draftTableBody = document.getElementById("draftTableBody")

const params = new URLSearchParams(window.location.search)
const teamSlug = params.get("team")

const selectedTeam = teams.find((team) => {
    return team.slug === teamSlug
})

const picks2025 = getDraftPicksForYear(2025)

const teamPicks = picks2025.filter((pick) => {
    return pick.teamId === selectedTeam.id
})

teamName.textContent = `${selectedTeam.currentName} Draft Results`

teamPicks.forEach((pick) => {
    const row = document.createElement("tr")

    row.innerHTML = `
        <td class="px-4 py-3">${pick.round}</td>
        <td class="px-4 py-3">${pick.pick}</td>
        <td class="px-4 py-3">${pick.overall}</td>
        <td class="px-4 py-3 font-semibold whitespace-nowrap">${pick.player}</td>
        <td class="px-4 py-3">${pick.position}</td>
        <td class="px-4 py-3">${pick.nflTeam}</td>
    `
    
    draftTableBody.appendChild(row)
})