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
        console.log("Error fetching FA Pickups:", error)
        return []
    }

    return data
}