import { supabase } from "../supabaseClient.js"

export const getOwners = async () => {
    const { data, error } = await supabase 
        .from("owners")
        .select("*")
        .order("name")

        if (error) {
            console.log("Error fetching owners:", error)
            return []
        }

        return data
}