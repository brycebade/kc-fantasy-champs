import { initTheme } from "./src/utils/themeManager.js"
import { renderNavbar } from "./src/components/navbar.js"
import { renderDraftOrder } from "./src/pages/draft-order.js"
import { renderStandings } from "./src/pages/standings.js"
import { renderCompactStandings } from "./src/pages/standings.js"
import { renderEvents } from "./src/pages/events.js"
import { renderFantasyNews } from "./src/pages/fantasyNews.js"
import { renderPowerRankings } from "./src/pages/powerRankings.js"
import { renderNFLScores } from "./src/pages/nflScores.js"
import { renderStorylines } from "./src/pages/storylines.js"

initTheme()

const init = async () => {
    await renderNavbar()
    await renderDraftOrder()
    await renderPowerRankings()
    await renderStandings()
    await renderCompactStandings()
    await renderEvents()
    await renderStorylines()
    await renderFantasyNews()
    await renderNFLScores()  
}

init()