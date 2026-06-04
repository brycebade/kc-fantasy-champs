import { supabase } from "../supabaseClient.js"

export const getStandings = async (season) => {
    const { data, error } = await supabase 
        .from("standings")
        .select("*")
        .eq("season", season)

        if (error) {
            console.error("Error fetching standings:", error)
            return []
        }

        return data
}

export const getStandingsByTeam = async (teamId) => {
    const { data, error } = await supabase
        .from("standings")
        .select("*")
        .eq("team_id", teamId)
        .order("season", { ascending: false })

        if (error) {
            console.error("Error fetching team standings:", error)
            return []
        }

        return data
}