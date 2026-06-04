import { navigate, init } from './router.js'

// ===== THEME & FONT (áp dụng sớm để tránh flash) =====
const savedTheme = localStorage.getItem('theme') || 'light'
const savedFont = localStorage.getItem('fontSize') || '16'
document.documentElement.setAttribute('data-theme', savedTheme)
document.documentElement.style.setProperty('--base-font', savedFont + 'px')

// ===== HEADER CONTROLS =====
document.getElementById('btn-back').addEventListener('click', () => {
  if (history.length > 1) history.back()
  else navigate('home')
})

document.getElementById('btn-settings').addEventListener('click', () => {
  navigate('settings')
})

document.getElementById('btn-theme').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme')
  const next = current === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  localStorage.setItem('theme', next)
})

// ===== KHỞI ĐỘNG =====
init()

// ===== ĐĂNG KÝ SERVICE WORKER =====
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {})
}
