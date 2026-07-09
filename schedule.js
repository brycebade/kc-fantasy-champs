import { renderNavbar } from "./src/components/navbar.js"
import { getCurrentSeason, getMatchups } from "./src/api/matchupsApi.js"
import { getTeams } from "./src/api/teamsApi.js"
import { getCurrentSeasonSettings } from "./src/api/seasonSettingsApi.js"

const init = async () => {
    await renderNavbar()
    await loadSchedule()
}

const renderWeek = (weekNumber, matchups, teams, container) => {
    container.innerHTML = ""

    const weekMatchups = matchups.filter(m => m.week === weekNumber)

    weekMatchups.forEach(matchup => {
        const team1 = teams.find(t => t.id === matchup.team_1_id)
        const team2 = teams.find(t => t.id === matchup.team_2_id)

        const hasScores = matchup.team_1_score !== null && matchup.team_2_score !== null

        const row = document.createElement("div")
        row.className = "card bg-base-100 border border-base-300 shadow-sm mb-3 p-4 rounded-xl flex flex-row justify-between items-center"
        row.innerHTML = `
            <span class="font-semibold flex-1">${team1?.current_name || "TBD"}</span>
            <span class="font-bold text-primary px-4">${hasScores ? `${matchup.team_1_score} - ${matchup.team_2_score}` : "vs"}</span>
            <span class="font-semibold flex-1 text-right">${team2?.current_name || "TBD"}</span>
        `
        container.appendChild(row)
    })
}

const loadSchedule = async () => {
    const settings = await getCurrentSeasonSettings()
    const matchups = await getMatchups(settings.season)
    const teams = await getTeams()

    const container = document.getElementById("scheduleContainer")
    const weekSelect = document.getElementById("fantasyWeekSelect")

    const currentWeek = settings.current_week || 1
    const maxWeek = Math.max(...matchups.map(m => m.week))

    weekSelect.innerHTML = Array.from({ length: maxWeek }, (_, i) => i + 1)
        .map(w => `<option value="${w}" ${w === currentWeek ? "selected" : ""}>Week ${w}</option>`)
        .join("")

    renderWeek(currentWeek, matchups, teams, container)

    weekSelect.addEventListener("change", (e) => {
        renderWeek(Number(e.target.value), matchups, teams, container)
    })
}


    init()