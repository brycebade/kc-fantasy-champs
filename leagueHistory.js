import { renderNavbar } from "./src/components/navbar.js"
import { renderLeagueHistory } from "./src/pages/history.js"

const init = async () => {
    await renderNavbar()
    await renderLeagueHistory()
}

init()