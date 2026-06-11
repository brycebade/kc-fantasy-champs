import { renderNavbar } from "./src/components/navbar.js"
import { getCurrentSeason, getMatchups } from "./src/api/matchupsApi.js"
import { getTeams } from "./src/api/teamsApi.js"
import { getCurrentSeasonSettings } from "./src/api/seasonSettingsApi.js"

const params = new URLSearchParams(window.location.search)
const view = params.get("view")

const init = async () => {
    await renderNavbar()
    await loadSchedule()
}

const renderWeek = (weekNumber, matchups, teams, container) => {
    const weekMatchups = matchups.filter(m => m.week === weekNumber)

    const weekSection = document.createElement("div")
    weekSection.className = "mb-6"
    weekSection.innerHTML = `<h2 class="text-xl font-bold text-primary mb-3">Week${weekNumber}</h2>`

    weekMatchups.forEach(matchup => {
        const team1 = teams.find(t => t.id === matchup.team_1_id)
        const team2 = teams.find(t => t.id === matchup.team_2_id)

        const hasScores = matchup.team_1_score !== null && matchup.team_2_score !== null

        const row = document.createElement("div")
        row.className = "card bg-base-100 border border-base-300 shadow-sm mb-2 p-3"
        row.innerHTML = `
            <div class="flex justify-between items-center">
                <span>${team1?.current_name || "TBD"}</span>
                <span class="font-bold">${hasScores ? `${matchup.team_1_score} - ${matchup.team_2_score}` : "vs"}</span>
                <span>${team2?.current_name || "TBD"}</span>
            </div>
        `
        weekSection.appendChild(row)
    })

    container.appendChild(weekSection)
}

const loadSchedule = async () => {
    const settings = await getCurrentSeasonSettings()
    const matchups = await getMatchups(settings.season)
    const teams = await getTeams()

    const container = document.getElementById("scheduleContainer")
    container.innerHTML = ""

    if (view === "full") {
        for (let week = 1; week <= 14; week++) {
            renderWeek(week, matchups, teams, container)
        } 
    } else {
            const currentWeek = settings.current_week || 1
            renderWeek(currentWeek, matchups, teams, container)
        }
    }

    init()