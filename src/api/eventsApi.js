import { supabase } from "../supabaseClient.js";

export const getEvents = async () => {
    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
    .from("events")
    .select("*")
    .or(`date.gte.${today},date.is.null`)
    .order("date", { ascending: true })

    if (error) {
        console.error("Error fetching events:", error)
        return []
    }

    return data
}