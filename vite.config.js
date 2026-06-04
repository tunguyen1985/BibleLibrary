import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const site = process.env.VITE_SITE
if (!site) {
  throw new Error('VITE_SITE environment variable is required. Example: VITE_SITE=kytanthe')
}

const siteDir = path.resolve(__dirname, 'sites', site)
const siteConfig = JSON.parse(fs.readFileSync(path.join(siteDir, 'config.json'), 'utf-8'))

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  base: './',
  resolve: {
    alias: {
      '@data': path.join(siteDir, 'data')
    }
  },
  define: {
    __SITE_TITLE__: JSON.stringify(siteConfig.title)
  },
  build: {
    outDir: path.join(__dirname, 'dist', site),
    emptyOutDir: true,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 10000,
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  },
  plugins: [viteSingleFile()]
})
