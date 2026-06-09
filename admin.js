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

const recalculateStandings = async (season) => {
    const allMatchups = await getMatchups(season)

    const completedMatchups = allMatchups.filter(m => 
        m.matchup_type === "regular" &&
        m.team_1_score !== null &&
        m.team_2_scroe !== null
    )

    const teams = await getTeams()

    teams.forEach(async (team) => {
        const teamMatchups = completedMatchups.filter(m => 
            m.team_1_id === team.id || m.team_2_id === team.id  
        )

        let wins = 0
        let losses = 0
        let pointsFor = 0
        let pointsAgainst = 0

        teamMatchups.forEach(m => {
            const isTeam1 = m.team_1_id === team.id
            const myScore = isTeam1 ? m.team_1_score : m.team_2_score
            const oppScore = isTeam1 ? m.team_2_score : m.team_1_score

            pointsFor += myScore
            pointsAgainst += oppScore

            if (myScore > oppScore) wins++
            else if (myScore < oppScore) losses++
        })

        const { error } = await supabase
            .from("standings")
            .upsert({
                id: `${season}_${team.id}_standing`,
                team_id: team.id,
                season: season,
                win: wins,
                loss: losses,
                points_for: pointsFor,
                points_against: pointsAgainst
            }, { onConflict: "team_id, season" })

        if (error) {
            console.error("Error updating standings for", team.id, error)
        }
    })

    await recalculateStandings(season)
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

