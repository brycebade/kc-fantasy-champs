import { teams } from "../data/teams.js"

export const renderTeamsDropdown = () => {
    const teamsDropdown = document.getElementById("teamsDropdown")

    if (!teamsDropdown) return
    
    const currentTeams = teams
        .filter((team) => {
            return team.active === true
    })
        .sort((a, b) => {
            return a.currentName.localeCompare(b.currentName)
        })

    currentTeams.forEach((team) => {
        const li = document.createElement("li")

        li.innerHTML = `
            <a href="./team.html?team=${team.slug}">
                ${team.currentName}
            </a>
        `

        teamsDropdown.appendChild(li)
    })
}