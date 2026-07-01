import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const res = await fetch("https://www.rotowire.com/rss/news.php?sport=NFL")
    const xml = await res.text()

    const items = []
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || []

    for (const item of itemMatches.slice(0, 10)) {
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)
      const linkMatch = item.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/)
      if (titleMatch) {
        items.push({
          title: titleMatch[1].trim(),
          link: linkMatch ? linkMatch[1].trim() : ""
        })
      }
    }

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error), items: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})