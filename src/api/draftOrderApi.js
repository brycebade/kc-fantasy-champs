import { supabase } from "../supabaseClient.js"

export const getDraftOrder = async (season) => {
    const { data, error } = await supabase
        .from("draft_order")
        .select("*")
        .eq("season", season)
        .order("pick")

        if (error) {
            console.log("Error fetching draft order:", error)
            return []
        }

        return data
}