import { renderNavbar } from "./src/components/navbar.js"
import { renderAwards } from "./src/pages/awards-page.js"

const init = async () => {
    await renderNavbar()
    await renderAwards()
}

init()