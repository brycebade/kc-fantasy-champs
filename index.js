import { renderNavbar } from "./src/components/navbar.js"
import { renderDraftOrder } from "./src/pages/draft-order.js"
import { renderStandings } from "./src/pages/standings.js"
import { renderCompactStandings } from "./src/pages/standings.js"
import { renderEvents } from "./src/pages/events.js"

const init = async () => {
    renderNavbar()
    renderDraftOrder()
    renderStandings()
    renderCompactStandings()
    renderEvents()
}

init()