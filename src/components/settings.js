const MIN_FONT = 12
const MAX_FONT = 24
const STEP = 2

function applyFont(size) {
  document.documentElement.style.setProperty('--base-font', size + 'px')
  document.getElementById('font-size-label').textContent = size + 'px'
  localStorage.setItem('fontSize', size)
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
  document.querySelectorAll('.btn-theme').forEach(b => {
    b.classList.toggle('active', b.id === `theme-${theme}`)
  })
}

export default function settings() {
  document.getElementById('app-title').textContent = 'Cài đặt'
  document.getElementById('btn-back').classList.remove('hidden')

  const currentFont = Number(localStorage.getItem('fontSize') || 16)
  const currentTheme = localStorage.getItem('theme') || 'light'

  document.getElementById('font-size-label').textContent = currentFont + 'px'
  applyTheme(currentTheme)

  document.getElementById('font-smaller').onclick = () => {
    const cur = Number(localStorage.getItem('fontSize') || 16)
    if (cur > MIN_FONT) applyFont(cur - STEP)
  }

  document.getElementById('font-larger').onclick = () => {
    const cur = Number(localStorage.getItem('fontSize') || 16)
    if (cur < MAX_FONT) applyFont(cur + STEP)
  }

  document.getElementById('theme-light').onclick = () => applyTheme('light')
  document.getElementById('theme-dark').onclick = () => applyTheme('dark')
}
