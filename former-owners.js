import { renderNavbar } from "./src/components/navbar.js"
import { getOwners } from "./src/api/ownersApi.js"
import { getTeams } from "./src/api/teamsApi.js"
import { getAllTeamHistory } from "./src/api/teamsHistoryApi.js"
import { getStandings } from "./src/api/standingsApi.js"
import { renderTeamAwards } from "./src/components/teamAwardsDisplay.js"
import { renderHeadToHead } from "./src/components/headToHeadDisplay.js"

const round1 = (n) => Math.round(n * 10) / 10

const init = async () => {
    await renderNavbar()
    await loadFormerOwners()
}

const loadFormerOwners = async () => {
    const owners = await getOwners()
    const former = owners.filter((o) => o.current === false)

    const listContainer = document.getElementById("formerOwnersList")
    const detailContainer = document.getElementById("formerOwnerDetail")

    if (former.length === 0) {
        listContainer.innerHTML = `<p class="text-sm opacity-60">No former owners yet</p>`
        return
    }

    listContainer.innerHTML = former
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((o) => `
            <button class="w-full text-left card bg-base-100 shadow-md border border-base-300 rounded-xl mb-3 hover:border-primary transition" data-owner="${o.id}">
                <div class="card-body p-4">
                    <span class="font-semibold">${o.name}</span>
                </div>
            </button>
        `).join("")

    listContainer.querySelectorAll("[data-owner]").forEach((btn) => {
        btn.addEventListener("click", () => showOwnerDetail(btn.getAttribute("data-owner")))
    })

    document.getElementById("backToList").addEventListener("click", () => {
        detailContainer.style.display = "none"
        listContainer.style.display = "block"
        window.scrollTo(0, 0)
    })
}

const showOwnerDetail = async (ownerId) => {
    const listContainer = document.getElementById("formerOwnersList")
    const detailContainer = document.getElementById("formerOwnerDetail")

    listContainer.style.display = "none"
    detailContainer.style.display = "block"
    window.scrollTo(0, 0)

    await renderOwnerHeader(ownerId)
    await renderOwnerSeasons(ownerId)
    await renderTeamAwards(ownerId)
    await renderHeadToHead(ownerId)
}

const renderOwnerHeader = async (ownerId) => {
    const [owners, teamHistory, teams] = await Promise.all([
        getOwners(),
        getAllTeamHistory(),
        getTeams()
    ])

    const owner = owners.find((o) => o.id === ownerId)
    const eras = teamHistory.filter((h) => h.owner_id === ownerId)

    let wins = 0
    let losses = 0
    let titles = 0

    const seasonsByTeam = {}
    for (const era of eras) {
        const end = era.end_year == null ? new Date().getFullYear() : era.end_year
        for (let year = era.start_year; year <= end; year++) {
            if (!seasonsByTeam[year]) seasonsByTeam[year] = []
            seasonsByTeam[year].push(era.team_id)
        }
    }

    for (const year of Object.keys(seasonsByTeam).map(Number)) {
        const standings = await getStandings(year)
        standings.forEach((s) => {
            if (seasonsByTeam[year].includes(s.team_id)) {
                wins += s.win || 0
                losses += s.loss || 0
                if (s.final_rank === 1) titles += 1
            }
        })
    }

    const eraLine = eras
        .slice()
        .sort((a, b) => a.start_year - b.start_year)
        .map((era, i, arr) => {
            const sep = i < arr.length - 1 ? " •" : ""
            return `<span class="whitespace-nowrap">${era.name}${sep}</span>`
        })
        .join(" ")

    document.getElementById("ownerHeader").innerHTML = `
        <h2 class="text-2xl font-bold text-primary">${owner ? owner.name : "Unknown Owner"}</h2>
        <p class="text-sm opacity-70 mt-1">${wins}-${losses} all-time • ${titles} ${titles === 1 ? "title" : "titles"}</p>
        <p class="text-sm opacity-60 mt-1">${eraLine}</p>
    `
}

const renderOwnerSeasons = async (ownerId) => {
    const teamHistory = await getAllTeamHistory()
    const eras = teamHistory.filter((h) => h.owner_id === ownerId)

    const ownsTeamSeason = (teamId, season) => 
        eras.some((h) => 
            h.team_id === teamId &&
            season >= h.start_year &&
            (h.end_year == null || season <= h.end_year)
        )

    const seasonNameFor = (teamId, season) => {
        const h = eras.find((h) =>
            h.team_id === teamId &&
            season >= h.start_year &&
            (h.end_year == null || season <= h.end_year)
        )
        return h ? h.name : teamId
    }

    const getFinishLabel = (rank, lastRank) => {
        if (rank === 1) return `Champion`
        if (rank === lastRank) return `Toilet Bowl Champion`
        return `${rank}`
    }

    const years = [...new Set(
        eras.flatMap((era) => {
            const end = era.end_year == null ? new Date().getFullYear() : era.end_year
            const list = []
            for (let y = era.start_year; y <= end; y++) list.push(y)
            return list
        })
    )].sort((a, b) => b - a)

    const container = document.getElementById("teamHistoryContainer")
    container.innerHTML = ""

    for (const year of years) {
        const standings = await getStandings(year)
        const ranked = standings.filter((s) => s.final_rank != null)
        const lastRank = ranked.length ? Math.max(...ranked.map((s) => Number(s.final_rank))) : null 
        const row = standings.find((s) => ownsTeamSeason(s.team_id, year))
        if (!row) continue

        const rank = row.final_rank != null ? Number(row.final_rank) : null
        const finish = rank != null ? getFinishLabel(rank, lastRank) : "—"

        const div = document.createElement("div")
        div.innerHTML = `
            <div class="px-4 py-3 border-b border-base-300 last:border-0">
                <p class="text-xs uppercase tracking-wide text-primary font-bold">
                    Season ${year} • ${seasonNameFor(row.team_id, year)} • ${row.win}-${row.loss}
                </p>
                <h2 class="text-lg font-bold leading-tight">Final Place: ${finish}</h2>
                <p class="text-sm opacity-80">Points For: ${row.points_for} • Points Against: ${row.points_against}</p>
            </div>
        `
        container.appendChild(div)
    }
}

init()