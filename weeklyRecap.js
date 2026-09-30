import { renderNavbar } from "./src/components/navbar.js"
import { renderArchiveNav } from "./src/components/archiveNav.js"
import { getWeeklyRecap, getTopPerformersByPosition } from "./src/api/weeklyRecapsApi.js"
import { getWeeklyRecapFacts } from "./src/utils/weeklyRecapFacts.js"
import { formatBoxScoreLine } from "./src/utils/boxScoreFormat.js"
import { getCurrentSeasonSettings } from "./src/api/seasonSettingsApi.js"

const populateSeasonSelect = async () => {
    const select = document.getElementById("seasonJumpSelect")
    const settings = await getCurrentSeasonSettings()
    const RECAP_START_SEASON = 2026

    for (let year = settings.season; year >= RECAP_START_SEASON; year--) {
        const option = document.createElement("option")
        option.value = year
        option.textContent = year
        select.appendChild(option)
    }
}

const populateWeekSelect = () => {
    const select = document.getElementById("weekJumpSelect")
    for (let i = 1; i <= 17; i++) {
        const option = document.createElement("option")
        option.value = i
        option.textContent = `Week ${i}`
        select.appendChild(option)
    }
}

const loadRecap = async () => {
    const season = Number(document.getElementById("seasonJumpSelect").value)
    const week = Number(document.getElementById("weekJumpSelect").value)
    const container = document.getElementById("weeklyRecapContainer")

    const recap = await getWeeklyRecap(season, week)

    if (!recap) {
        container.innerHTML = `<p class="text-sm opacity-60">No Recap Published Yet for ${season} Week ${week}.</p>`
        return
    }

    container.innerHTML = `<h2 class="text-2xl font-bold">${recap.headline}</h2>`
}

const init = async () => {
    await renderNavbar()
    await renderArchiveNav("weeklyRecap")
    await populateSeasonSelect()
    populateWeekSelect() 

    document.getElementById("seasonJumpSelect").addEventListener("change", loadRecap)
    document.getElementById("weekJumpSelect").addEventListener("change", loadRecap)

    await loadRecap()
}

init()