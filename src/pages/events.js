import { getEvents } from "../api/eventsApi.js"

const formateDate = (date) => {
    if (!date) return `TBD`
    return new Date(date + 'T00:00:00').toLocaleDateString(`en-US`, {
        month: `long`,
        day: `numeric`,
        year: `numeric`
    })
}

const renderDraftGradeCard = () => {
    const row = document.createElement("div")

    row.innerHTML = `
        <a href="draftGrades.html" class="card bg-base-100 shadow-md border border-base-300 rounded-xl p-4 w-full md:w-auto md:flex-1 hover:shadow-lg transition-shadow">
            <div class="flex justify-between items-center">
                <div>
                    <p class="text-xs uppercase tracking-wide text-primary font-bold">Just Released!</p>
                    <h2 class="text-lg font-bold mt-1">2026 Draft Grades</h2>
                    <p class="text-sm opacity-70">See how every team's draft graded out</p>
                </div>
            </div>
        </a>
    `

    return row
}

export const renderEvents = async () => {
    const events = await getEvents()

    const eventListContainer = document.getElementById("eventListContainer")
    eventListContainer.innerHTML = ""

    eventListContainer.className="flex flex-col md:flex-row gap-4 mb-6"

    eventListContainer.appendChild(renderDraftGradeCard())

    events.forEach((event) => {
        const row = document.createElement("div")

        const displayDate = formateDate(event.date)
        const displayTime = event.time ? event.time : "TBD"

        row.innerHTML = `
            <div class="card bg-base-100 shadow-md border border-base-300 rounded-xl p-4 w-full md:w-auto md:flex-1">
                <div class="flex justify-between items-center">
                    <div>
                        <p class="text-xs uppercase tracking-wide text-primary font-bold">${displayDate} • ${displayTime}</p>
                        <h2 class="text-lg font-bold mt-1">${event.name}</h2>
                        <p class="text-sm opacity-70">${event.location}</p>
                    </div>
                    <div class="text-primary text-3xl">🏈</div>
                </div>
            </div>
        `
        eventListContainer.appendChild(row)
    })
}