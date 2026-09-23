import { supabase } from "../supabaseClient.js"

export const getWeeklyLineup = async (teamId, season, week) => {
    const { data, error } = await supabase
        .from("weekly_lineups")
        .select("*")
        .eq("team_id", teamId)
        .eq("season", season)
        .eq("week", week)

    if (error) {
        console.error("Error fetching weekly lineup:", error)
        return []
    }
    return data
}

export const saveWeeklyLineup = async (rows) => {
    const { error } = await supabase
        .from("weekly_lineups")
        .upsert(rows, { onConflict: "id" })

    if (error) {
        console.error("Error saving weekly lineup:", error)
        return false
    }
    return true
}