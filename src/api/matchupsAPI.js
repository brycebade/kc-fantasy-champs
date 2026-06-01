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

        if (error) {
            console.error("Error fetching regular season matchups:", error)
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

        if (error) {
            console.error("Error fetching playoff matchups:", error)
            return []
        }

        return data
}

export const getCurrentSeason = async (season) => {
    const { data, error } = await supabase
        .from("matchups")
        .select("season")
        .order("season", { ascending: false })
        .limit(1)
        .single()

        if (error) {
            console.error("Error fetching current season", error)
            return null
        }

        return data.season
}