import { supabase } from "../supabaseClient.js"

const RECENCY_LIMIT = 5

export const getRecentActivity = async () => {
    const [recaps, storyChapters, draftGrades] = await Promise.all([
        supabase.from("weekly_recaps").select("*").order("created_at", { ascending: false }).limit(RECENCY_LIMIT),
        supabase.from("league_story").select("*").order("created_at", { ascending: false }).limit(RECENCY_LIMIT),
        supabase.from("draft_grades").select("*").order("created_at", { ascending: false }).limit(RECENCY_LIMIT)
    ])

    const tagged = [
        ...(recaps.data || []).map((r) => ({ type: "recap", created_at: r.created_at, data: r })),
        ...(storyChapters.data || []).map((c) => ({ type: "story", created_at: c.created_at, data: c })),
        ...(draftGrades.data || []).map((d) => ({ type: "draftGrades", created_at: d.created_at, data: d }))
    ]

    return tagged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}