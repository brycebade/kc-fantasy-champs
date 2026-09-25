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

export const getTeamBoxScore = async (teamId, season, week) => {
    const { data: lineup, error: lineupError } = await supabase
        .from("weekly_lineups")
        .select("*")
        .eq("team_id", teamId)
        .eq("season", season)
        .eq("week", week)
        .eq("is_starter", true)

    if (lineupError) {
        console.error("Error fetching lineup:", lineupError)
        return []
    }

    const starterIds = lineup.map((l) => l.id)
    if (starterIds.length === 0) return []

    const { data: stats, error: statsError } = await supabase
        .from("weekly_player_stats")
        .select("*")
        .in("id", starterIds)

    if (statsError) {
        console.error("Error fetching stats:", statsError)
        return []
    }

    return stats
}