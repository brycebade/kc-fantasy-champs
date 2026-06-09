import { supabase } from "./src/supabaseClient.js"
import { getTeams } from "./src/api/teamsApi.js"
import { getMatchups, getCurrentSeason } from "./src/api/matchupsApi.js"

const passwordSubmit = document.getElementById("passwordSubmit")
const adminDashboard = document.getElementById("adminDashboard")

const populateWeekDropdown = () => {
    const weekSelect = document.getElementById("weekSelect")

    for (let i = 1; i <= 17; i++) {
        const option = document.createElement("option")
        option.value = i
        option.textContent = `Week ${i}`
        weekSelect.appendChild(option)
    }
}

const loadMatchups = async () => {
    const season = Number(document.getElementById("seasonSelect").value)
    const week = Number(document.getElementById("weekSelect").value)
    const submitButton = document.getElementById("submitScores")
    const currentSeason = await getCurrentSeason()

    const allMatchups = await getMatchups(season)
    const weekMatchups = allMatchups.filter(m => m.week === week)

    const teams = await getTeams()
    const container = document.getElementById("matchupsContainer")
    container.innerHTML = ""

    weekMatchups.forEach(matchup => {
        const team1 = teams.find(t => t.id === matchup.team_1_id)
        const team2 = teams.find(t => t.id === matchup.team_2_id)

        const row = document.createElement("div")
        row.className = "flex items-center gap-4 mb-4"
        row.innerHTML = `
            <span class="font-semibold w-40 text-right">${team1?.current_name || "TBD"}</span>
            <input type="number" id="score1_${matchup.id}" placeholder="0" class="input input-bordered w-20 text-center">
            <span class="font-bold">vs</span>
            <input type="number" id="score2_${matchup.id}" placeholder="0" class="input input-bordered w-20 text-center">
            <span class="font-semibold w-40">${team2?.current_name || "TBD"}</span>
        `
        container.appendChild(row)
    })

    if (season < currentSeason) {
        submitButton.style.display = "none"
    } else {
        submitButton.style.display = "block"
    }
}

const submitScores = async () => {
    const season = Number(document.getElementById("seasonSelect").value)
    const week = Number(document.getElementById("weekSelect").value)

    const allMatchups = await getMatchups(season)
    const weekMatchups = allMatchups.filter(m => m.week === week)

    for (const matchup of weekMatchups) {
        const score1Input = document.getElementById(`score1_${matchup.id}`)
        const score2Input = document.getElementById(`score2_${matchup.id}`)

        const score1 = Number(score1Input.value)
        const score2 = Number(score2Input.value)

        if (!score1 && !score2) continue

        const winnerId = score1 > score2 ? matchup.team_1_id : matchup.team_2_id
        const loserId = score1 > score2 ? matchup.team_2_id : matchup.team_1_id
        const isTie = score1 === score2

        console.log("Updating matchup:", matchup.id, "Score1:", score1, "Score2:", score2)

        const { error } = await supabase
            .from ("matchups")
            .update({
                team_1_score: score1,
                team_2_score: score2,
                winner_team_id: isTie ? null : winnerId,
                loser_team_id: isTie ? null : loserId,
                is_tie: isTie
            })
            .eq("id", matchup.id)

            console.log("Update result for", matchup.id, "error:", error)

            if (error) {
                console.error("Error updating matchup:", error)
            }
    }

    alert("Scores submitted successfully!")
}

passwordSubmit.addEventListener("click", () => {
    const inputValue = document.getElementById("passwordInput").value
    
    if (inputValue === "champs") {
        document.getElementById("passwordScreen").style.display = "none"
        adminDashboard.style.display = "block"
        populateWeekDropdown()
        document.getElementById("weekSelect").addEventListener("change", loadMatchups)
        document.getElementById("seasonSelect").addEventListener("change", loadMatchups)
        document.getElementById("submitScores").addEventListener("click", submitScores)
    } else {
       document.getElementById('errorMessage').textContent = "Incorrect Password"
    }
})

