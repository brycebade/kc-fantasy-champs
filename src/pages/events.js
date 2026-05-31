import { getEvents } from "../api/eventsApi.js"

const formateDate = (date) => {
    if (!date) return `TBD`
    return new Date(date).toLocaleDateString(`en-US`, {
        month: `long`,
        day: `numeric`,
        year: `numeric`
    })
}

const formatTime = (time) => {
    if (!time) return `TBD`
    const [hours, minutes] = time.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
}

export const renderEvents = async () => {
    const events = await getEvents()

    const eventListContainer = document.getElementById("eventListContainer")
    eventListContainer.innerHTML = ""

    eventListContainer.className="flex flex-col md:flex-row gap-4 mb-6"

    events.forEach((event) => {
        const row = document.createElement("div")

        const displayDate = formateDate(event.date)
        const displayTime = formatTime(event.time)

        row.innerHTML = `
            <div class="card bg-base-100 shadow-md border border-base-300 rounded-xl p-4 w-full md:w-auto md:flex-1">
                <div class="flex justify-between items-center">
                    <div>
                        <p class=text-xs uppercase tracking-wide text-primary font-bold">${displayDate} • ${displayTime}</p>
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