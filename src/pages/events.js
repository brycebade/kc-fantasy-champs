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

    events.forEach((event) => {
        const row = document.createElement("div")

        const displayDate = formateDate(event.date)
        const displayTime = formatTime(event.time)

        row.innerHTML = `
            <div>
                <h2>${event.name}</h2>
                <p>${displayDate}</p>
                <p>${displayTime}</p>
                <p>${event.location}</p>
            </div>
        `
        eventListContainer.appendChild(row)
    })
}