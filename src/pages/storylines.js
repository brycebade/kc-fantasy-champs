import { getActiveStorylines } from "../api/storylinesApi.js"

export const renderStorylines = async () => {
    const container = document.getElementById("storylinesContainer")
    if (!container) return

    const storylines = await getActiveStorylines()
    if (storylines.length === 0) return

    container.innerHTML = `
        <section class="card bg-base-100 shadow-md border border-base-300 rounded-xl overflow-hidden">
            <div class="bg-neutral text-white px-4 py-2">
                <h2 class="font-bold uppercase tracking-wide text-sm">Fantasy Headlines</h2>
            </div>
            <div class="card-body p-4 space-y-4">
                ${storylines.map((s) => `
                        <div class="border-b border-base-300 last:border-0 pb-4 last:pb-0">
                            <h3 class="font-bold text-primary">${s.headline}</h3>
                            <p class="text-sm opacity-70 mt-1">${s.blurb}</p>
                        </div>
                `).join("")}
            </div>
        </section>
    `
}