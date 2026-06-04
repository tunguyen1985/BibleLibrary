import { execSync } from 'child_process'
import { parseArgs } from 'util'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const { values } = parseArgs({
  options: {
    site: { type: 'string' },
    url:  { type: 'string' }
  },
  strict: false
})

if (!values.site || !values.url) {
  console.log('Cách dùng: node publish.js --site <tên> --url <URL>')
  console.log('Ví dụ:     node publish.js --site kytanthe --url https://kytanthe.net')
  process.exit(1)
}

const { site, url } = values

console.log(`\n🚀 Publish: ${site} ← ${url}\n`)

execSync(`node export.js --site ${site} --url ${url}`, { stdio: 'inherit', cwd: __dirname })
execSync(`node build.js ${site}`, { stdio: 'inherit', cwd: __dirname })

console.log(`\n✅ Xong! Mở dist/${site}/index.html để kiểm tra.\n`)
