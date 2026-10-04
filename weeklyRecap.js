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

const applyUrlParams = () => {
    const params = new URLSearchParams(window.location.search)
    const urlSeason = params.get("season")
    const urlWeek = params.get("week")

    if (urlSeason) document.getElementById("seasonJumpSelect").value = urlSeason
    if (urlWeek) document.getElementById("weekJumpSelect").value = urlWeek
}

const renderBoxScores = (matchupFacts) => {
    return matchupFacts.map((m, i) => {
        const result = m.isTie ? "Tie" : `${m.winner} won`

        return `
            <div class="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl mb-3">
                <input type="checkbox" />
                <div class="collapse-title font-semibold">
                    Game ${i + 1}: ${m.team1Name} ${m.team1Score} vs ${m.team2Name} ${m.team2Score} (${result})
                <div>
                <div class="collapse-content">
                    <div class="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="font-bold text-primary mb-1">${m.team1Name}</p>
                            ${m.team1Starters.map((s) => `<p class="mb-1">[${s.gameWindow}] ${s.name} (${s.position}): ${s.points} pts - ${s.line}</p>`).join("")}
                        </div>
                        <div>
                            <p class="font-bold text-primary mb-1">${m.team2Name}</p>
                            ${m.team2Starters.map((s) => `<p class="mb-1">[${s.gameWindow}] ${s.name} (${s.position}): ${s.points} pts - ${s.line}</p>`).join("")}
                        </div>
                    </div>
                </div>
            </div>
        `
    }).join("")
}

const renderArticleBody = (articleBody) => {
    const [recapText, awardsText] = articleBody.split("===AWARDS===")

    const recapHtml = recapText.trim().split("\n").map((line) => {
        const trimmed = line.trim()
        if (trimmed === "###GAMEOFTHEWEEK###") {
            return `<p class="text-center text-primary font-bold uppercase tracking-wide text-xl mt-6">Game of the Week</p>`
        }
        if (trimmed.startsWith("## ")) {
            return `<h3 class="text-sm font-bold text-primary mt-6 mb-2">${trimmed.slice(3)}</h3>`
        }
        if (trimmed === "") return ""
        return `<p class="mb-3">${trimmed}</p>`
    }).join("")

    let awardsHtml = ""
    if (awardsText) {
        const awardsLines = awardsText.trim().split("\n").filter((l) => l.trim() !== "")
        awardsHtml = `
            <div class="divider divider-primary text-xl font-bold uppercase tracking-wide text-primary">Week Awards</div>
            <div class="space-y-3">
                ${awardsLines.map((line) => {
                    const trimmed = line.trim()
                    if (trimmed.includes("##")) {
                        const clean = trimmed.replace(/##/g, "").trim()
                        return `<p class="font-bold underline text-sm text-primary mt-4">${clean}</p>`
                    }
                    return `<p>${trimmed}</p>`
                }).join("")}
            </div>
        `
    }

    return recapHtml + awardsHtml 
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

    const matchupFacts = await getWeeklyRecapFacts(season, week)

    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-4">${recap.headline}</h2>
        <div class="card bg-base-100 shadow-md border border-base-300 rounded-xl">
            <div class="card-body p-6">
                ${renderArticleBody(recap.article_body)}
            </div>
        </div>
        <h3 class="text-xl font-bold text-primary mb-3">Box Scores</h3>
        ${renderBoxScores(matchupFacts)}
    `
}
``
const init = async () => {
    await renderNavbar()
    await renderArchiveNav("weeklyRecap")
    await populateSeasonSelect()
    populateWeekSelect()
    applyUrlParams()

    document.getElementById("seasonJumpSelect").addEventListener("change", loadRecap)
    document.getElementById("weekJumpSelect").addEventListener("change", loadRecap)

    await loadRecap()
}

init()