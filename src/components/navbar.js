import { getTeams } from "../api/teamsApi.js";

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
        <a href="draftResults.html?team=${team.slug}"
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
      mobileLi.innerHTML = teamLink
      mobileDropdown.appendChild(mobileLi)
    }
  })
}