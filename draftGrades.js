import { renderNavbar } from "./src/components/navbar.js"
import { getCurrentSeasonSettings } from "./src/api/seasonSettingsApi.js"
import { getDraftGrades } from "./src/api/draftGradesApi.js"

const formatDraftGradesBody = (body) => {
    return body
        .split("\n")
        .map((line) => {
            const trimmed = line.trim()
            const match = trimmed.match(/^(.+?)\s+—\s+([A-F][+-]?)$/)
            if (match) {
                return `<p class="font-bold text-primary mt-4">${match[1]} - ${match[2]}</p>`
            }
            return `<p>${line}</p>`
        })
        .join("")
}

const renderDraftGrades = async () => {
    const container = document.getElementById("draftGradesContainer")
    const settings = await getCurrentSeasonSettings()
    const grades = await getDraftGrades(settings.season)

    if (!grades) {
        container.innHTML = `<p class="text-sm opacity-60">Draft grades haven't been posted yet.</p>`
        return
    }

    container.innerHTML = `
        <div class="card bg-base-100 shadow-md border border-base-300 rounded-xl overflow-hidden">
            <div class="bg-neutral text-white px-4 py-2">
                <h2 class="font-bold uppercase tracking-wide text-sm">${grades.season} Draft Grades</h2>
            </div>
            <div class="card-body p-4">
                <h1 class="text-xl font-bold text-primary mb-3">${grades.headline}</h1>
                <p class="text-sm leading-relaxed space-y-2">${formatDraftGradesBody(grades.body)}</p>
            </div>
        </div>
    `
}

const init = async () => {
    await renderNavbar()
    await renderDraftGrades()
}

init()