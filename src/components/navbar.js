import { getTeams } from "../api/teamsApi.js"

export const renderTeamsDropdown = async () => {
    const teamsDropdown = document.getElementById("teamsDropdown")

    if (!teamsDropdown) return

    const teams = await getTeams()
    
    const currentTeams = teams
        .filter((team) => {
            return team.active === true
    })
        .sort((a, b) => {
            return a.currentName.localeCompare(b.currentName)
        })

    teamsDropdown.innerHTML = ""

    currentTeams.forEach((team) => {
        const li = document.createElement("li")

        li.innerHTML = `
            <a href="./team.html?team=${team.slug}">
                ${team.current_name}
            </a>
        `

        teamsDropdown.appendChild(li)
    })
}