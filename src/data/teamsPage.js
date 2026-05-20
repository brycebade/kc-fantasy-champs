import { getTeams } from "../api/teamsApi.js"

const teamsList = document.getElementById("teamsList")

const renderTeams = async () => {
    const teams = await getTeams()

    teamsList.innerHTML = ""

    teams.forEach((team) => {
        const teamCard = document.createElement("div")
        teamCard.classList.add("card", "bg-base-100", "shadow-md", "rounded-xl")

        teamCard.innerHTML = `
            <div class ="card-body>
                <h2 class="card-title">${team.current_name}</h2>
                <p>Team ID: ${team.id}</p>
                <p>Owner ID: ${team.current_owner_id}<p>
                <p>Active: ${team.active}</p>
            </div>
        `

        teamsList.appendChild(teamCard)
    })
}

renderTeams()