import { renderNavbar } from "./src/components/navbar.js"
import { renderArchiveNav } from "./src/components/archiveNav.js"
import { getLeagueStory } from "./src/api/leagueStoryApi.js"

const renderChapters = async () => {
    const container = document.getElementById("leagueStoryContainer")
    const chapters = await getLeagueStory()

    if (chapters.length === 0) {
        container.innerHTML = `<p class="text-sm opacity-60">No Chapters Written Yet</p>`
        return
    }

    container.innerHTML = chapters.map((c) => `
        <div id="season-${c.season}" class="card bg-base-100 shadow-md border border-base-300 rounded-xl overflow-hidden mb-6 scroll-mt-24">
            <div class="bg-neutral text-white px-4 py-2">
                <h2 class="font-bold uppercase tracking-wide text-sm">${c.season} — ${c.title}</h2>
            </div>
            <div class="card-body p-4">
                <p class="text-sm leading-relaxed whitespace-pre-line">${c.body}</p>
            </div>
        </div>
    `).join("")

    const jumpSelect = document.getElementById("seasonJumpSelect")
    jumpSelect.innerHTML = `<option value="">Jump to...</option>` +
        chapters.map((c) => `<option value="${c.season}">${c.season}</option>`).join("")

    jumpSelect.addEventListener("change", (e) => {
        if (!e.target.value) return
        document.getElementById(`season-${e.target.value}`)?.scrollIntoView({ behavior: "smooth" })
        jumpSelect.value = ""
    })
}

const init = async () => {
    await renderNavbar()
    await renderArchiveNav("story")
    await renderChapters()
}

init()