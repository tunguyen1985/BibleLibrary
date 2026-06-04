import { navigate } from '../router.js'
import searchIndexData from '@data/search-index.json'
import categoriesData from '@data/categories.json'

let selectedCategory = 'all'
let searchTimer = null

function renderCategories() {
  const bar = document.getElementById('category-bar')
  const cats = [{ id: 'all', name: 'Tất cả' }, ...categoriesData.filter(c => c.count > 0)]

  bar.innerHTML = cats.map(c => `
    <button class="btn-category${c.id === selectedCategory ? ' active' : ''}"
      data-id="${c.id}">${c.name}</button>
  `).join('')

  bar.querySelectorAll('.btn-category').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCategory = btn.dataset.id === 'all' ? 'all' : Number(btn.dataset.id)
      bar.querySelectorAll('.btn-category').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      renderList(document.getElementById('search-input').value.trim())
    })
  })
}

function renderList(query = '') {
  const list = document.getElementById('post-list')
  const q = query.toLowerCase()

  let posts = searchIndexData
  if (selectedCategory !== 'all') {
    posts = posts.filter(p => p.category_ids?.includes(selectedCategory))
  }
  if (q) {
    posts = posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.excerpt || '').toLowerCase().includes(q)
    )
  }

  if (!posts.length) {
    list.innerHTML = `<div class="empty-state">Không tìm thấy bài viết nào</div>`
    return
  }

  list.innerHTML = posts.map(p => `
    <a class="post-card" data-slug="${p.slug}" href="#/post/${p.slug}">
      <div class="post-card-title">${p.title}</div>
      ${p.excerpt ? `<div class="post-card-excerpt">${p.excerpt}</div>` : ''}
    </a>
  `).join('')

  list.querySelectorAll('.post-card').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault()
      navigate('reader', { slug: card.dataset.slug })
    })
  })
}

export default function home() {
  document.getElementById('app-title').textContent = __SITE_TITLE__
  document.getElementById('btn-back').classList.add('hidden')

  renderCategories()
  renderList()

  const input = document.getElementById('search-input')
  input.value = ''
  input.addEventListener('input', () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => renderList(input.value.trim()), 200)
  })
}
