export const THEMES = {
    DEFAULT: "kcTheme",
    NIGHT: "night",
    PLAYOFFS: "playoffs",
    CHAMPIONSHIP: "championship"
}

export const darkThemes = [THEMES.NIGHT, THEMES.PLAYOFFS, THEMES.CHAMPIONSHIP]

const STORAGE_KEY = "kc-theme"

const applyTheme = (themeName) => {
    document.documentElement.setAttribute("data-theme", themeName)
}

export const setTheme = (themeName) => {
    applyTheme(themeName)
    localStorage.setItem(STORAGE_KEY, themeName)
}

export const getTheme = () => {
    return document.documentElement.getAttribute("data-theme")
}

export const isDarkTheme = () => {
    return darkThemes.includes(getTheme())
}

export const initTheme = () => {
    const savedTheme = localStorage.getItem(STORAGE_KEY)

    if (savedTheme) {
        applyTheme(savedTheme)
    }
}