import { supabase } from "../supabaseClient.js"

export const getLeagueStory = async () => {
    const { data, error } = await supabase
        .from("league_story")
        .select("*")
        .order("season")

    if (error) {
        console.error("Error fetching league story:", error)
        return []
    }

    return data
}

export const addLeagueStoryChapter = async (chapter) => {
    const { data, error } = await supabase
        .from("league_story")
        .insert(chapter)
        .select()

    if (error) {
        console.error("Error adding league story chapter:", error)
        return null
    }

    return data
}

export const updateLeagueStoryChapter = async (id, title, body) => {
    const { error } = await supabase
        .from("league_story")
        .update({ title, body })
        .eq("id", id)

    if (error) {
        console.error("Error updating league story chapter:", error)
        return false
    }

    return true
}