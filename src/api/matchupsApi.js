import { supabase } from "../supabaseClient.js"

export const getMatchups = async (season) => {
    const { data, error } = await supabase 
        .from("matchups")
        .select("*")
        .eq("season", season)
        .order("week", { ascending: true })
        .order("team_1_id", { ascending: true })

    if (error) {
        console.error("Error fetching matchups:", error)
        return []
    }

    return data
}

export const getRegularSeasonMatchups = async (season) => {
    const { data, error } = await supabase
        .from("matchups")
        .select("*")
        .eq("season", season)
        .eq("matchup_type", "regular")
        .order("week", { ascending: true })
        .order("team_1_id", { ascending: true })

    if (error) {
        console.error("Error fetching regular season matchups:", error)
        return []
    }

    return data
}

export const getCompletedRegularSeasonMatchups = async (season, currentWeek) => {
    const { data, error } = await supabase
        .from("matchups")
        .select("*")
        .eq("season", season)
        .eq("matchup_type", "regular")
        .lte("week", currentWeek)
        .not("team_1_score", "is", null)
        .not("team_2_score", "is", null)
        .order("week", { ascending: true })
        .order("team_1_id", { ascending: true })

    if (error) {
        console.error("Error fetching completed regular season matchups:", error)
        return []
    }

    return data
}

export const getPlayoffMatchups = async (season) => {
    const { data, error } = await supabase
        .from("matchups")
        .select("*")
        .eq("season", season)
        .eq("matchup_type", "playoff")
        .order("week", { ascending: true })
        .order("team_1_id", { ascending: true })

    if (error) {
        console.error("Error fetching playoff matchups:", error)
        return []
    }

    return data
}

export const getCurrentSeason = async () => {
    const { data, error } = await supabase
        .from("matchups")
        .select("season")
        .order("season", { ascending: false })
        .limit(1)
        .single()

    if (error) {
        console.error("Error fetching current season:", error)
        return null
    }

    return data.season
}

export const getCompletedMatchupsThroughWeek = async (season, currentWeek) => {
    const { data, error } = await supabase
        .from("matchups")
        .select("*")
        .eq("season", season)
        .lte("week", currentWeek)
        .not("team_1_score", "is", null)
        .not("team_2_score", "is", null)
        .order("week", { ascending: true })
        .order("team_1_id", { ascending: true })

    if (error) {
        console.error("Error fetching completed matchups through week:", error)
        return []
    }

    return data
}

export const getAllCompletedMatchups = async () => {
    const { data, error } = await supabase
        .from("matchups")
        .select("*")
        .not("team_1_score", "is", null)
        .not("team_2_score", "is", null)
        .order("season", { ascending: true })
        .order("week", { ascending: true })

    if (error) {
        console.error("Error fetching all completed matchups:", error)
        return []
    }

    return data
}