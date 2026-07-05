import { ref } from 'vue'

const STORAGE_KEY = 'chatflow-theme'
const theme = ref('light')

function applyTheme(value) {
  theme.value = value
  localStorage.setItem(STORAGE_KEY, value)
  if (value === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme(saved || (prefersDark ? 'dark' : 'light'))
}

function toggleTheme() {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}

function setThemeForRoute(isAuthPage) {
  if (isAuthPage) {
    document.documentElement.classList.remove('dark')
  } else {
    applyTheme(theme.value)
  }
}

export function useTheme() {
  return { theme, toggleTheme, initTheme, setThemeForRoute }
}
