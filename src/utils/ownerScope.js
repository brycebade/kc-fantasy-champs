import { getAllTeamHistory } from "../api/teamsHistoryApi.js"

export const buildOwnerScope = async (ownerId) => {
    const teamHistory = await getAllTeamHistory()

    const eras = teamHistory.filter((h) => h.owner_id === ownerId)

    const teamSeasons = []
    const teamIds = new Set()

    eras.forEach((era) => {
        const start = era.start_year
        const end = era.end_year == null ? new Date().getFullYear() : era.end_year
        for (let year = start; year <= end; year++) {
            teamSeasons.push ({ teamId: era.team_id, season: year, name: era.name })
            teamIds.add(era.team_id)
        }
    })

    const ownsTeamSeason = (teamId, season) =>
        eras.some((h) => 
            h.team_id === teamId &&
            season >= h.start_year &&
            (h.end_year == null || season <= h.end_year)    
        )

    return { ownerId, teamSeasons, teamIds, ownsTeamSeason }
}