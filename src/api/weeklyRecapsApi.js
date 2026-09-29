import { supabase } from "../supabaseClient.js"

export const getWeeklyRecap = async (season, week) => {
    const { data, error } = await supabase
        .from("weekly_recaps")
        .select("*")
        .eq("season", season)
        .eq("week", week)
        .maybeSingle()

    if (error) {
        console.error("Error fetching weekly recap:", error)
        return null
    }
    return data
}

export const saveWeeklyRecap = async (season, week, headline, articleBody) => {
    const { error } = await supabase
        .from("weekly_recaps")
        .upsert({
            id: `${season}_${week}`,
            season,
            week,
            headline,
            article_body: articleBody
        }, { onConflict: "id" })

        if (error) {
            console.error("Error saving weekly recap:", error)
            return false
        }
        return true
}