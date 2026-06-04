import { navigate } from '../router.js'
import searchIndexData from '@data/search-index.json'
import categoriesData from '@data/categories.json'

const PREVIEW_COUNT = 5

let selectedCategory = 'all'
let searchTimer = null
let panelInitialized = false

function initCategoryPanel() {
  if (panelInitialized) return
  panelInitialized = true

  const toggle = document.getElementById('btn-cat-toggle')
  const panel = document.getElementById('category-panel')

  toggle.addEventListener('click', () => {
    const opening = panel.classList.contains('hidden')
    panel.classList.toggle('hidden', !opening)
    toggle.classList.toggle('open', opening)
    toggle.querySelector('.toggle-label').textContent = opening ? 'Thu gọn' : 'Xem thêm'
  })
}

function selectCategory(id) {
  selectedCategory = id === 'all' ? 'all' : id
  document.querySelectorAll('.btn-category').forEach(b =>
    b.classList.toggle('active', b.dataset.id === String(selectedCategory))
  )
  const panel = document.getElementById('category-panel')
  panel.classList.add('hidden')
  const tog = document.getElementById('btn-cat-toggle')
  tog.classList.remove('open')
  tog.querySelector('.toggle-label').textContent = 'Xem thêm'
  renderList(document.getElementById('search-input').value.trim())
}

function renderCategories() {
  const bar = document.getElementById('category-bar')
  const panel = document.getElementById('category-panel')

  const cats = categoriesData.filter(c => c.type === 'category')
  const tags = categoriesData.filter(c => c.type === 'tag')

  const previewItems = [
    { id: 'all', name: 'Tất cả' },
    ...cats.slice(0, PREVIEW_COUNT),
    ...tags.slice(0, PREVIEW_COUNT)
  ]

  const btnHtml = c =>
    `<button class="btn-category${c.id === selectedCategory ? ' active' : ''}" data-id="${c.id}">${c.name}</button>`

  bar.innerHTML = previewItems.map(btnHtml).join('')

  panel.innerHTML = `
    ${cats.length ? `
      <div class="cat-section">
        <div class="cat-section-header">Danh mục</div>
        <div class="cat-section-items">${cats.map(btnHtml).join('')}</div>
      </div>` : ''}
    ${tags.length ? `
      <div class="cat-section">
        <div class="cat-section-header">Nhãn</div>
        <div class="cat-section-items">${tags.map(btnHtml).join('')}</div>
      </div>` : ''}
  `

  document.querySelectorAll('#category-bar .btn-category, #category-panel .btn-category').forEach(btn => {
    btn.addEventListener('click', () => selectCategory(btn.dataset.id))
  })

}

function renderList(query = '') {
  const list = document.getElementById('post-list')
  const q = query.toLowerCase()

  let posts = searchIndexData
  if (selectedCategory !== 'all') {
    posts = posts.filter(p =>
      p.category_ids?.includes(selectedCategory) ||
      p.tag_ids?.includes(selectedCategory)
    )
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
  initCategoryPanel()
  renderList()

  const input = document.getElementById('search-input')
  input.value = ''
  input.addEventListener('input', () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => renderList(input.value.trim()), 200)
  })
}
