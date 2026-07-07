import { supabase } from "../supabaseClient.js"

export const getFAPickupsByTeam = async (teamId, season) => {
    const { data, error } = await supabase
    .from("fa_pickups")
    .select("*")
    .eq("team_id", teamId)
    .eq("season", season)
    .eq("is_on_roster", true)
    .order("player")

    if (error) {
        console.error("Error fetching FA Pickups:", error)
        return []
    }

    return data
}

export const getAllFAPickupsByTeam = async (teamId, season) => {
    const { data, error } = await supabase
    .from("fa_pickups")
    .select("*")
    .eq("team_id", teamId)
    .eq("season", season)
    .order("player")

    if (error) {
        console.error("Error fetching all FA Pickups:", error)
        return []
    }

    return data
}