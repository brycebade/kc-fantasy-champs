import { supabase } from "../supabaseClient.js"

export const getDraftResultsByYear = async (season) => {
    const { data, error } = await supabase
        .from("draft_results_by_year")
        .select("*")
        .eq("season", season)
        .order("overall")

        if (error) {
            console.log("Error fetching draft results:", error)
            return []
        }

        return data
}

export const getDraftSeasonsByTeam = async (teamId) => {
    const { data, error } = await supabase
    .from("draft_results_by_year")
    .select("season")
    .eq("team_id", teamId)
    .order("season", { ascending: false })

    if (error) {
        console.log("Error fetching draft seasons:", error)
        return []
    }

    const uniqueSeasons = [...new Map(data.map(s => [s.season, s])).values()]
    return uniqueSeasons
}

export const getDraftResultsByTeamAndYear = async (teamId, season) => {
    const { data, error } = await supabase
    .from("draft_results_by_year")
    .select("*")
    .eq("team_id", teamId)
    .eq("season", season)
    .order("overall")

    if (error) {
        console.log("Error fetching draft results:", error)
        return []
    }

    return data
}