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
    weekSection.innerHTML = `
        <div class="bg-base-200 px-4 py-2 border-y border-base-300">
            <h2 class="text-sm font-bold uppercase trcking-wide text-primary">Week ${weekNumber}</h2>
        </div>
    `

    const rowsWrapper = document.createElement("div")
    rowsWrapper.className = "divide-y divide-base-300"

    weekMatchups.forEach(matchup => {
        const team1 = teams.find(t => t.id === matchup.team_1_id)
        const team2 = teams.find(t => t.id === matchup.team_2_id)

        const hasScores = matchup.team_1_score !== null && matchup.team_2_score !== null

        const row = document.createElement("div")
        row.className = "flex justify-between items-center px-4 py-3"
        row.innerHTML = `
            <span class="font-semibold flex-1">${team1?.current_name || "TBD"}</span>
            <span class="font-bold text-primary px-4">${hasScores ? `${matchup.team_1_score} - ${matchup.team_2_score}` : "vs"}</span>
            <span class="font-semibold flex-1 text-right">${team2?.current_name || "TBD"}</span>
            </div>
        `
        rowsWrapper.appendChild(row)
    })

    weekSection.appendChild(rowsWrapper)
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