import { renderNavbar } from "./src/components/navbar.js"
import { renderDraftOrder } from "./src/pages/draft-order.js"
import { renderStandings } from "./src/pages/standings.js"
import { renderCompactStandings } from "./src/pages/standings.js"
import { renderEvents } from "./src/pages/events.js"
import { renderFantasyNews } from "./src/pages/fantasyNews.js"
import { renderPowerRankings } from "./src/pages/powerRankings.js"

const init = async () => {
    renderNavbar()
    renderDraftOrder()
    renderPowerRankings()
    renderStandings()
    renderCompactStandings()
    renderEvents()

    await renderFantasyNews()
}

init()