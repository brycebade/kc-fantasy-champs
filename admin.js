import { supabase } from "./src/supabaseClient.js"
import { getTeams } from "./src/api/teamsApi.js"
import { getMatchups, getCurrentSeason, getPlayoffMatchups } from "./src/api/matchupsApi.js"
import { getPowerRankingsBlurbInput } from "./src/pages/powerRankings.js"
import { savePowerRankingNote } from "./src/api/powerRankingsNotesApi.js"
import { getCurrentSeasonSettings } from "./src/api/seasonSettingsApi.js"

const passwordSubmit = document.getElementById("passwordSubmit")
const adminDashboard = document.getElementById("adminDashboard")

const generateBlurbInput = async () => {
    const inputBox = document.getElementById("blurbInput")
    inputBox.value = "Generating..."
    inputBox.value = await getPowerRankingsBlurbInput()
}

const saveBlurb = async () => {
    const settings = await getCurrentSeasonSettings()
    const note = document.getElementById("blurbOuput").value

    const result = await savePowerRankingNote(settings.season, settings.current_week, note)
    alert(result ? "Blurb saved!" : "Error saving blurb")
}

const populateSeasonDropdown = () => {
    const seasonSelect = document.getElementById("seasonSelect")
    seasonSelect.innerHTML = ""

    const FIRST_SEASON = 2013
    const CURRENT_SEASON = 2026

    for (let year = CURRENT_SEASON; year >= FIRST_SEASON; year--) {
        const option = document.createElement("option")
        option.value = year
        option.textContent = year
        seasonSelect.appendChild(option)
    }
}

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

    weekMatchups.forEach((matchup, index) => {
        const team1 = teams.find(t => t.id === matchup.team_1_id)
        const team2 = teams.find(t => t.id === matchup.team_2_id)

        const row = document.createElement("div")
        row.className = "mb-5"
        row.innerHTML = `
            <h3 class="text-sm font-semibold text-primary mb-2">Game ${index + 1}</h3>
            <div class="flex items-center justify-between gap-3 mb-2">
                <span class="font-semibold flex-1">${team1?.current_name || "TBD"}</span>
                <input type="number" id="score1_${matchup.id}" class="input w-24 text-center shrink-0 border border-base-300 bg-base-200 rounded-xl">
            </div>
            <div class="flex items-center justify-between gap-3">
                <span class="font-semibold flex-1">${team2?.current_name || "TBD"}</span>
                <input type="number" id="score2_${matchup.id}" class="input w-24 text-center shrink-0 border border-base-300 bg-base-200 rounded-xl">
            </div>
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

            if (error) {
                console.error("Error updating matchup:", error)
            }
    }

    recalculateStandings(season)
    alert("Scores submitted successfully!")
}

const recalculateStandings = async (season) => {
    const allMatchups = await getMatchups(season)

    const completedMatchups = allMatchups.filter(m => 
        m.matchup_type === "regular" &&
        m.team_1_score !== null &&
        m.team_2_score !== null
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
}

const computeFinalRankings = async = () => {
    const season = Number(document.getElementById("seasonSelect").value)
    const playoffMatchups = await getPlayoffMatchups(season)

    const placementRankMap = {
        championship_final: { winnerRank: 1, loserRank: 2 },
        third_place: { winnerRank: 3, loserRank: 4 },
        fifth_place: { winnerRank: 5, loserRank: 6 },
        seventh_place: { winnerRank: 7, loserRank: 8 },
        ninth_place: { winnerRank: 9, loserRank: 10 },
        toilet_final: { winnerRank: 11, loserRank: 12 }
    }

    const placementGames = playoffMatchups.filter(
        (m) => m.placement_type && m.winner_team_id && m.loser_team_id
    )

    if (placementGames.length === 0) {
        alert(`No completed placement games for for ${season}`)
        return
    }

    let update = 0
    for (const game of placementGames) {
        const ranks = placementRankMap[game.placement_type]
        if(!ranks) continue

        const results = [
            { teamId: game.winner_team_id, rank: ranks.winnerRank },
            { teamId: game.loser_team_id, rank: ranks.loserRank }
        ]

        for (const r of results) {
            const { error } = await supabase
                .from("standings")
                .update({ final_rank: r.rank })
                .eq("team_id", r.teamId)
                .eq("season", season)
            if (error) console.error("Error setting final_rank:", error)
            else updated++
        }
    }

    alert(`Final rankings set for ${updated} teams in ${season}`)
}

passwordSubmit.addEventListener("click", () => {
    const inputValue = document.getElementById("passwordInput").value
    
    if (inputValue === "champs") {
        document.getElementById("passwordScreen").style.display = "none"
        adminDashboard.style.display = "block"

        populateSeasonDropdown()
        populateWeekDropdown()
        loadMatchups()

        document.getElementById("weekSelect").addEventListener("change", loadMatchups)
        document.getElementById("seasonSelect").addEventListener("change", loadMatchups)
        document.getElementById("submitScores").addEventListener("click", submitScores)
        document.getElementById("computeFinalRankings").addEventListener("click", computeFinalRankings)
        document.getElementById("generateBlurbInput").addEventListener("click", generateBlurbInput)
        document.getElementById("saveBlurb").addEventListener("click", saveBlurb)      
    } else {
       document.getElementById('errorMessage').textContent = "Incorrect Password"
    }
})

