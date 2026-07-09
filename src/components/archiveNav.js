export const renderArchiveNav = (activePage) => {
    const container = document.getElementById("archiveNav")
    if (!container) return

    const links = [
        { label: "League History", href: "leagueHistory.html", key: "history" },
        { label: "League Records", href: "records.html", key: "records" },
        { label: "Former Owners", href: "formerOwners.html", key: "former" }
    ]

    container.innerHTML = `
        <div class="bg-base-100 shadow-sm border-t border-base-300">
            <div class="max-w-7xl mx-auto px-4">
                <ul class="menu menu-horizontal py-1 gap-1 flex-wrap">
                    ${links.map((l) => `
                        <li><a href="${l.href}" class="text-sm font-medium ${l.key === activePage ? "text-primary font-bold" : ""}">${l.label}</a></li>
                    `).join("")}
                </ul>
            </div>
        </div>
    `
}