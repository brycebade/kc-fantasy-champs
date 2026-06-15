import { getChiefsThemeFacts } from "../api/chiefsScheduleApi.js"

export const THEMES = {
    DEFAULT: "kcTheme",
    NIGHT: "nightGame",
    PLAYOFFS: "playoffs",
    CHAMPIONSHIP: "championship"
}

export const darkThemes = [THEMES.NIGHT, THEMES.PLAYOFFS, THEMES.CHAMPIONSHIP]

const applyTheme = (themeName) => {
    document.documentElement.setAttribute("data-theme", themeName)
}

export const getTheme = () => {
    return document.documentElement.getAttribute("data-theme")
}

export const isDarkTheme = () => {
    return darkThemes.includes(getTheme())
}

export const detectTheme = async (referenceDate = new Date ()) => {
    try {
        const facts = await getChiefsThemeFacts(referenceDate)

        if (facts.titleGameToday) return THEMES.CHAMPIONSHIP
        if (facts.aliveInPlayoffs) return THEMES.PLAYOFFS
        if (facts.primetimeToday) return THEMES.NIGHT
        return THEMES.DEFAULT
    } catch (error) {
        console.error("Theme detection failed, using default:", error)
        return THEMES.DEFAULT
    }
}

export const initTheme = async () => {
    const theme = await detectTheme()
    applyTheme(theme)
}