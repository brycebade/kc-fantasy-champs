import { renderNavbar } from "./src/components/navbar.js"
import { getTeams } from "./src/api/teamsApi.js"
import { getDraftSeasonsByTeam, getDraftResultsByTeamAndYear } from "./src/api/draftResultsApi.js"
import { getOwnerById } from "./src/api/ownersApi.js"
import { getRosterByTeam } from "./src/api/draftResultsApi.js"
import { getFAPickupsByTeam } from "./src/api/faPickupsApi.js"
import { getStandingsByTeam, getStandings } from "./src/api/standingsApi.js"
import { renderHeadToHead } from "./src/components/headToHeadDisplay.js"
import { renderTeamAwards } from "./src/components/teamAwardsDisplay.js"
import { getAllTeamHistory } from "./src/api/teamsHistoryApi.js"
import { getKeeperCost } from "./src/utils/keeperCost.js"

const params = new URLSearchParams(window.location.search)
const teamSlug = params.get("team")

if (!teamSlug) window.location.href = "index.html"

const init = async () => {
    await renderNavbar()
    await loadTeam()
}

const getFinishLabel = (rank, lastRank) => {
    if (rank === 1) return `Champion`
    if (rank === lastRank) return `Toilet Bowl Champion`
    return `${rank}`
}

const getFinishColor = (rank, lastRank) => {
    const base = "border border-base-300 border-l-[16px]"
    if (rank === 1) return `${base} border-l-[#D4AF37]`
    if (rank === 2) return `${base} border-l-[#C0C0C0]`
    if (rank === 3) return `${base} border-l-[#CD7F32]`
    if (rank === lastRank) return `${base} border-l-[#7B5E3B]`
    return `${base} border-l-base-300`
}

const loadTeam = async () => {
    const teams = await getTeams()
    const selectedTeam = teams.find(t => t.slug === teamSlug)
    const owner = await getOwnerById(selectedTeam.current_owner_id)

    if (!selectedTeam) {
        document.getElementById("team-name").textContent = "Team Not Found"
        return
    }

    document.title = `${selectedTeam.current_name} | KC Fantasy Champs`
    document.getElementById("team-name").textContent = selectedTeam.current_name
    document.getElementById("owner-name").textContent = owner.name
    
    const logo = document.getElementById("team-logo")
    if (logo) {
        logo.src = `./assets/logos/${selectedTeam.id}.png`
        logo.alt = `${selectedTeam.current_name} logo`
        logo.onerror = () => { logo.style.display = "none" }
    }

    await loadDraftHistory(selectedTeam)
    await loadRoster(selectedTeam)
    await loadTeamHistory(selectedTeam)
    await renderHeadToHead(selectedTeam.current_owner_id)
    await renderTeamAwards(selectedTeam.current_owner_id)
}

const loadDraftHistory = async (selectedTeam) => {
    const seasons = await getDraftSeasonsByTeam(selectedTeam.id)

    const select = document.getElementById("draftSeasonSelect")

    seasons.forEach(s => {
        const option = document.createElement("option")
        option.value = s.season
        option.textContent = s.season
        select.appendChild(option)
    })

    if (seasons.length > 0) {
        await loadDraftPicks(selectedTeam.id, seasons[0].season)
    }

    select.addEventListener("change", async () => {
        await loadDraftPicks(selectedTeam.id, select.value)
    })
}

const loadDraftPicks = async (teamId, season) => {
    const picks = await getDraftResultsByTeamAndYear(teamId, season)

    const container = document.getElementById("draftHistoryContainer")
    container.innerHTML = ""

    picks.forEach(pick => {
        const row = document.createElement("div")
        row.innerHTML = `
            <div class="px-4 py-2">
                <p class="text-xs uppercase tracking-wide text-primary font-bold">
                    Round ${pick.round} • Pick ${pick.pick} • Overall ${pick.overall}
                </p>
                <div class="flex items-center gap-3">
                    <span class="text-xs font-bold opacity-60 whitespace-nowrap">${pick.position}${pick.nfl_team ? " • " + pick.nfl_team : ""}</span>
                    <span class="font-semibold">${pick.player}</span>
                </div>
            </div>
        `
        container.appendChild(row)
    })
}

const loadRoster = async (selectedTeam) => {
    const draftPlayers = await getRosterByTeam(selectedTeam.id, 2025)
    const faPickups = await getFAPickupsByTeam(selectedTeam.id, 2025)
    const fullRoster = [...draftPlayers, ...faPickups]
    const positionOrder = ["QB", "RB", "WR", "TE", "DEF", "K"]

    fullRoster.sort((a, b) => {
        return positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position)
    })

    const container = document.getElementById("rosterContainer")
    container.innerHTML = ""

    fullRoster.forEach(roster => {
        const row = document.createElement("div")
        row.innerHTML = `
            <div class="flex items-center justify-between px-4 py-2">
                <div class="flex items-center gap-3">
                    <span class="text-xs font-bold text-primary whitespace-nowrap">${roster.position} ${roster.nfl_team ? "• " + roster.nfl_team : ""}</span>
                    <span class="font-semibold">${roster.player}</span>
                </div>
                    <span class="text-sm opacity-70">Keeper Cost: ${getKeeperCost(roster.round)}</span>
            </div>
        `
        container.appendChild(row)
    })
}

const loadTeamHistory = async (team) => {
    const standings = await getStandingsByTeam(team.id)
    const teamHistory = await getAllTeamHistory()

    const ownerId = team.current_owner_id
    const ownsSeason = (season) => 
        teamHistory.some((h) => 
            h.team_id === team.id &&
            h.owner_id === ownerId &&
            season >= h.start_year &&
            (h.end_year == null || season <= h.end_year)
        )
    
    const ownerStandings = standings.filter((s) => ownsSeason(s.season))

    const container = document.getElementById("teamHistoryContainer")
    container.innerHTML = ""

    if (ownerStandings.length === 0) {
        container.innerHTML = `<p class="px-4 py-3 text-sm opacity-70">No History Yet</p>`
        return
    }

    const sorted = ownerStandings.sort((a, b) => b.season - a.season)

        for (const standing of sorted) {
            const seasonStandings = await getStandings(standing.season)
            const ranked = seasonStandings.filter((s) => s.final_rank != null)
            const lastRank = ranked.length ? Math.max(...ranked.map((s) => Number(s.final_rank))) : null

            const row = document.createElement("div")
            row.innerHTML = `
                <div class="px-4 py-3 mb-2 rounded-lg bg-base-100 ${getFinishColor(standing.final_rank, lastRank)}">
                    <p class="text-xs uppercase tracking-wide text-primary font-bold">
                        Season ${standing.season} • Wins ${standing.win} • Losses ${standing.loss}
                    </p>
                    <h2 class="text-lg font-bold text-base-content leading-tight">
                        Final Place: ${getFinishLabel(standing.final_rank, lastRank)}
                    </h2>
                    <p class="text-sm opacity-80">
                        Points For: ${standing.points_for} • Points Against: ${standing.points_against}
                    </p>
                </div>
            `
            container.appendChild(row)
        }
}

init()