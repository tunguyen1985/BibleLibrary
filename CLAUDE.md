# WebApp_Reader — CLAUDE.md

## Mục đích dự án

PWA framework tạo thư viện đọc offline từ các website WordPress. Export bài viết → bundle thành single-file HTML app có Service Worker, cài được trên thiết bị, hoạt động hoàn toàn offline.

## Tech Stack

- **Build**: Vite 8 + `vite-plugin-singlefile` (mỗi site → 1 file HTML ~4-5MB)
- **Frontend**: Vanilla JS, không framework
- **Export**: Node.js + Axios (gọi WP-JSON API) + Cheerio (parse HTML)
- **PWA**: Service Worker + Web Manifest
- **Routing**: Hash-based (`/#/`, `/#/post/:slug`, `/#/settings`)
- **State**: localStorage (theme, font size)

## Cấu trúc thư mục

```
src/                  # Source code PWA
  index.html          # Template
  main.js             # Entry point
  router.js           # Hash router
  style.css           # CSS variables, themes
  components/
    home.js           # Danh sách bài / search / filter
    reader.js         # Đọc bài (xử lý YouTube embed)
    settings.js       # Font size, light/dark theme

public/               # Static assets (manifest, sw.js, icons)

sites/<name>/         # Dữ liệu từng site (KHÔNG commit ảnh lớn)
  config.json
  data/
    posts.json        # HTML đầy đủ + metadata
    search-index.json # Dữ liệu nhẹ để search
    categories.json
  images/             # Ảnh đã tải về (MD5-hashed filename)

dist/                 # Output build (generated, không edit tay)
  index.html          # Portal tổng
  <name>/
    index.html        # App đóng gói hoàn chỉnh

build.js              # Script build
export.js             # Script export WordPress → JSON
publish.js            # export + build liên tiếp
vite.config.js        # Vite config (dùng VITE_SITE env var)
```

## Các lệnh quan trọng

```bash
# Export nội dung từ WordPress
node export.js --site <name> --url <wordpress-url>

# Build một site
node build.js <name>

# Build tất cả sites + portal index
node build.js --all

# Export + build một lần
node publish.js --site <name> --url <url>

# npm shortcuts
npm run export   # node export.js
npm run build    # node build.js
npm run publish  # node publish.js
```

## Sites hiện có

| Tên | Slug | URL gốc |
|-----|------|---------|
| Kỳ Tận Thế | `kytanthe` | https://kytanthe.net |
| Tìm Hiểu Thánh Kinh | `timhieuthanhkinh` | https://timhieuthanhkinh.com |
| Tìm Hiểu Tin Lành | `timhieutinlanh` | https://timhieutinlanh.com |

## Kiến trúc pipeline

```
WordPress WP-JSON API
    ↓  (export.js)
sites/<name>/data/*.json + images/
    ↓  (build.js + Vite)
dist/<name>/index.html  ← single-file PWA
```

## Luồng dữ liệu frontend

- `main.js` khởi tạo router, load component đúng route
- **Home**: load `search-index.json` → render danh sách, debounce search 200ms
- **Reader**: load `posts.json` → hiển thị bài, xử lý YouTube iframe → thumbnail link
- **Settings**: đọc/ghi localStorage (`theme`, `fontSize`)

## Quy tắc Service Worker

- Pre-cache khi install: root, manifest, JSON data files
- Cache-first cho static assets
- Cache-on-access cho images (store riêng)
- Fallback về `index.html` khi offline

## Quy ước code

- Không dùng framework — giữ vanilla JS thuần
- Component = ES module export một hàm render duy nhất
- Dynamic import cho components (lazy load khi navigate)
- CSS variables cho toàn bộ theming (`--bg`, `--text`, `--primary`, v.v.)
- Không thêm dependencies nặng — mục tiêu bundle nhỏ

## Lưu ý khi sửa

- Khi sửa `src/`, phải chạy lại `node build.js <name>` để cập nhật `dist/`
- Vite đọc site data qua alias `@data` → `sites/<VITE_SITE>/data/`
- `vite-plugin-singlefile` inline tất cả JS/CSS vào HTML — không có file riêng lẻ
- YouTube embed bị chuyển thành thumbnail + link vì file:// protocol không cho iframe
- Ảnh lưu theo MD5 hash của URL gốc để tránh trùng và handle URL đổi

## Điều không làm

- Không sửa file trong `dist/` trực tiếp — chúng được generate
- Không thêm framework (React/Vue) vào frontend
- Không dùng `npm run dev` để test offline — phải build và kiểm tra `dist/`
