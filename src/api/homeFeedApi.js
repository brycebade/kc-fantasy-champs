import { getEvents } from "./eventsApi.js"
import { getRecentActivity } from "./activityFeedApi.js"

const FEED_LIMIT = 5

export const getHomeFeed = async () => {
    const [pinnedEvents, recentActivity] = await Promise.all([
        getEvents(),
        getRecentActivity()
    ])

    const pinnedItems = pinnedEvents.map((e) => ({ type: "event", data: e }))

    const remainingSlots = FEED_LIMIT - pinnedItems.length
    const recencyItems = remainingSlots > 0 ? recentActivity.slice(0, remainingSlots) : []

    return [...pinnedItems, ...recencyItems]
}