import { getHomeFeed } from "../api/homeFeedApi.js"

const formatDate = (date) => {
    if (!date) return "TBD"
    return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    })
}

const renderEventCard = (event) => {
    const displayDate = formatDate(event.date)
    const displayTime = event.time ? event.time : "TBD"

    return `
        <div class="card bg-base-100 shadow-md border border-base-300 rounded-xl p-4 w-full md:w-auto md:flex-1">
            <div class="flex justify-between items-center">
                <div>
                    <p class="text-xs uppercase tracking-wide text-primary font-bold">${displayDate} • ${displayTime}</p>
                    <h2 class="text-lg font-bold mt-1">${event.name}</h2>
                    <p class="text-sm opacity-70">${event.location}</p>
                </div>
            </div>
        </div>
    `
}

const renderRecapCard = (recap) => `
    <a href="weeklyRecap.html?season=${recap.season}&week=${recap.week}" class="card bg-base-100 shadow-md border border-base-300 rounded-xl p-4 w-full md:w-auto md:flex-1 hover:shadow-lg transition-shadow">
        <p class="text-xs uppercase tracking-wide text-primary font-bold">Breaking News - Week ${recap.week}</p>
        <h2 class="text-lg font-bold mt-1">${recap.headline}</h2>
    </a>
`

const renderStoryCard = (chapter) => `
    <a href="leagueStory.html" class="card bg-base-100 shadow-md border border-base-300 rounded-xl p-4 w-full md:w-auto md:flex-1 hover:shadow=lg transition-shadow">
        <p class="text-xs uppercase tracking-wide text-primary font-bold">New Chapter - ${chapter.season}</p>
        <h2 class="text-lg font-bold mt-1">${chapter.title}</h2>
    </a>
`

const renderDraftGradesCard = (grades) => `
    <a href="draftGrades.html" class="card bg-base-100 shadow-md border border-base-300 rounded-xl p-4 w-full md:x-auto md:flex-1 hover:shadow-lg transition-shadow">
        <p class="text-xs uppercase tracking-wide text-primary font-bold">Just Released! - ${grades.season}</p>
        <h2 class="text-lg font-bold mt-1">${grades.headline}</h2>
    </a>
`

const renderCard = (item) => {
    if (item.type === "event") return renderEventCard(item.data)
    if (item.type === "recap") return renderRecapCard(item.data)
    if (item.type === "story") return renderStoryCard(item.data)
    if (item.type === "draftGrades") return renderDraftGradesCard(item.data)
    return ""
}

export const renderHomeFeed = async () => {
    const container = document.getElementById("homeFeedContainer")
    if (!container) return

    const feed = await getHomeFeed()
    if (feed.length === 0) return

    container.className = "flex flex-col md:flex-row gap-4 mb-6"
    container.innerHTML = feed.map(renderCard).join("")
}