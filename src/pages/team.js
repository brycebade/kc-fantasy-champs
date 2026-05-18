import { teams } from "../data/teams.js"
import { getDraftPicksForYear } from "../data/draftResultsByYear.js"
import { renderTeamsDropdown } from "../components/navbar.js"

renderTeamsDropdown()

const teamName = document.getElementById("teamName")
const draftTableBody = document.getElementById("draftTableBody")
const draftCards = document.getElementById("draftCards")

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
    const card = document.createElement("div")

    row.innerHTML = `
        <td class="text-center px-4 py-3">${pick.round}</td>
        <td class="text-center px-4 py-3">${pick.pick}</td>
        <td class="text-center px-4 py-3">${pick.overall}</td>
        <td class="text-center px-4 py-3 font-semibold whitespace-nowrap">${pick.player}</td>
        <td class="text-center px-4 py-3">${pick.position}</td>
        <td class="text-center px-4 py-3">${pick.nflTeam}</td>
    `
    
    draftTableBody.appendChild(row)

    card.innerHTML = `
    <div class="card-body p-4">
        <div class="flex justify-between items-start gap-3">
            <div>
                <h2 class="card-title text-lg leading-tight:>${pick.player}</h2>
                <p class="text-sm opacity-70">${pick.position} • ${pick.nflTeam}</p>
            </div>

            <div class="text-right text-sm">
                <p><span class=font-bold">Round:</span> ${pick.round}</p>
                <p><span class=font-bold">Pick:</span> ${pick.pick}</p>
                <p><span class=font-bold">Overall:</span> ${pick.overall}</p>
            </div>
        </div>
    </div>
    `

    draftCards.appendChild(card)
})