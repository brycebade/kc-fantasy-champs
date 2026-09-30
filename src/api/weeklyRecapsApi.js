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

export const getTopPerformersByPosition = async (season, week) => {
    const { data: lineups, error: lineupError } = await supabase
        .from ("weekly_lineups")
        .select("id")
        .eq("season", season)
        .eq("week", week)
        .eq("is_starter", true)

    if (lineupError) {
        console.error("Error fetching lineups:", lineupError)
        return []
    }

    const starterIds = lineups.map((l) => l.id)
    if (starterIds.length === 0) return {}

    const { data: stats, error: statsError } = await supabase
        .from("weekly_player_stats")
        .select("*")
        .in("id", starterIds)

    if (statsError) {
        console.error("Error fetching stats:", statsError)
        return {}
    }

    const topByPosition = {}
    stats.forEach((row) => {
        const current = topByPosition[row.position]
        if (!current || row.fantasy_points > current.fantasy_points) {
            topByPosition[row.position] = row
        }
    })

    return topByPosition
}

export const getRecentWeeklyRecaps = async (season, limit = 4) => {
    const { data, error } = await supabase
        .from("weekly_recaps")
        .select("*")
        .eq("season", season)
        .order("week", { ascending: false })
        .limit(limit)

    if (error) {
        console.error("Error fetching recent recaps:", error)
        return []
    }
    return data
}