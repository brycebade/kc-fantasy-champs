import { getDraftOrder } from "../api/draftOrderApi.js"
import { getTeams } from "../api/teamsApi.js"

export const renderDraftOrder = async () => {
    const draftOrderList= document.getElementById("draftOrderList")

    if (!draftOrderList) {
        console.error("draftOrderList element not found")
        return
    }

    const currentDraftYear = 2026

    const draftOrder = await getDraftOrder(currentDraftYear)
    const teams = await getTeams()

    draftOrderList.innerHTML = ""

    draftOrder.forEach((entry) => {
        const team = teams.find((team) => {
            return team.id === entry.team_id
        })

        let draftColor
        if (entry.pick === 1) {
            draftColor = "text-secondary"
        } else {
            draftColor = "text-primary"
        }

        const listItem = document.createElement("li")

        listItem.className = 
            "flex items-center gap-3 rounded-md px-2 py-1 text-sm"

        listItem.innerHTML = `
            <span class="font-bold w-8 shrink-0 ${draftColor}">#${entry.pick}</span>
            <span class="font-semibold flex-1 text-left">${team ? team.current_name : "Unknown Team"}</span>   
        `

        draftOrderList.appendChild(listItem)     
    })
}