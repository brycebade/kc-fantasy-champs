import { supabase } from "./src/supabaseClient.js"
import { getTeams } from "./src/api/teamsApi.js"
import { getMatchups, getCurrentSeason, getPlayoffMatchups } from "./src/api/matchupsApi.js"
import { getPowerRankingsBlurbInput } from "./src/pages/powerRankings.js"
import { savePowerRankingNote } from "./src/api/powerRankingsNotesApi.js"
import { getCurrentSeasonSettings } from "./src/api/seasonSettingsApi.js"
import { getStandings } from "./src/api/standingsApi.js"
import { getAllTeamHistory } from "./src/api/teamsHistoryApi.js"

const passwordSubmit = document.getElementById("passwordSubmit")
const adminDashboard = document.getElementById("adminDashboard")

const setupTabs = () => {
    const tabs = document.querySelectorAll("[data-tab]")
    const panels = document.querySelectorAll("[data-panel]")

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const target = tab.getAttribute("data-tab")

            tabs.forEach((t) => t.classList.remove("table-active"))
            tab.classList.add("tab-active")

            panels.forEach((p) => {
                p.style.display = p.getAttribute("data-panel") === target ? "block" : "none"
            })
        })
    })
}

const generateBlurbInput = async () => {
    const inputBox = document.getElementById("blurbInput")
    inputBox.value = "Generating..."
    inputBox.value = await getPowerRankingsBlurbInput()
}

