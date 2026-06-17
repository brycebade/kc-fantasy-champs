import { renderNavbar } from "./src/components/navbar.js"
import { renderPowerRankingsPage } from "./src/pages/powerRankings.js"

const init = async () => {
    await renderNavbar()
    await renderPowerRankingsPage()
}

init()