import { renderNavbar } from "./src/components/navbar.js";
import { getTeams } from "./src/api/teamsApi.js";
import { getDraftSeasonsByTeam, getDraftResultsByTeamAndYear } from "./src/api/draftResultsApi.js";
import { getOwnerById } from "./src/api/ownersApi.js";
import { getRosterByTeam } from "./src/api/draftResultsApi.js";
import { getFAPickupsByTeam } from "./src/api/faPickupsApi.js";
import { getStandingsByTeam } from "./src/api/standingsApi.js";

const params = new URLSearchParams(window.location.search)
const teamSlug = params.get("team")

if (!teamSlug) window.location.href = "index.html"

const init = async () => {
    await renderNavbar()
    await loadTeam()
}

const getKeeperCost = (player) => {
    if (!player.round) return `Round 10`
    if (player.round === 1) return `Not Keepable`
    return `Round ${player.round -1}`
}

const getFinishLabel = (rank) => {
    if (rank === 1) return `Champion`
    if (rank === 12) return `Toilet Bowl Champion`
    return `${rank}`
}

const getFinishColor = (rank) => {
    if (rank === 1) return "bg-[#D4AF37]"
    if (rank === 2) return "bg-[#C0C0C0]"
    if (rank === 3) return "bg-[#CD7F32] medal-text"
    if (rank === 12) return "bg-[#7B5E3B] medal-text"
    return ""
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

    await loadDraftHistory(selectedTeam)
    await loadRoster(selectedTeam)
    await loadTeamHistory(selectedTeam)
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
                    <span class="text-sm opacity-70">Keeper Cost: ${getKeeperCost(roster)}</span>
            </div>
        `
        container.appendChild(row)
    })
}

const loadTeamHistory = async (team) => {
    const standings = await getStandingsByTeam(team.id)

    const container = document.getElementById("teamHistoryContainer")
    container.innerHTML = ""

    standings.forEach((standing)  => {
        const row = document.createElement("div")
        row.innerHTML = `
            <div class="px-4 py-3 ${getFinishColor(standing.final_rank)}">
                <p class="text-xs uppercase tracking-wide text-primary font-bold">
                    Season ${standing.season} • Wins ${standing.win} • Losses ${standing.loss}
                </p>
                <h2 class="text-lg font-bold text-base-content leading-tight">
                    Final Place: ${getFinishLabel(standing.final_rank)}
                </h2>
                <p class="text-sm opacity-80">
                    Points For: ${standing.points_for} • Points Against: ${standing.points_against}
                </p>
            </div>
        `
        container.appendChild(row)
    })
}

init()