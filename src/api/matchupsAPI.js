import { supabase } from "../supabaseClient.js"

export const getMatchups = async (season) => {
    const { data, error } = await supabase 
        .from("matchups")
        .select("*")
        .eq("season", season)
        .order("week", { ascending: true })
        .order("team_1_id", { ascending: true })

        if (error) {
            console.log("Error fetching matchups:", error)
            return []
        }

        return data
}