import { getDraftOrder } from "../api/draftOrderApi.js"
import { getTeams } from "../api/teamsApi.js"

export const renderDraftOrder = async () => {
    const draftOrderList= document.getElementById("draftOrderList")

    if (!draftOrderList) {
        console.log("draftOrderList element not found")
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