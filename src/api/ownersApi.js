import { supabase } from "../supabaseClient.js"

export const getOwners = async () => {
    const { data, error } = await supabase 
        .from("owners")
        .select("*")
        .order("name")

        if (error) {
            console.error("Error fetching owners:", error)
            return []
        }

        return data
}

export const getOwnerById = async (ownerId) => {
    const { data, error } = await supabase
        .from("owners")
        .select("*")
        .eq("id", ownerId)
        .single()

        if (error) {
            console.error("Error fetching owner:", error)
            return null
        }

        return data
}