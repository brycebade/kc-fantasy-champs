import { getTeams } from "../api/teamsApi.js";
import { getMatchups } from "../api/matchupsApi.js"
import { getCurrentSeasonSettings } from "../api/seasonSettingsApi.js"
import { initTheme } from "../utils/themeManager.js"

export const renderTeamsDropdown = async () => {
  const desktopDropdown = document.getElementById("teamsDropdownDesktop")
  const mobileDropdown = document.getElementById("teamsDropdownMobile")

  if (!desktopDropdown && !mobileDropdown) return

  const teams = await getTeams()

  const currentTeams = teams
    .filter((team) => team.active === true)
    .sort((a, b) => {
      return (a.current_name || "").localeCompare(b.current_name || "")
    })

  if (desktopDropdown) {
    desktopDropdown.innerHTML = ""
  }

  if (mobileDropdown) {
    mobileDropdown.innerHTML = ""
  }

  currentTeams.forEach((team) => {
    const teamLink = `
        <a href="team.html?team=${team.slug}"
            style="whitespace-nowrap"
        >
            ${team.current_name}
        </a>
    `

    if (desktopDropdown) {
      const desktopLi = document.createElement("li")
      desktopLi.innerHTML = teamLink
      desktopDropdown.appendChild(desktopLi)
    }

    if (mobileDropdown) {
      const mobileLi = document.createElement("li")

      mobileLi.innerHTML = `
      <a 
        href="team.html?team=${team.slug}"
        class="text-sm"
        style="white-space: nowrap;">
        ${team.current_name}</a>
      `
      
      mobileDropdown.appendChild(mobileLi)
    }
  })
}

export const renderSchedulePreview = async () =>  {
  const preview = document.getElementById("schedulePreview")
  if(!preview) return

  const settings = await getCurrentSeasonSettings()
  if (!settings) return

  if (settings.phase === "offseason") {
    preview.innerHTML = `<p class="opacity-70">Schedule Coming Soon!</p>`
    return
  }

  const matchups = await getMatchups(settings.season)
  const weekMatchups = matchups.filter(matchups => matchups.week === settings.current_week)
  const teams = await getTeams()

  preview.innerHTML = `<p class="font-bold mb-2">Week ${settings.current_week}</p>`

  weekMatchups.forEach(matchup => {
    const team1 = teams.find(t => t.id === matchup.team_1_id)
    const team2 = teams.find(t => t.id === matchup.team_2_id)

    const row = document.createElement("div")
    row.innerHTML = `<p>${team1?.current_name || "TBD"} vs ${team2?.current_name || "TBD"}</p>`
    preview.appendChild(row)
  })
}

export const renderNavbar = async () => {
  initTheme()
  
  const isHomePage = window.location.pathname === '/' || window.location.pathname.includes('index.html')

  const navbarContainer = document.getElementById("navbar")

  if (!navbarContainer) return

  navbarContainer.innerHTML = `
    <div class="navbar bg-primary px-4 py-2 shadow-md overflow-visible">

        <div class="flex-1 flex items-center gap-2 min-w-0">
            <img 
                src="./assets/kc-fantasy-champs-transparentbg-logo.png" 
                alt="KC Fantasy Champs Logo"
                class="object-contain shrink-0 logo-outline"
                style="width: 40px; height: 40px;"
                >
            <a class="text-sm md:text-2xl font-bold tracking-wide leading-tight truncate text-white" href="index.html">KC Fantasy Champs</a>
        </div>

        <div class="desktop-nav flex-none ">
            <ul class="menu menu-horizontal px-1">

              <li>${
                isHomePage
                  ? `
                  <details name="desktop-navbar-dropdown">
                    <summary class="text-white">Standings</summary>
                    <div class="absolute right-0 top-full mt-2 w-80 rounded-box bg-base-100 p-4 shadow z-[9999]">
                      <div id="standingsPreview" class="space-y-2 text-sm"></div>
                      <a href="standings.html" class="btn btn-primary btn-sm mt-4 w-full">Full Standings</a>
                    </div>
                  </details>`
                  : `<a href="standings.html" class="text-white">Standings</a>`
              }
              </li>

              <li class="relative">
                <details name="desktop-navbar-dropdown">
                  <summary class="text-white">Schedule</summary>
                  <div class="absolute right-0 top-full mt-2 w-80 rounded-box bg-base-100 p-4 shadow z-[9999]">
                    <div id="schedulePreview" class="space-y-2 text-sm"></div>
                    <a href="schedule.html?view=full" class="btn btn-primary btn-sm mt-4 w-full">Full Fantasy Schedule</a>
                    <a href="nfl-schedule.html" class="btn btn-primary btn-sm mt-2 w-full">Full NFL Schedule</a>
                  </div>
                </details>
              </li>

              <li class="relative">
                <details name="desktop-navbar-dropdown">
                  <summary class="text-white">Teams</summary>                   
                    <ul id="teamsDropdownDesktop"
                        class="absolute right-0 top-full mt-2 menu bg-base-100 rounded-box p-2 shadow z-[9999]"
                        style="width: max-content; min-width: 14rem;">
                    </ul>
                </details>
              </li>

              <li class="relative">
                <details name="desktop-navbar-dropdown">
                  <summary class="text-white">More</summary>
                  <ul class="absolute right-0 top-full mt-2 menu bg-base-100 rounded-box p-2 shadow z-[9999]"
                      style="width: max-content; min-width: 14rem;">
                      <li><a href="history.html">League History</a></li>
                      <li><a href="powerRankings.html">Power Rankings</a></li>
                      <li><a href="awards.html">Awards</a></li>
                  </ul>
                </details>
              </li>

            </ul>
        </div>

        <div class="mobile-nav flex-none dropdown dropdown-end">
            <button tabindex="0" class="btn btn-ghost btn-square">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box w-56 p-2 shadow z-50">
              <li><a href="standings.html">Standings</a></li>
              <li>
                <details>
                  <summary>Schedule</summary>
                  <ul class="pl-4">
                    <li><a href="schedule.html" id="currentWeekLinkMobile">Current Week</a></li>
                    <li><a href="schedule.html?view=full">Full Fantasy Schedule</a></li>
                    <li><a href="nfl-schedule.html">Full NFL Schedule</a></li>
                  </ul>
                </details>
              </li>
              <li>
                <details>
                  <summary>Teams</summary>
                  <ul id="teamsDropdownMobile" class="pl-4"></ul>
                </details>
              </li>
                <li>
                  <details>
                    <summary>More</summary>
                    <ul class="pl-4">
                      <li><a href="history.html">History</a></li>
                      <li><a href="powerRankings.html">Power Rankings</a></li>
                      <li><a href="awards.html">Awards</a></li>
                    </ul>
                  </details>
                </li>
            </ul>
        </div>

    </div>
  `;

  await renderSchedulePreview()
  await renderTeamsDropdown()
}