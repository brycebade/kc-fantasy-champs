import { renderNavbar } from "./src/components/navbar.js"
import { renderLeagueHistory } from "./src/pages/history.js"
import { renderArchiveNav } from "./src/components/archiveNav.js"

const init = async () => {
    await renderNavbar()
    await renderArchiveNav("history")
    await renderLeagueHistory()
}

init()