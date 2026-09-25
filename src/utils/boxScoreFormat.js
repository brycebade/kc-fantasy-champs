const formatBoxScoreLine = (stat) => {
    const position = stat.position

    if (position === "QB") {
        const comp = stat.completions || 0
        const att = stat.attempts || 0
        const passYds = stat.passing_yards || 0
        const passTds = stat.passing_tds || 0
        const ints = stat.passing_interceptions || 0
        let line = `${comp}/${att}, ${passYds} yds, ${passTds} TD, ${ints} INT`

        const carries = Number(stat.carries) || 0
        if (carries > 0) {
            line += ` — ${carries} car, ${stat.rushing_yards || 0} yds, ${stat.rushing_tds || 0} TD`
        }
        return line
    }

    if (position === "RB") {
        const carries = Number(stat.carries) || 0
        const rushYds = Number(stat.rushing_yards) || 0
        const rushAvg = carries > 0 ? (rushYds / carries).toFixed(1) : "0.0"
        let line = `${carries} car, ${rushYds} yds (${rushAvg} avg), ${stat.rushing_tds || 0} TD`

        const targets = Number(stat.targets) || 0
        if (targets > 0) {
            line += ` — ${stat.receptions || 0}/${targets} rec, ${stat.receiving_yards || 0} yds, ${stat.receiving_tds || 0} TD`
        }
        return line
    }

    if (position === "WR" || position === "TE") {
        const receptions = stat.receptions || 0
        const targets = stat.targets || 0
        const recYds = stat.receiving_yards || 0
        const recTds = stat.receiving_tds || 0
        let line = `${receptions}/${targets} rec, ${recYds} yds, ${recTds} TD`

        const carries = Number(stat.carries) || 0
        if (carries > 0) {
            line += ` — ${carries} car, ${stat.rushing_yards || 0} yards, ${stat.rushing_tds || 0} TD`
        }
        return line
    }

    if (position === "K") {
        const fgMade = stat.fg_made || 0
        const fgAtt = stat.fg_att || 0
        const long = stat.fg_long || 0
        const patMade = stat.pat_made || 0
        const patAtt = stat.pat_att || 0
        return `${fgMade}/${fgAtt} FG (long ${long}), ${patMade}/${patAtt} PAT`
    }

    if (position === "DEF") {
        const sacks = stat.def_sacks || 0
        const ints = stat.def_interceptions || 0
        const fumRec = stat.fumble_recovery_opp || 0
        const defTd = Number(stat.def_tds || 0)
        const stTd = Number(stat.special_teams_tds || 0)
        return `${sacks} sacks, ${ints} INT, ${fumRec} FR, ${defTd + stTd} TD`
    }

    return `${stat.fantasy_points} pts`
}