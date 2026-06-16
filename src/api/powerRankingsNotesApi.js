import { supabase } from "../supabaseClient.js"

export const getPowerRankingNote = async (season, week) => {
    const { data, error } = await supabase
        .from("power_ranking_notes")
        .select("*")
        .eq("season", season)
        .eq("week", week)
        .maybeSingle()

    if (error) {
        console.error("Error fetching power ranking note:", error)
        return null
    }
    return data
}

export const savePowerRankingNote = async (season, week, note) => {
    const id = `${season}_week${week}`
    const { data, error } = await supabase
        .from("power_ranking_notes")
        .upsert({ id, season, week, note }, { onConflict: "id" })
        .select()
        .single()

    if (error) {
        console.error("Error saving power ranking note:", error)
        return null
    }
    return data
}