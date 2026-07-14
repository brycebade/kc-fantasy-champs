import { supabase } from "../supabaseClient.js"

export const getActiveStorylines = async () => {
    const { data, error } = await supabase
        .from("storylines")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")

    if (error) {
        console.error("Error fetching storylines:", error)
        return []
    }

    return data
}

export const getAllStorylines = async () => {
    const { data, error } = await supabase
        .from("storylines")
        .select("*")
        .order("sort_order")

    if (error) {
        console.error("Error fetching all storylines:", error)
        return []
    }

    return data
}

export const addStoryline = async (storyline) => {
    const { data, error } = await supabase
        .from("storylines")
        .insert(storyline)
        .select()

    if (error) {
        console.error("Error fetching storyline:", error)
        return null
    }

    return data
}

export const updateStorylineActive = async (id, isActive) => {
    const { error } = await supabase
        .from("storylines")
        .update({ is_active: isActive })
        .eq("id", id)

    if (error) {
        console.error("Error updating storyline:", error)
        return false
    }

    return true
}