const saveBlurb = async () => {
    const settings = await getCurrentSeasonSettings()
    const note = document.getElementById("blurbOutput").value

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

const populateGameTeams = async () => {
    const season = Number(document.getElementById("seasonSelect").value)
    const teamHistory = await getAllTeamHistory()

    const seasonTeams = teamHistory.filter((h) => 
        season >= h.start_year && (h.end_year == null || season <= h.end_year)
    )

    const options = seasonTeams
        .map((h) => `<option value="${h.team_id}">${h.name}</option>`)
        .join("")

    document.getElementById("addGameTeam1").innerHTML = options
    document.getElementById("addGameTeam2").innerHTML = options
}

const togglePlayoffFields = () => {
    const type = document.getElementById("addGameType").value
    document.getElementById("playoffFields").style.display = type === "playoff" ? "block" : "none"
}

const addGame = async () => {
    const season = Number(document.getElementById("seasonSelect").value)
    const week = Number(document.getElementById("weekSelect").value)
    const type = document.getElementById("addGameType").value
    const isPlayoff = type === "playoff"
    const bracketType = isPlayoff ? document.getElementById("addGameBracket").value : null
    const playoffRound = isPlayoff ? document.getElementById("addGameRound").value : null
    const placementValue = isPlayoff ? document.getElementById("addGamePlacement").value : ""
    const placementType = placementValue === "" ? null : placementValue
    const team1 = document.getElementById("addGameTeam1").value
    const team2 = document.getElementById("addGameTeam2").value
    const score1 = Number(document.getElementById("addGameScore1").value)
    const score2 = Number(document.getElementById("addGameScore2").value)


    if (team1 === team2) {
        alert("Pick two different teams")
        return
    }

    const isTie = score1 === score2
    const winnerId = isTie ? null : (score1 > score2 ? team1 : team2)
    const loserId = isTie ? null : (score1 > score2 ? team2 : team1)
    const id = `${season}_week${week}_${team1}v${team2}`

    const  { error } = await supabase
        .from("matchups")
        .insert({
            id,
            season,
            week,
            team_1_id: team1,
            team_2_id: team2,
            team_1_score: score1,
            team_2_score: score2,
            winner_team_id: winnerId,
            loser_team_id: loserId,
            is_tie: isTie,
            matchup_type: type,
            bracket_type: bracketType,
            playoff_round: playoffRound,
            placement_type: placementType
        })

    if (error) {
        console.error("Error adding game:", error)
        alert("Error adding game(this matchup id may already exist)")
        return
    }

    await recalculateStandings(season)
    alert(`Added ${season} Week ${week} game`)
    loadMatchups()
}

const loadMatchups = async () => {
    const season = Number(document.getElementById("seasonSelect").value)
    const week = Number(document.getElementById("weekSelect").value)
    const submitButton = document.getElementById("submitScores")
    const currentSeason = await getCurrentSeason()

    const allMatchups = await getMatchups(season)
    const weekMatchups = allMatchups.filter(m => m.week === week)

    const teams = await getTeams()
    const teamHistory = await getAllTeamHistory()

    const nameFor = (teamId) => {
        const h = teamHistory.find((h) => 
            h.team_id === teamId &&
            season >= h.start_year && (h.end_year == null || season <= h.end_year)
        )
        if (h) return h.name
        const t = teams.find((t) => t.id === teamId)
        return t?.current_name || "TBD"
    }

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
                <span class="font-semibold flex-1">${nameFor(matchup.team_1_id)}</span>
                <input type="number" id="score1_${matchup.id}" value="${matchup.team_1_score ?? ""}" class="input w-24 text-center shrink-0 border border-base-300 bg-base-200 rounded-xl">
            </div>
            <div class="flex items-center justify-between gap-3">
                <span class="font-semibold flex-1">${nameFor(matchup.team_2_id)}</span>
                <input type="number" id="score2_${matchup.id}" value="${matchup.team_2_score ?? ""}" class="input w-24 text-center shrink-0 border border-base-300 bg-base-200 rounded-xl">
            </div>
            <button class="btn btn-xs btn-secondary mt-2" data-save="${matchup.id}">Save this game</button>
        `
        container.appendChild(row)
    })

    container.querySelectorAll("[data-save]").forEach((btn) => {
        btn.addEventListener("click", () => saveSingleGame(btn.getAttribute("data-save")))
    })

    if (season < currentSeason) {
        submitButton.style.display = "none"
    } else {
        submitButton.style.display = "block"
    }   
}

const saveSingleGame = async (matchupId) => {
    const season = Number(document.getElementById("seasonSelect").value)
    const score1 = Number(document.getElementById(`score1_${matchupId}`).value)
    const score2 = Number(document.getElementById(`score2_${matchupId}`).value)

    const allMatchups = await getMatchups(season)
    const matchup = allMatchups.find((m) => m.id === matchupId)
    if (!matchup) return

    const isTie = score1 === score2
    const winnerId = isTie ? null : (score1 > score2 ? matchup.team_1_id : matchup.team_2_id)
    const loserId = isTie ? null : (score1 > score2 ? matchup.team_2_id : matchup.team_1_id)

    const { error } = await supabase
        .from("matchups")
        .update({ team_1_score: score1, team_2_score: score2, winner_team_id: winnerId, loser_team_id: loserId, is_tie: isTie })
        .eq("id", matchupId)

    if (error) {
        console.error("Error saving game:", error)
        alert("Error saving game")
        return
    }

    await recalculateStandings(season)
    alert("Game Saved")
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

    await recalculateStandings(season)
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

    for (const teams of teams) {
        const teamMatchups = completedMatchups.filter(m => 
            m.team_1_id === team.id || m.team_2_id === team.id  
        )

        if (teamMatchups.length === 0) continue

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

        pointsFor = Math.round(pointsFor * 100) / 100
        pointsAgainst = Math.round(pointsAgainst * 100) / 100

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
    }
}

const computeFinalRankings = async () => {
    const season = Number(document.getElementById("seasonSelect").value)
    const playoffMatchups = await getPlayoffMatchups(season)
    const standings = await getStandings(season)
    const teamCount = standings.length

    const placementRankMap = {
        championship_final: { winnerRank: 1, loserRank: 2 },
        third_place: { winnerRank: 3, loserRank: 4 },
        fifth_place: { winnerRank: 5, loserRank: 6 },
        seventh_place: { winnerRank: 7, loserRank: 8 },
        ninth_place: { winnerRank: 9, loserRank: 10 },
        toilet_final: { winnerRank: teamCount - 1, loserRank: teamCount }
    }

    const placementGames = playoffMatchups.filter(
        (m) => m.placement_type && m.winner_team_id && m.loser_team_id
    )

    if (placementGames.length === 0) {
        alert(`No completed placement games for ${season}`)
        return
    }

    let updated = 0
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

const loadFinalRankings = async () => {
    const season = Number(document.getElementById("seasonSelect").value)
    const standings = await getStandings(season)
    const teams = await getTeams()
    const container = document.getElementById("finalRankingsContainer")
    const saveButton = document.getElementById("saveFinalRankings")

    if (standings.length === 0) {
        container.innerHTML = `<p class="text-sm opacity-60">No Standings for ${season}. Sumbit scores first.</p>`
        saveButton.style.display = "none"
        return
    }

    const nameFor = (id) => {
        const t = teams.find((t) => t.id === id)
        return t?.current_name || t?.team_name || t?.name || id
    }

    container.innerHTML = standings
        .sort((a, b) => (a.final_rank || 99) - (b.final_rank || 99))
        .map((s) => `
            <div class="flex items-center justify-between gap-3 mb-2">
                <span class="font-semibold flex-1">${nameFor(s.team_id)}</span>
                <input type="number" min="1" id="finalRank_${s.team_id}" value="${s.final_rank ?? ""}"
                    class="input w-20 text-center border border-base-300 bg-base-200" data-team="${s.team_id}">
            </div>
        `).join("")

    saveButton.style.display = "block"
}

const saveFinalRankings = async () => {
    const season = Number(document.getElementById("seasonSelect").value)
    const inputs = document.querySelectorAll("#finalRankingsContainer input[data-team]")

    let saved = 0
    for (const input of inputs) {
        const teamId = input.getAttribute("data-team")
        const rank = input.value === "" ? null : Number(input.value)

        const { error } = await supabase
            .from("standings")
            .update({ final_rank: rank})
            .eq("team_id", teamId)
            .eq("season", season)
        if (error) console.error("Error saving final_rank:", error)
        else saved++
    }

    alert(`Saved final rankings for ${saved} teams in ${season}`)
}

passwordSubmit.addEventListener("click", () => {
    const inputValue = document.getElementById("passwordInput").value
    
    if (inputValue === "champs") {
        document.getElementById("passwordScreen").style.display = "none"
        adminDashboard.style.display = "block"

        setupTabs()

        populateSeasonDropdown()
        populateWeekDropdown()
        populateGameTeams()
        loadMatchups()

        document.getElementById("weekSelect").addEventListener("change", loadMatchups)
        document.getElementById("seasonSelect").addEventListener("change", loadMatchups)
        document.getElementById("seasonSelect").addEventListener("change", populateGameTeams)
        document.getElementById("addGameType").addEventListener("change", togglePlayoffFields)
        document.getElementById("addGame").addEventListener("click", addGame)
        document.getElementById("submitScores").addEventListener("click", submitScores)
        document.getElementById("computeFinalRankings").addEventListener("click", computeFinalRankings)
        document.getElementById("generateBlurbInput").addEventListener("click", generateBlurbInput)
        document.getElementById("loadFinalRankings").addEventListener("click", loadFinalRankings)
        document.getElementById("saveFinalRankings").addEventListener("click", saveFinalRankings)
        document.getElementById("saveBlurb").addEventListener("click", saveBlurb)      
    } else {
       document.getElementById('errorMessage').textContent = "Incorrect Password"
    }
})

