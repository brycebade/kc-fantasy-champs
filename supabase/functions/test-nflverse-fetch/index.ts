import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
}

const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
)

const PLAYER_STATS_URL = "https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats.csv"
const SCHEDULES_URL = "https://github.com/nflverse/nflverse-data/releases/download/schedules/schedules.csv"

const parseCsvFiltered = (text, season, week) => {
    const lines = text.split("\n")
    const headers = lines[0].split(",")
    const seasonIdx = headers.indexOf("season")
    const weekIdx = headers.indexOf("week")

    const results = []
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        if (!line) continue

        const values = line.split(",")
        if (Number(values[seasonIdx]) !== season || Number(values[weekIdx]) !== week) continue

        const row = {}
        headers.forEach((h, idx) => { row[h] = values[idx] })
        results.push(row)
    }
    return results
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

        const weekStats = parseCsvFiltered(statsText, season, week)
        const weekSchedules = parseCsvFiltered(schedulesText, season, week)

        return new Response(JSON.stringify({
            statsCount: weekStats.length,
            schedulesCount: weekSchedules.length,
            sampleStat: weekStats[0] || null,
            sampleSchedule: weekSchedules[0] || null,
            debugStatsHeaderLine: statsText.split("\n")[0],
            debugStatsFirstDataLine: statsText.split("\n")[1],
            debugSchedulesHeaderLine: schedulesText.split("\n")[0],
            debugSchedulesFirstDataLine: schedulesText.split("\n")[1]
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: corsHeaders
        })
    }
})