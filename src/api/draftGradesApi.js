import { supabase } from "../supabaseClient.js"

export const getDraftGrades = async (season) => {
    const { data, error } = await supabase
        .from("draft_grades")
        .select("*")
        .eq("season", season)
        .single()

    if (error) {
        console.error("Error fetching draft grades:", error)
        return null
    }

    return data
}

export const addDraftGrades = async (season, headline, body) => {
    const { data, error } = await supabase
        .from("draft_grades")
        .insert({ id: `${season}_draft_grades`, season, headline, body })
        .select()
    
    if (error) {
        console.error("Error adding draft grades:", error)
        return null
    }

    return data
}

export const updateDraftGrades = async (season, headline, body) => {
    const { error } = await supabase
        .from("draft_grades")
        .update({ headline, body })
        .eq("season", season)

    if (error) {
        console.error("Error updating draft grades:", error)
        return false
    }

    return true
}