import { teams } from "./src/data/teams.js";

const teamsDropdown = document.getElementById("teamsDropdown")

const currentTeams = teams.filter((team) => {
    return team.active === true
})

currentTeams.forEach((team) => {
    const li = document.createElement("li")

    li.innerHTML = `
    <a href="team.html?team=${team.slug}">
        ${team.currentName}
    </a>
    `
    
    teamsDropdown.appendChild(li)
})