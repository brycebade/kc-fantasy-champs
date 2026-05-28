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
            <div class="card bg-base-100 border border-base-300 shadow-sm mb-2">
                <div class="card-body p-4">
                    <p class="text-xs uppercase tracking-wide text-primary font-bold">
                        Round ${pick.round} • Pick ${pick.pick} • Overall ${pick.overall}
                    </p>
                    <h2 class="text-lg font-bold text-base-content leading-tight">
                        ${pick.player}
                    </h2>
                    <p class="text-sm opacity-80">
                        ${pick.position} • ${pick.nfl_team}
                    </p>
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

    const container = document.getElementById("rosterContainer")
    container.innerHTML = ""

    fullRoster.forEach(roster => {
        const row = document.createElement("div")
        getKeeperCost(roster)
        row.innerHTML = `
            <div class="card bg-base-100 border border-base-300 shadow-sm mb-2">
                <div class="card-body p-4">
                    <p class="text-xs uppercase tracking-wide text-primary font-bold">
                        ${roster.position} • ${roster.nfl_team}
                    </p>
                    <h2 class="text-lg font-bold text-base-content leading-tight">
                        ${roster.player}
                    </h2>
                    <p class="text-sm opacity-60">
                        Keeper Cost: ${getKeeperCost(roster)}
                    </p>
                </div>
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
            <div class="card bg-base-100 border border-base-300 shadow-sm mb-2">
                <div class="card-body p-4">
                    <p class="text-xs uppercase tracking-wide text-primary font-bold">
                        Season ${standing.season} • Wins ${standing.win} • Losses ${standing.loss}
                    </p>
                    <h2 class="text-lg font-bold text-base-content leading-tight">
                        Final Place: ${standing.final_rank}
                    </h2>
                    <p class="text-sm opacity-80">
                        Points For: ${standing.points_for} • Points Against: ${standing.points_against}
                    </p>
                </div>
            </div>
        `
        container.appendChild(row)
    })
}

init()