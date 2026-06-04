import axios from 'axios'
import * as cheerio from 'cheerio'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { parseArgs } from 'util'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// === CẤU HÌNH ===
const { values } = parseArgs({
  options: {
    site: { type: 'string' },
    url:  { type: 'string' }
  },
  strict: false
})

const SITE_NAME = values.site || process.env.SITE_NAME
const WP_URL    = values.url  || process.env.WP_URL

if (!SITE_NAME) {
  console.error('❌ Thiếu --site. Ví dụ: node export.js --site kytanthe --url https://kytanthe.net')
  process.exit(1)
}
if (!WP_URL) {
  console.error('❌ Thiếu --url. Ví dụ: node export.js --site kytanthe --url https://kytanthe.net')
  process.exit(1)
}

const SITE_DIR   = path.join(__dirname, 'sites', SITE_NAME)
const OUTPUT_DIR = path.join(SITE_DIR, 'data')
const IMAGES_DIR = path.join(SITE_DIR, 'images')
const PER_PAGE   = 100

// === TIỆN ÍCH ===
function ensureDirs() {
  [OUTPUT_DIR, IMAGES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  })
}

function urlToFilename(url) {
  const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 8)
  return hash + '.webp'
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

// === TẢI HÌNH ===
async function downloadImage(url, destPath) {
  if (fs.existsSync(destPath)) return
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 })
    await sharp(Buffer.from(response.data))
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 70 })
      .toFile(destPath)
  } catch {
    console.warn(`  ⚠ Không tải được hình: ${url}`)
  }
}

// === XỬ LÝ CONTENT: tải hình + viết lại URL ===
async function processContent(html) {
  const $ = cheerio.load(html, { decodeEntities: false })
  const imgTasks = []

  // Fix iframe src: protocol-relative + double ? in query string
  $('iframe[src]').each((_, el) => {
    let src = $(el).attr('src') || ''
    if (src.startsWith('//')) src = 'https:' + src
    // Fix ?param?param → ?param&param (WordPress plugin bug)
    src = src.replace(/(\?[^?]*)(\?)/, '$1&')
    $(el).attr('src', src)
  })

  $('img').each((_, el) => {
    const src = $(el).attr('src')
    if (!src || src.startsWith('data:')) return

    const filename = urlToFilename(src)
    const destPath = path.join(IMAGES_DIR, filename)
    imgTasks.push(
      downloadImage(src, destPath).then(() => {
        $(el).attr('src', `./data/images/${filename}`)
        $(el).removeAttr('srcset')
        $(el).removeAttr('sizes')
      })
    )
  })

  await Promise.all(imgTasks)
  return $('body').html()
}

// === LẤY TẤT CẢ TRANG TỪ WP API ===
async function fetchAll(endpoint, extra = '') {
  const items = []
  let page = 1

  while (true) {
    const url = `${WP_URL}/wp-json/wp/v2/${endpoint}?per_page=${PER_PAGE}&page=${page}${extra}`
    try {
      const res = await axios.get(url, { timeout: 30000 })
      const data = res.data
      if (!data || data.length === 0) break
      items.push(...data)
      console.log(`  Trang ${page}: +${data.length} (tổng ${items.length})`)
      if (data.length < PER_PAGE) break
      page++
    } catch (err) {
      if (err.response?.status === 400) break
      throw err
    }
  }

  return items
}

