import { supabase } from "../supabaseClient.js"

export const getTeams = async () => {
    const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("current_name")

        console.log("teams data:", data)
        console.log("teams error:", error)

        if (error) {
            console.log("Error fetching teams:", error)
            return []
        }

        return data
}