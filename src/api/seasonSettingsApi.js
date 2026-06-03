import { supabase } from "../supabaseClient.js"

export const getCurrentSeasonSettings = async () => {
    const { data, error } = await supabase
        .from("season_settings")
        .select("*")
        .eq("is_current", true)
        .single()

        if (error) {
            console.error("Error fetching current season settings:", error)
            return null
        }

        return data
}