// === MAIN ===
async function main() {
  console.log(`\n📥 Export: ${SITE_NAME} ← ${WP_URL}\n`)
  ensureDirs()

  // Tạo config.json nếu chưa có
  const configPath = path.join(SITE_DIR, 'config.json')
  if (!fs.existsSync(configPath)) {
    const hostname = new URL(WP_URL).hostname.replace(/^www\./, '')
    fs.writeFileSync(configPath, JSON.stringify({ title: hostname, url: WP_URL }, null, 2))
    console.log(`  ✎ Tạo config.json (title: "${hostname}"). Sửa file này để đặt tên hiển thị.\n`)
  }

  // 1. Lấy categories
  console.log('1/5 Đang lấy categories...')
  const rawCategories = await fetchAll('categories', '&hide_empty=false')
  const categories = rawCategories
    .filter(c => c.count > 0)
    .map(c => ({ id: `cat_${c.id}`, name: c.name, slug: c.slug, count: c.count, type: 'category' }))
    .sort((a, b) => b.count - a.count)
  console.log(`    → ${categories.length} chuyên mục\n`)

  // 2. Lấy tags
  console.log('2/5 Đang lấy tags...')
  const rawTags = await fetchAll('tags', '&hide_empty=false')
  const tags = rawTags
    .filter(t => t.count > 0)
    .map(t => ({ id: `tag_${t.id}`, name: t.name, slug: t.slug, count: t.count, type: 'tag' }))
    .sort((a, b) => b.count - a.count)
  fs.writeFileSync(path.join(OUTPUT_DIR, 'categories.json'), JSON.stringify([...categories, ...tags], null, 2))
  console.log(`    → ${tags.length} nhãn\n`)

  // 3. Lấy posts + xử lý hình
  console.log('3/5 Đang lấy bài viết + tải hình...')
  const rawPosts = await fetchAll('posts')
  const posts = []
  const searchIndex = []

  for (let i = 0; i < rawPosts.length; i++) {
    const p = rawPosts[i]
    process.stdout.write(`    Bài ${i + 1}/${rawPosts.length}: ${p.slug}\r`)

    const processedContent = await processContent(p.content?.rendered || '')
    const excerpt = stripHtml(p.excerpt?.rendered || '').slice(0, 200)

    posts.push({
      id: p.id,
      title: p.title?.rendered || '',
      slug: p.slug,
      date: p.date?.slice(0, 10) || '',
      excerpt,
      content: processedContent,
      category_ids: (p.categories || []).map(id => `cat_${id}`),
      tag_ids: (p.tags || []).map(id => `tag_${id}`)
    })

    searchIndex.push({
      id: p.id,
      title: p.title?.rendered || '',
      slug: p.slug,
      excerpt,
      category_ids: (p.categories || []).map(id => `cat_${id}`),
      tag_ids: (p.tags || []).map(id => `tag_${id}`)
    })
  }

  console.log(`\n    → ${posts.length} bài viết\n`)

  // 4. Lấy pages + xử lý hình
  console.log('4/5 Đang lấy trang tĩnh (pages) + tải hình...')
  const rawPages = await fetchAll('pages')

  for (let i = 0; i < rawPages.length; i++) {
    const p = rawPages[i]
    process.stdout.write(`    Trang ${i + 1}/${rawPages.length}: ${p.slug}\r`)

    const processedContent = await processContent(p.content?.rendered || '')
    const excerpt = stripHtml(p.excerpt?.rendered || '').slice(0, 200)

    posts.push({
      id: p.id,
      title: p.title?.rendered || '',
      slug: p.slug,
      date: p.date?.slice(0, 10) || '',
      excerpt,
      content: processedContent,
      category_ids: [],
      tag_ids: []
    })

    searchIndex.push({
      id: p.id,
      title: p.title?.rendered || '',
      slug: p.slug,
      excerpt,
      category_ids: [],
      tag_ids: []
    })
  }

  console.log(`\n    → ${rawPages.length} trang tĩnh\n`)

  // 5. Lưu file
  console.log('5/5 Đang lưu file...')
  fs.writeFileSync(path.join(OUTPUT_DIR, 'posts.json'), JSON.stringify(posts))
  fs.writeFileSync(path.join(OUTPUT_DIR, 'search-index.json'), JSON.stringify(searchIndex))

  const imagesCount = fs.readdirSync(IMAGES_DIR).length
  console.log(`\n✅ Hoàn thành! sites/${SITE_NAME}/`)
  console.log(`   posts.json        : ${posts.length} mục (${rawPosts.length} bài + ${rawPages.length} trang)`)
  console.log(`   categories.json   : ${categories.length} chuyên mục + ${tags.length} nhãn`)
  console.log(`   search-index.json : ${searchIndex.length} mục`)
  console.log(`   images/           : ${imagesCount} hình\n`)
}

main().catch(err => {
  console.error('\n❌ Lỗi:', err.message)
  process.exit(1)
})
