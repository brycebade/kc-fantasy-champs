export const getKeeperCost = (round) => {
    if (!round) return `Round 10`
    if (round === 1) return `Not Keepable`
    return `Round ${round -1}`
}