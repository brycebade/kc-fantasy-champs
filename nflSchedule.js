import { renderNavbar } from "./src/components/navbar.js";

const init = async () => {
    await renderNavbar()
    populateWeekDropdown()
    await loadNFLWeek(1)
}

const populateWeekDropdown = () => {
    const weekSelect = document.getElementById("nflWeekSelect")

    for (let i = 1; i <= 18; i++) {
        const option = document.createElement("option")
        option.value = i
        option.textContent = `Week ${i}`
        weekSelect.appendChild(option)
    }

    weekSelect.addEventListener("change", () => {
        loadNFLWeek(weekSelect.value)
    })
}

const loadNFLWeek = async (week) => {
    const container = document.getElementById("nflScheduleContainer")
    container.innerHTML = "<p>Loading...</p>"

    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&seasontype=2&week=${week}`)
    const data = await response.json()

    container.innerHTML = ""

    data.events.forEach(event => {
        const competition = event.competitions[0]
        const home = competition.competitors.find(c => c.homeAway === "home")
        const away = competition.competitors.find(c => c.homeAway === "away")
        const isCompleted = competition.status.type.completed

        const gameDate = new Date(event.date)
        const displayDate = gameDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            timeZone: "America/Chicago"    
        })
        const displayTime = gameDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            timeZone: "America/Chicago"
        })

        const card = document.createElement("div")
        card.className = "card bg-base-100 border border-base-300 shadow-sm mb-3 p-4 rounded-xl"
        card.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex flex-col gap-2">
                    <div class="flex items-center gap-2">
                        <img src="${away.team.logo}" style="width: 24px; height: 24px; object-fit: contain">
                        <span class="font-semibold">${away.team.displayName}</span>
                        ${isCompleted ? `<span class="font-bold ml-2">${away.score}</span>` : ""}
                    </div>
                    <div class="flex items-center gap-2">
                        <img src="${home.team.logo}" style="width: 24px; height: 24px; object-fit: contain">
                        <span class="font-semibold">${home.team.displayName}</span>
                        ${isCompleted ? `<span class="font-bold ml-2">${home.score}</span>` : ""}
                    </div>
                </div>
                <div class="text-right text-sm opacity-70">
                    ${isCompleted ? `<span class="text-primary font-bold">FINAL</span>` : `${displayDate}<br>${displayTime} CT`}
                </div>
            </div>
        `
        container.appendChild(card)
    })
}

init()