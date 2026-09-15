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
const SCHEDULES_URL = "https://github.com/nflverse/nflverse-data/releases/download/schedules/games.csv"

const splitCsvLine = (line) => {
    const values = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
            inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
            values.push(current)
            current = ""
        } else {
            current += char
        }
    }
    values.push(current)

    return values
}

const parseCsvFiltered = (text, season, week) => {
    const lines = text.split("\n")
    const headers = splitCsvLine(lines[0])
    const seasonIdx = headers.indexOf("season")
    const weekIdx = headers.indexOf("week")

    const results = []
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        if (!line) continue

        const values = splitCsvLine(line)
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

const calculateFantasyPoints = (stat) => {
    let points = 0

    points += (Number(stat.passing_yards) || 0) / 25
    points += (Number(stat.passing_tds) || 0) * 4
    points += (Number(stat.interceptions) || 0) * -2

    points += (Number(stat.rushing_yards) || 0) / 10
    points += (Number(stat.rushing_tds) || 0) * 6
    points += (Number(stat.rushing_fumbles_lost) || 0) * -2

    points += (Number(stat.receptions) || 0) * 1
    points += (Number(stat.receiving_yards) || 0) / 10
    points += (Number(stat.receiving_tds) || 0) * 6
    points += (Number(stat.receiving_fumbles_lost) || 0) * -2

    points += (Number(stat.sack_fumbles_lost) || 0) * -2

    points += (Number(stat.passing_2pt_conversions) || 0) * 2
    points += (Number(stat.rushing_2pt_conversions) || 0) * 2
    points += (Number(stat.receiving_2pt_conversions) || 0) * 2

    points += (Number(stat.special_teams_tds) || 0) * 6

    return Math.round(points * 100) / 100
}

const normalizeName = (name) => {
    return name
        .toLowerCase()
        .replace(/[^a-z\s]/g, "")
        .split(/[\s,]+/)
        .filter(Boolean)
        .sort()
        .join(" ")
}

const findPlayerStat = (rosterPlayerName, weekStats) => {
    const normalizedRosterName = normalizeName(rosterPlayerName)
    return weekStats.find((s) => normalizeName(s.player_display_name) === normalizedRosterName)
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    try {
        const { season, week } = await req.json()

        const [statsRes, schedulesRes, draftRes, faRes] = await Promise.all([
            fetch(PLAYER_STATS_URL),
            fetch(SCHEDULES_URL),
            supabase.from("draft_results_by_year").select("*").eq("season", season).eq("is_on_roster", true),
            supabase.from("fa_pickups").select("*").eq("season", season).eq("is_on_roster", true)
        ])

        const statsText = await statsRes.text()
        const schedulesText = await schedulesRes.text()

        const weekStats = parseCsvFiltered(statsText, season, week)
        const weekSchedules = parseCsvFiltered(schedulesText, season, week)

        const rosteredPlayers = [
            ...(draftRes.data || []),
            ...(faRes.data || [])
        ]

        const teamWindowMap = {}
        weekSchedules.forEach((game) => {
            const windowLabel = classifyGameWindow(game.weekday, game.gametime)
            teamWindowMap[game.home_team] = windowLabel
            teamWindowMap[game.away_team] = windowLabel
        })

        const rowsToInsert = []
        const unmatched = []

        rosteredPlayers.forEach((rosterPlayer) => {
            const normalizedRosterName = normalizeName(rosterPlayer.player)
            const matches = weekStats.filter((s) => normalizeName(s.player_display_name) === normalizedRosterName)

            if (matches.length !== 1) {
                unmatched.push({ player: rosterPlayer.player, matchCount: matches.length })
                return
            }

            const stat = matches[0]
            const fantasyPoints = calculateFantasyPoints(stat)
            const gameWindow = teamWindowMap[stat.recent_team] || "Unknown"

            rowsToInsert.push({
                id: `${season}_${week}_${rosterPlayer.team_id}_${rosterPlayer.player.replace(/[^a-zA-Z]/g, "")}`,
                season,
                week,
                player_name: stat.player_display_name,
                team_id: rosterPlayer.team_id,
                position: stat.position,
                nfl_team: stat.recent_team,
                opponent_team: stat.opponent_team,
                game_window: gameWindow,
                fantasy_points: fantasyPoints,
                raw_stats: stat
            })
        })

        const { error: insertError } = await supabase
            .from("weekly_player_stats")
            .upsert(rowsToInsert, { onConflict: "id"})

        return new Response(JSON.stringify({
            insertedCount: rowsToInsert.length,
            unmatchedCount: unmatched.length,
            unmatched,
            insertError: insertError?.message || null
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: corsHeaders
        })
    }
})