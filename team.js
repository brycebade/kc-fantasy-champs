import { renderNavbar } from "./src/components/navbar.js";
import { getTeams } from "./src/api/teamsApi.js";
import { getDraftSeasonsByTeam, getDraftResultsByTeamAndYear } from "./src/api/draftResultsApi.js";
import { getOwnerById } from "./src/api/ownersApi.js";

const params = new URLSearchParams(window.location.search)
const teamSlug = params.get("team")

if (!teamSlug) window.location.href = "index.html"

const init = async () => {
    await renderNavbar()
    await loadTeam()
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

init()