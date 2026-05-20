import { supabase } from "../supabaseClient.js"

export const getDraftResultsByYear = async (season) => {
    const { data, error } = await supabase
        .from("draft_results_by_year")
        .select("*")
        .eq("season", season)
        .order("overall")

        if (error) {
            console.log("Error fetching draft results:", error)
            return []
        }

        return data
}