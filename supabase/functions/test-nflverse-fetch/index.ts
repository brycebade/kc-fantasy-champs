import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeader = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
}

const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
)

const PLAYER_STATS_URL = "https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats.csv"
const SCHEDULES_URL = "https://github.com/nflverse/nflverse-data/releases/download/schedules/schedules.csv"

const parseCsv = (text) => {
    const [headerLine, ...lines] = text.trim().split("\n")
    const headers = headerLine.split(",")

    return lines.map((line) => {
        const values = line.split(",")
        const row = {}
        headers.forEach((h, i) => { row[h] = values[i] })
        return row
    })
}

const classifyGameWindow = (weekday, gametime) => {
    if (weekday === "Wednesday") return "Wednesday"
    if (weekday === "Thursday") return "Thursday"
    if (weekday === "Friday") return "Friday"
    if (weekday === "Saturday") return "Saturday"
    if (weekday === "Monday") return "Monday"
    if (weekday === "Sunday") {
        const hour = Number(gametime?.split(":")[0])
        if (hour < 16) return "Sunday Early"
        if (hour > 19) return "Sunday Late"
        return "Sunday Night"
    }
    return weekday || "Unknown"
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    try {
        const { season, week } = await req.json()

        const [statsRes, schedulesRes] = await Promise.all([
            fetch(PLAYER_STATS_URL),
            fetch(SCHEDULES_URL)
        ])

        const statsText = await statsRes.text()
        const schedulesText = await schedulesRes.text()

        const allStats = parseCsv(statsText)
        const allSchedules = parseCsv(schedulesText)

        const weekStats = allStats.filter((s) => 
            Number(s.season) === season && Number(s.week) === week
        )

        const weekSchedules = allSchedules.filter((s) => 
            Number(s.season) === season && Number(s.week) === week
        )

        return new Response(JSON.stringify({
            statsCount: weekStats.length,
            schedulesCount: weekSchedules.length,
            sampleStat: weekStats[0] || null,
            sampleSchedule: weekSchedules[0] || null
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: corsHeaders
        })
    }
})