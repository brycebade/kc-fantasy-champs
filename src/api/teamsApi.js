import { supabase } from "../supabaseClient.js"

export const getTeams = async () => {
    const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("current_name")

        if (error) {
            console.error("Error fetching teams:", error)
            return []
        }

        return data
}