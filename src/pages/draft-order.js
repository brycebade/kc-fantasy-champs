import { draftOrder } from "../data/draftOrder.js"
import { getTeams } from "../api/teamsApi.js"

export const renderDraftOrder = () => {
    const draftOrderList= document.getElementById("draftOrderList")

    if (!draftOrderList) {
        console.log("draftOrderList element not found")
        return
    }

    const currentDraftYear = 2026

    const currentDraftOrder = draftOrder
        .filter((entry) => entry.season === currentDraftYear)
        .sort((a, b) => a.pick - b.pick)

    currentDraftOrder.forEach((entry) => {
        const team = teams.find((team) => team.id === entry.teamId)

        const listItem = document.createElement("li")

        listItem.className = 
            "flex items-center gap-3 rounded-md px-2 py-1 text-sm"

        listItem.innerHTML = `
            <span class="font-bold text-primary w-8">#${entry.pick}</span>
            <span class="font-semibold text-right">${team ? team.current_name : "Unknown Team"}</span>   
        `

        draftOrderList.appendChild(listItem)
        
    })
}