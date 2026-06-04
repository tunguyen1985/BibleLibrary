import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getSites() {
  const sitesDir = path.join(__dirname, 'sites')
  if (!fs.existsSync(sitesDir)) return []
  return fs.readdirSync(sitesDir).filter(name => {
    const configPath = path.join(sitesDir, name, 'config.json')
    return fs.existsSync(configPath)
  })
}

function buildSite(site) {
  console.log(`\n🔨 Building: ${site}`)

  // Vite build
  execSync('npx vite build', {
    env: { ...process.env, VITE_SITE: site },
    stdio: 'inherit',
    cwd: __dirname
  })

  // Copy images sang dist/SITE/data/images/
  const imagesFrom = path.join(__dirname, 'sites', site, 'images')
  const imagesTo   = path.join(__dirname, 'dist', site, 'data', 'images')
  if (fs.existsSync(imagesFrom)) {
    fs.mkdirSync(imagesTo, { recursive: true })
    fs.cpSync(imagesFrom, imagesTo, { recursive: true })
    const count = fs.readdirSync(imagesTo).length
    console.log(`   📸 ${count} hình → dist/${site}/data/images/`)
  }

  console.log(`   ✅ dist/${site}/index.html`)
}

function generateIndex(sites) {
  const distDir = path.join(__dirname, 'dist')
  fs.mkdirSync(distDir, { recursive: true })

  const cards = sites.map(site => {
    const configPath = path.join(__dirname, 'sites', site, 'config.json')
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    const indexPath = path.join(__dirname, 'sites', site, 'data', 'search-index.json')
    const count = fs.existsSync(indexPath)
      ? JSON.parse(fs.readFileSync(indexPath, 'utf-8')).length
      : 0
    return { site, title: config.title, url: config.url, count }
  })

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Thư Viện Bài Giảng</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, 'Helvetica Neue', sans-serif;
      background: #f0f2ff; color: #2d3748; min-height: 100vh;
    }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; padding: 20px 24px;
      box-shadow: 0 2px 8px rgba(102,126,234,.4);
    }
    header h1 { font-size: 1.4rem; font-weight: 700; }
    header p { font-size: .85rem; opacity: .85; margin-top: 4px; }
    main { max-width: 640px; margin: 32px auto; padding: 0 16px 32px; }
    .site-card {
      display: block; background: white; border-radius: 12px;
      padding: 20px 24px; margin-bottom: 12px;
      text-decoration: none; color: inherit;
      box-shadow: 0 4px 12px rgba(102,126,234,.15);
      transition: box-shadow .15s, transform .15s;
      border: 1px solid #e2e8f0;
    }
    .site-card:hover {
      box-shadow: 0 6px 20px rgba(102,126,234,.25);
      transform: translateY(-2px);
    }
    .site-card-title { font-size: 1.1rem; font-weight: 600; color: #667eea; }
    .site-card-meta { font-size: .85rem; color: #718096; margin-top: 6px; }
    .badge {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; border-radius: 20px; padding: 2px 10px;
      font-size: .8rem; font-weight: 600; margin-right: 8px;
    }
  </style>
</head>
<body>
  <header>
    <h1>📚 Thư Viện Bài Giảng</h1>
    <p>Chọn bộ sưu tập để đọc</p>
  </header>
  <main>
    ${cards.map(c => `
    <a class="site-card" href="./${c.site}/index.html">
      <div class="site-card-title">${c.title}</div>
      <div class="site-card-meta">
        <span class="badge">${c.count} bài</span>
        <span>${c.url}</span>
      </div>
    </a>`).join('\n')}
  </main>
</body>
</html>`

  fs.writeFileSync(path.join(distDir, 'index.html'), html)
  console.log(`\n📋 dist/index.html (${cards.length} site)`)
}

// === MAIN ===
const arg = process.argv[2]

if (arg === '--all') {
  const sites = getSites()
  if (!sites.length) {
    console.error('❌ Không có site nào trong thư mục sites/')
    process.exit(1)
  }
  console.log(`\nBuilding ${sites.length} site(s): ${sites.join(', ')}`)
  const failed = []
  for (const site of sites) {
    try { buildSite(site) }
    catch (err) { failed.push(site); console.error(`❌ ${site}: ${err.message}`) }
  }
  generateIndex(sites)
  if (failed.length) {
    console.error(`\n⚠ Lỗi: ${failed.join(', ')}`)
    process.exit(1)
  }
} else if (arg) {
  const site = arg
  const configPath = path.join(__dirname, 'sites', site, 'config.json')
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Không tìm thấy sites/${site}/config.json`)
    console.error(`   Chạy export trước: node export.js --site ${site} --url <URL>`)
    process.exit(1)
  }
  buildSite(site)
  generateIndex(getSites())
} else {
  console.log('Cách dùng:')
  console.log('  node build.js <site>   ← build 1 site')
  console.log('  node build.js --all    ← build tất cả sites + index')
  const sites = getSites()
  if (sites.length) console.log('\nSites hiện có:', sites.join(', '))
  process.exit(1)
}
