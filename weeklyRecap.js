import { renderNavbar } from "./src/components/navbar.js"
import { renderArchiveNav } from "./src/components/archiveNav.js"
import { getWeeklyRecap, getTopPerformersByPosition } from "./src/api/weeklyRecapsApi.js"
import { getWeeklyRecapFacts } from "./src/utils/weeklyRecapFacts.js"
import { formatBoxScoreLine } from "./src/utils/boxScoreFormat.js"
import { getCurrentSeasonSettings } from "./src/api/seasonSettingsApi.js"
import { getTeams } from "./src/api/teamsApi.js"

const CATEGORY_LABELS = ["Passing", "Rushing", "Receiving", "Defense", "Kicking"]
const POSITION_DISPLAY_ORDER = ["QB", "RB", "WR", "TE", "K", "DEF"]

const renderTopPerformers = (topByPosition, teams) => {
    const nameFor = (teamId) => teams.find((t) => t.id === teamId)?.current_name || teamId

    const cards = POSITION_DISPLAY_ORDER
        .filter((pos) => topByPosition[pos])
        .map((pos) => {
            const row = topByPosition[pos]
            const line = formatBoxScoreLine({ ...row.raw_stats, position: row.position })

            return `
                <div class="card bg-base-100 shadow-md border border-base-300 rounded-xl p-4">
                    <p class="text-xs uppercase tracking-wide opacity-60">${pos}</p>
                    <p class="font-bold text-primary">${row.player_name}</p>
                    <p class="text-xs opacity-70 mb-2">${nameFor(row.team_id)}</p>
                    <p class="text-sm">${line}</p>
                    <p class="font-bold text-lg mt-1">${row.fantasy_points} pts</p>
                </div>
            `
        }).join("")

        if (cards === "") return ""

        return `
            <h3 class="text-xl font-bold text-primary mb-3">Top Performers</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                ${cards}
            </div>
        `
}

const formatBoxScoreEntries = (stat, totalPoints, position) => {
    const entries = []

    if (position !== "DEF") {
        const completions = Number(stat.completions) || 0
        const attempts = Number(stat.attempts) || 0
        if (attempts > 0) {
            const passYds = Number(stat.passing_yards) || 0
            const passTds = Number(stat.passing_tds) || 0
            const ints = Number(stat.passing_interceptions) || 0
            const passPoints = passYds / 25 + passTds * 4 + ints * -2 + (Number(stat.passing_2pt_conversions) || 0) * 2
            entries.push({
                category: "Passing",
                line: `${completions}/${attempts}, ${passYds} yds, ${passTds} TD, ${ints} INT`,
                points: Math.round(passPoints * 100) / 100
            })
        }

        const carries = Number(stat.carries) || 0
        if (carries > 0) {
            const rushYds = Number(stat.rushing_yards) || 0
            const rushTds = Number(stat.rushing_tds) || 0
            const rushAvg = (rushYds / carries).toFixed(1)
            const rushPoints = rushYds / 10 + rushTds * 6 + (Number(stat.rushing_fumbles_lost) || 0) * -2 + (Number(stat.rushing_2pt_conversions) || 0) * 2
            entries.push({
                category: "Rushing",
                line: `${carries} car, ${rushYds} yds, (${rushAvg} avg), ${rushTds} TD`,
                points: Math.round(rushPoints * 100) / 100
            })
        }

        const targets = Number(stat.targets) || 0
        if (targets > 0) {
            const recYds = Number(stat.receiving_yards) || 0
            const recTds = Number(stat.receiving_tds) || 0
            const receptions = Number(stat.receptions) || 0
            const recPoints = receptions * 1 + recYds / 10 + recTds * 6 + (Number(stat.receiving_fumbles_lost) || 0) * -2 + (Number(stat.receiving_2pt_conversions) || 0) * 2
            entries.push({
                category: "Receiving",
                line: `${receptions}/${targets} rec, ${recYds} yds, ${recTds} TD`,
                points: Math.round(recPoints * 100) / 100
            })
        }
    }

    if (position === "K") {
        const fgMade = stat.fg_made || 0
        const fgAtt = stat.fg_att || 0
        const long = stat.fg_long || 0
        const patMade = stat.pat_made || 0
        const patAtt = stat.pat_att || 0
        entries.push({
            category: "Kicking",
            line: `${fgMade}/${fgAtt} FG (long ${long}), ${patMade}/${patAtt} PAT`,
            points: totalPoints
        })
    }

    if (position === "DEF") {
        const sacks = Number(stat.def_sacks) || 0
        const ints = Number(stat.def_interceptions) || 0
        const fumRec = Number(stat.fumble_recovery_opp) || 0
        const defTd = Number(stat.def_tds) || 0
        const stTd = Number(stat.special_teams_tds) || 0
        entries.push({
            category: "Defense",
            line: `${sacks} sacks, ${ints} INT, ${fumRec} FR, ${defTd + stTd} TD`,
            points: totalPoints
        })
    }

    return entries
}

const renderTeamBoxScores = (starters) => {
    const allEntries = starters.flatMap((s) => 
        formatBoxScoreEntries(s.raw_stats, s.points, s.position).map((entry) => ({ ...entry, name: s.name }))
    )

    return CATEGORY_LABELS.map((category) => {
        const entries = allEntries.filter((e) => e.category === category)
        if (entries.length === 0) return ""

        return `
            <p class="font-bold underline text-sm uppercase mt-4 mb-1">${category}</p>
            ${entries.map((e) => `
                <div class="flex justify-between items-start gap-2 mb-1">
                    <span>
                        <span class="font-semibold">${e.name}</span>
                        <span class="opacity-60">${e.line}</span>
                    </span>
                    <span class="font-bold text-primary whitespace-nowrap">${e.points} pts</span>
                </div>
            `).join("")}
        `
    }).join("")
}

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
                    Game ${i + 1}: ${m.team1Name} ${m.team1Score} vs ${m.team2Name} ${m.team2Score}
                </div>
                <div class="collapse-content">
                    <div class="grid md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <p class="font-bold text-primary text-base">${m.team1Name}</p>
                            ${renderTeamBoxScores(m.team1Starters)}
                        </div>
                        <div>
                            <p class="font-bold text-primary text-base">${m.team2Name}</p>
                            ${renderTeamBoxScores(m.team2Starters)}
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

    const [matchupFacts, topByPosition, teams] = await Promise.all([
        getWeeklyRecapFacts(season, week),
        getTopPerformersByPosition(season, week),
        getTeams()
    ])
        

    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-4">${recap.headline}</h2>
        <div class="card bg-base-100 shadow-md border border-base-300 rounded-xl">
            <div class="card-body p-6">
                ${renderArticleBody(recap.article_body)}
            </div>
        </div>
        ${renderTopPerformers(topByPosition, teams)}
        <h3 class="text-xl font-bold text-primary mb-3">Box Scores</h3>
        ${renderBoxScores(matchupFacts)}
    `
}

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