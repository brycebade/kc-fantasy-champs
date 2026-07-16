import { getStandings } from "../api/standingsApi.js"
import { getAllTeamHistory } from "../api/teamsHistoryApi.js"
import { getOwners } from "../api/ownersApi.js"
import { getAllCompletedMatchups } from "../api/matchupsApi.js"

export const getSeasonStoryFacts = async (season) => {
    const [standings, teamHistory, owners, allMatchups] = await Promise.all([
        getStandings(season),
        getAllTeamHistory(),
        getOwners(),
        getAllCompletedMatchups()
    ])

    const allSeasons = [...new Set(allMatchups.map((m) => m.season))].filter((s) => s < season).sort((a, b) => b - a)

    const priorStandingsBySeason = {}
    for (const s of allSeasons) {
        priorStandingsBySeason[s] = await getStandings(s)
    }

    const historyFor = (teamId) =>
        teamHistory.find((h) => 
            h.team_id === teamId &&
            season >= h.start_year &&
            (h.end_year == null || season <= h.end_year)
        )

    const ownerNameFor = (teamId) => {
        const h = historyFor(teamId)
        if (!h) return "Unknown Owner"
        const owner = owners.find((o) => o.id === h.owner_id)
        return owner ? owner.name : "Unknown Owner"
    }

    const ownerNameById = (ownerId) => {
        const owner = owners.find((o) => o.id === ownerId)
        return owner ? owner.name : "Unknown Owner"
    }

    const teamNameFor = (teamId) => {
        const h = historyFor(teamId)
        return h ? h.name : "Unknown Team"
    }

    const ownerRankBySeason = {}
    allSeasons.forEach((s) => {
        const st = priorStandingsBySeason[s]
        st.forEach((standing) => {
            if (standing.final_rank == null) return
            const h = teamHistory.find((th) =>
                th.team_id === standing.team_id &&
                s >= th.start_year && (th.end_year == null || s <= th.end_year)
            )
            if (!h) return
            if (!ownerRankBySeason[h.owner_id]) ownerRankBySeason[h.owner_id] = {}
            ownerRankBySeason[h.owner_id][s] = standing.final_rank
        })
    })

    const toiletRepeatCount = (ownerId) => {
        const ranks = ownerRankBySeason[ownerId] || {}
        return Object.entries(ranks).filter(([s, rank]) => {
            const st = priorStandingsBySeason[Number(s)]
            const ranked = st.filter((r) => r.final_rank != null)
            const lastRank = ranked.length ? Math.max(...ranked.map((r) => r.final_rank)) : null
            return rank === lastRank
        }).length
    }

    const champRepeatCount = (ownerId) => {
        const ranks = ownerRankBySeason[ownerId] || {}
        return Object.values(ranks).filter((rank) => rank === 1).length
    }

    const rebrandsThisSeason = teamHistory.filter((h) => {
        if (h.end_year !== season) return false
        const nextEra = teamHistory.find((next) => 
            next.team_id === h.team_id && next.start_year === season + 1
        )
        return nextEra && nextEra.owner_id === h.owner_id
    })

    const trueDeparturesEnteringThisSeason = teamHistory.filter((h) => {
        if (h.end_year !== season - 1) return false
        const nextEra = teamHistory.find((next) => 
            next.team_id === h.team_id && next.start_year === season
        )
        return !nextEra || nextEra.owner_id !== h.owner_id
    })    

    const rebrandsIntoThisSeason = teamHistory.filter((h) => {
        if (h.start_year !== season) return false
        const prevEra = teamHistory.find((prev) =>
            prev.team_id === h.team_id && prev.end_year === season - 1
        )
        return prevEra && prevEra.owner_id === h.owner_id
    }).map((h) => {
        const prevEra = teamHistory.find((prev) => 
            prev.team_id === h.team_id && prev.end_year === season - 1
        )
        return { owner: ownerNameFor(h.team_id), oldName: prevEra.name, newName: h.name }
    })

    const newOwnersThisSeason = teamHistory.filter((h) => {
        if (h.start_year !== season) return false
        const prevEra = teamHistory.find((prev) => 
            prev.team_id === h.team_id && prev.end_year === season - 1
        )
        const isRebranded = prevEra && prevEra.owner_id === h.owner_id
        return !isRebranded
    })

    const ranked = standings.filter((s) => s.final_rank != null)
    const lastRank = ranked.length ? Math.max(...ranked.map((s) => s.final_rank)) : null

    const champStanding = standings.find((s) => s.final_rank === 1)
    const toiletStanding = standings.find((s) => s.final_rank === lastRank)

    const previousSeason = season - 1
    const previousChampStanding = priorStandingsBySeason[previousSeason]?.find((s) => s.final_rank === 1)
    let defendingChampFellOff = null
    if (previousChampStanding) {
        const prevH = teamHistory.find((th) => 
            th.team_id === previousChampStanding.team_id &&
            previousSeason >= th.start_year && (th.end_year == null || previousSeason <= th.end_year)
        )
        if (prevH) {
            const thisSeasonRank = ownerRankBySeason[prevH.owner_id]?.[season]
            if (thisSeasonRank && thisSeasonRank > 6) {
                defendingChampFellOff = { owner: ownerNameById(prevH.owner_id), rank: thisSeasonRank }
            }
        }
    }

    const biggestClimb = ranked
        .map((standing) => {
            const h = historyFor(standing.team_id)
            if (!h) return null
            const prevRank = ownerRankBySeason[h.owner_id]?.[previousSeason]
            if (!prevRank) return null
            return { owner: ownerNameById(h.owner_id), from: prevRank, to: standing.final_rank, jump: prevRank - standing.final_rank }
        })
        .filter(Boolean)
        .sort((a, b) => b.jump - a.jump)[0]

    const standingsSummary = ranked
        .sort((a, b) => a.final_rank - b.final_rank)
        .map((s) => `${s.final_rank}, ${teamNameFor(s.team_id)} (${ownerNameFor(s.team_id)}) — ${s.win}-${s.loss}`)

    return {
        season,
        champion: champStanding ? { team: teamNameFor(champStanding.team_id), owner: ownerNameFor(champStanding.team_id), record: `${champStanding.win}-${champStanding.loss}` } : null,
        toilet: toiletStanding ? { team: teamNameFor(toiletStanding.team_id), owner: ownerNameFor(toiletStanding.team_id), record: `${toiletStanding.win}-${toiletStanding.loss}` } : null,
        newOwners: newOwnersThisSeason.map((h) => ownerNameFor(h.team_id)),
        rebrands: rebrandsThisSeason.map((h) => ({ owner: ownerNameFor(h.team_id), oldName: h.name, newName: teamHistory.find((next) => next.team_id === h.team_id && next.start_year === season + 1)?.name })),
        toiletRepeats: ranked.filter((s) => {
            const h = historyFor(s.team_id)
            return h && toiletRepeatCount(h.owner_id) >= 2 && s.final_rank === lastRank
        }).map((s) => ({ owner: ownerNameById(historyFor(s.team_id).owner_id), count: toiletRepeatCount(historyFor(s.team_id).owner_id) })),
        champRepeats: champStanding ? (() => {
            const h = historyFor(champStanding.team_id)
            const count = h ? champRepeatCount(h.owner_id) : 0
            return count >= 2 ? { owner: ownerNameById(h.owner_id), count } : null
        })() : null,
        defendingChampFellOff,
        trueDepartures: trueDeparturesEnteringThisSeason.map((h) => ownerNameById(h.owner_id)),
        rebrandsIntoThisSeason,
        biggestClimb: biggestClimb && biggestClimb.jump >= 3 ? biggestClimb : null,
        standingsSummary
    }
}

