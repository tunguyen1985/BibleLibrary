import postsData from '@data/posts.json'

function processYouTube(container) {
  // YouTube blocks embeds from file:// (null origin → error 153).
  // Replace every YouTube iframe with a thumbnail + link that opens in a new tab.
  container.querySelectorAll('iframe').forEach(iframe => {
    let src = iframe.getAttribute('src') || ''
    if (src.startsWith('//')) src = 'https:' + src
    if (!src.includes('youtube.com') && !src.includes('youtu.be')) return

    const m = src.match(/embed\/([\w-]+)/)
    const videoId = m ? m[1] : null
    const ytUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : src
    const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''

    const wrap = document.createElement('a')
    wrap.className = 'yt-wrap'
    wrap.href = ytUrl
    wrap.target = '_blank'
    wrap.rel = 'noopener'
    wrap.title = 'Mở video trên YouTube'
    wrap.innerHTML = thumb
      ? `<img class="yt-thumb" src="${thumb}" alt="YouTube video" loading="lazy">
         <div class="yt-play">&#9654;</div>`
      : `<div class="yt-play-text">&#9654; Xem trên YouTube</div>`

    iframe.parentNode.insertBefore(wrap, iframe)
    iframe.remove()
  })
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function reader({ slug }) {
  const titleEl = document.getElementById('app-title')
  const backBtn = document.getElementById('btn-back')
  const content = document.getElementById('reader-content')

  backBtn.classList.remove('hidden')

  const post = postsData.find(p => p.slug === slug)

  if (!post) {
    content.innerHTML = '<div class="empty-state">Không tìm thấy bài viết</div>'
    titleEl.textContent = 'Không tìm thấy'
    return
  }

  titleEl.textContent = post.title
  content.innerHTML = `
    <h1>${post.title}</h1>
    <span class="post-date">${formatDate(post.date)}</span>
    ${post.content}
  `

  processYouTube(content)
  window.scrollTo({ top: 0, behavior: 'instant' })
}
