import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const indexPath = path.resolve(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found. Run vite build first.');
  process.exit(1);
}

let htmlContent = fs.readFileSync(indexPath, 'utf-8');

// 1. Inline CSS stylesheets
htmlContent = htmlContent.replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi, (match, href) => {
  const cleanHref = href.startsWith('/') ? href.slice(1) : href;
  const filePath = path.resolve(distDir, cleanHref);
  if (fs.existsSync(filePath)) {
    console.log(`Inlining CSS: ${cleanHref}`);
    const cssContent = fs.readFileSync(filePath, 'utf-8');
    // Escape any </style> in CSS content if present
    const safeCss = cssContent.replace(/<\/style>/gi, '<\\/style>');
    return `<style>\n${safeCss}\n</style>`;
  }
  return match;
});

// Also check for link tags where href comes before rel
htmlContent = htmlContent.replace(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*\/?>/gi, (match, href) => {
  const cleanHref = href.startsWith('/') ? href.slice(1) : href;
  const filePath = path.resolve(distDir, cleanHref);
  if (fs.existsSync(filePath)) {
    console.log(`Inlining CSS: ${cleanHref}`);
    const cssContent = fs.readFileSync(filePath, 'utf-8');
    const safeCss = cssContent.replace(/<\/style>/gi, '<\\/style>');
    return `<style>\n${safeCss}\n</style>`;
  }
  return match;
});

// 2. Inline JavaScript modules
htmlContent = htmlContent.replace(/<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi, (match, src) => {
  const cleanSrc = src.startsWith('/') ? src.slice(1) : src;
  const filePath = path.resolve(distDir, cleanSrc);
  if (fs.existsSync(filePath)) {
    console.log(`Inlining JS: ${cleanSrc}`);
    const jsContent = fs.readFileSync(filePath, 'utf-8');
    // Escape </script> in JS content
    const safeJs = jsContent.replace(/<\/script>/gi, '<\\/script>');
    return `<script type="module">\n${safeJs}\n</script>`;
  }
  return match;
});

// 3. Save as dist/index.html (so the build output is literally 1 file)
fs.writeFileSync(indexPath, htmlContent, 'utf-8');

// 4. Also save a dedicated standalone copy for direct sharing/downloading
const standalonePath = path.resolve(distDir, 'smart-study-singlefile.html');
fs.writeFileSync(standalonePath, htmlContent, 'utf-8');

const rootStandalonePath = path.resolve(rootDir, 'single-file-website.html');
fs.writeFileSync(rootStandalonePath, htmlContent, 'utf-8');

const stats = fs.statSync(indexPath);
console.log(`Successfully generated 1-file website! Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
console.log(`Outputs:`);
console.log(` - ${indexPath}`);
console.log(` - ${standalonePath}`);
console.log(` - ${rootStandalonePath}`);
