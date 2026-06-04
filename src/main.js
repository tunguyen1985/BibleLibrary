import { navigate, init } from './router.js'

const MIN_FONT = 12
const MAX_FONT = 24
const STEP = 2

// ===== THEME & FONT (áp dụng sớm để tránh flash) =====
const savedTheme = localStorage.getItem('theme') || 'light'
const savedFont = Number(localStorage.getItem('fontSize') || 16)
document.documentElement.setAttribute('data-theme', savedTheme)
document.documentElement.style.setProperty('--base-font', savedFont + 'px')

// ===== HEADER CONTROLS =====
document.getElementById('btn-back').addEventListener('click', () => {
  if (history.length > 1) history.back()
  else navigate('home')
})

document.getElementById('btn-theme').addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  localStorage.setItem('theme', next)
})

document.getElementById('font-smaller').addEventListener('click', () => {
  const cur = Number(localStorage.getItem('fontSize') || 16)
  if (cur > MIN_FONT) {
    const next = cur - STEP
    document.documentElement.style.setProperty('--base-font', next + 'px')
    localStorage.setItem('fontSize', next)
  }
})

document.getElementById('font-larger').addEventListener('click', () => {
  const cur = Number(localStorage.getItem('fontSize') || 16)
  if (cur < MAX_FONT) {
    const next = cur + STEP
    document.documentElement.style.setProperty('--base-font', next + 'px')
    localStorage.setItem('fontSize', next)
  }
})

// ===== KHỞI ĐỘNG =====
init()

// ===== ĐĂNG KÝ SERVICE WORKER =====
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {})
}
