import { supabase } from "../supabaseClient.js"

export const getTopPlayerGames = async (limit = 10) => {
    const { data, error } = await supabase
        .from("starter_player_games")
        .select("*")
        .order("fantasy_points", { ascending: false })
        .limit(limit)

    if (error) {
        console.error("Error fetching top player games:", error)
        return []
    }
    return data
}

export const getTopPlayerGamesByPosition = async (position, limit = 5) => {
    const { data, error } = await supabase
        .from("starter_player_games")
        .select("*")
        .eq("position", position)
        .order("fantasy_points", { ascending: false })
        .limit(limit)

    if (error) {
        console.error(`Error fetching top ${position} games:`, error)
        return []
    }
    return data
}