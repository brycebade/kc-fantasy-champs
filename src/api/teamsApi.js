import { supabase } from "../supabaseClient.js"

export const getTeams = async () => {
    const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("current_name")

        if (error) {
            console.log("Error fetching teams:", error)
            return []
        }

        return data
}

export const getTeamHistory = async () => {
    const { data, error } = await supabase
        .from("team_history")
        .select("*")
        .eq("team_id", teamId)
        .order("start_year")

        if (error) {
            console.log("Error fetching team history:", error)
            return []
        }

        return data
}

export const getOwners = async () => {
    const { data, error } = await supabase 
        .from("owners")
        .select("*")
        .order("name")

        if (error) {
            console.log("Error fetching owners:", error)
            return []
        }

        return data
}