export const buildSeasonStoryPrompt = (facts, adminNotes) => {
    const lines = []

    if (facts.champion) {
        lines.push(`Champion: ${facts.champion.team} (owner: ${facts.champion.owner}), finished ${facts.champion.record}`)
    }

    if (facts.toilet) {
        lines.push(`Last place (Toilet Bowl): ${facts.toilet.team} (owner: ${facts.toilet.owner}), finished ${facts.toilet.record}`)
    }

    if (facts.newOwners.length > 0) {
        lines.push(`New owner(s) joining the league this season: ${facts.newOwners.join(", ")}`)
    }

    if (facts.trueDepartures.length > 0) {
        lines.push(`Owner(s) who left the league after this season: ${facts.trueDepartures.join(", ")}`)
    }
    
    facts.rebrandsIntoThisSeason.forEach((r) => {
        lines.push(`${r.owner} rebranded their team from "${r.oldName}" to "${r.newName}" this season`)
    })

    facts.toiletRepeats.forEach((t) => {
        lines.push(`${t.owner} has now finished last (Toilet Bowl) ${t.count} times`)
    })

    if (facts.champRepeats) {
        lines.push(`${facts.champRepeats.owner} has now won the championship ${facts.champRepeats.count} times`)
    }
    
    if (facts.defendingChampFellOff) {
        lines.push(`The defending champion, ${facts.defendingChampFellOff.owner}, failed to make playoffs this season, finishing ${facts.defendingChampFellOff.rank}th (top 6 make playoffs)`)
    }

    if (facts.biggestClimb) {
        lines.push(`Biggest turnaround: ${facts.biggestClimb.owner} jumped from ${facts.biggestClimb.from}th place last season to ${facts.biggestClimb.to}th this season`)
    }

    lines.push(`Full final standings:\n${facts.standingsSummary.join("\n")}`)

    const prompt = `Write a short chapter (3-6 paragrahs) covering the ${facts.season} season of our fantasy football league, "KC Fantasy Champs". Write it like an ESPN 30-for-30 documentary recap - treat the league as a real, established fotball league with genuine drama, rivalries, and stakes. Do not mention that this is a fantasy football league between friends; write about the teams and standings as if they are real competitive franchises. Make it dramatic, a little exaggerated, treating every result as if the stakes were enormous. Don't just report the results neutrally: editorialize. A team that finished last "couldn't handle the heat" or "collapsed under pressure." A team that rebranded "needed a fresh identity after a season to forget." A blowout loss should sound like a program-defining humiliation. Treat every low seed and lopsided record as a real football failure, not a minor footnote. Give it a short, punchy chapter title.\n\nFacts for this season:\n${lines.join("\n")}${adminNotes ? `\n\nAdditional context from the commissioner:\n${adminNotes}` : ""}`

    return prompt
}