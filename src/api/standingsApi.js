import { supabase } from "../supabaseClient.js"

export const getStandings = async (season) => {
    const { data, error } = await supabase 
        .from("standings")
        .select("*")
        .eq("season", season)
        .order("win", { ascending: false })
        .order("points_for", { ascending: false })

        if (error) {
            console.log("Error fetching standings:", error)
            return []
        }

        return data
}