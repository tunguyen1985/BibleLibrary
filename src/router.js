const routes = {
  home: () => import('./components/home.js'),
  reader: () => import('./components/reader.js')
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
  document.getElementById(`page-${name}`)?.classList.add('active')
}

function render(path, params = {}) {
  routes[path]?.().then(m => {
    showPage(path)
    m.default?.(params)
  })
}

function resolveHash(hash) {
  const path = (hash || '').replace(/^#/, '') || '/'
  if (path.startsWith('/post/')) {
    render('reader', { slug: path.slice(6) })
  } else {
    render('home')
  }
}

export function navigate(page, params = {}) {
  location.hash = page === 'reader' ? `/post/${params.slug}` : '/'
}

export function init() {
  window.addEventListener('hashchange', () => resolveHash(location.hash))
  resolveHash(location.hash)
}
