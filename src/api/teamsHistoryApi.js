import { supabase } from "../supabaseClient.js"

export const getTeamHistory = async () => {
    const { data, error } = await supabase
        .from("team_history")
        .select("*")
        .eq("team_id", teamId)
        .order("start_year")

        if (error) {
            console.error("Error fetching team history:", error)
            return []
        }

        return data
}