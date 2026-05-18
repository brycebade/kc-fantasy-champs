import { draftOrder } from "../data/draftOrder.js"
import { teams } from "../data/teams.js"

const draftOrderList= document.getElementById("draftOrderList")

const currentDraftYear = 2026

const currentDraftOrder = draftOrder
    .filter((entry) => entry.draftYear === currentDraftYear)
    .sort((a, b) => a.pick - b.pick)

currentDraftOrder.forEach((entry) => {
    const team = teams.find((team) => team.id === entry.teamId)

    const listItem = document.createElement("li")

    listItem.className = 
        "flex items-center justify-between gap-4 rounded-lg bg-base-200 px-4 py-3"

    listItem.innerHTML = `
        <span class="font-bold text-primary">#${entry.pick}</span>
        <span class="font-semibold text-right">${team ? team.currentName : "Unknown Team"}</span>   
    `

    draftOrderList.appendChild(listItem)
})