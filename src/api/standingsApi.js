import { supabase } from "../supabaseClient.js"

export const getStandings = async (season) => {
    const { data, error } = await supabase 
        .from("standings")
        .select("*")
        .eq("season", season)
        .order("wins", { ascending: false })
        .order("points_for", { ascending: false })

        if (error) {
            console.log("Error fetching owners:", error)
            return []
        }

        return data
}