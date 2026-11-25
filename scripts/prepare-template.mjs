import { readFile, writeFile, mkdir, copyFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, basename, resolve } from 'node:path';
import { load } from 'cheerio';

const base = 'https://cras-three.vercel.app/cras-main/';
const root = resolve('public/cras');
const pending = new Set();
await mkdir('src/templates', { recursive: true });
await mkdir('public/brand', { recursive: true });
await copyFile('../logo-header.svg', 'public/brand/logo-header.svg');
await copyFile('../logo-footer-1.svg', 'public/brand/logo-footer.svg');
const sourceFiles = (await readdir('.template-cache')).filter(file => file.endsWith('.html'));
for (const file of sourceFiles) {
  const html = await readFile(`.template-cache/${file}`, 'utf8');
  await writeFile(`src/templates/${file}`, html);
  const $ = load(html);
  $('[src], [href], [data-src], [style]').each((_, element) => {
    for (const key of ['src', 'href', 'data-src']) {
      const value = $(element).attr(key);
      if (value?.startsWith('assets/')) pending.add(new URL(value.replaceAll('//', '/'), base).href);
    }
    for (const match of ($(element).attr('style') || '').matchAll(/url\(['"]?([^)'"\s]+)/g)) {
      if (match[1].startsWith('assets/')) pending.add(new URL(match[1], base).href);
    }
  });
}
const completed = new Set();
while (pending.size) {
  const batch = [...pending].slice(0, 8);
  batch.forEach(url => pending.delete(url));
  await Promise.all(batch.map(async url => {
    if (completed.has(url)) return;
    completed.add(url);
    const relative = new URL(url).pathname.replace('/cras-main/assets/', '');
    const file = resolve(root, relative);
    if (!file.startsWith(root + '/'.replace('/', process.platform === 'win32' ? '\\' : '/'))) throw Error('Invalid asset path');
    await mkdir(dirname(file), { recursive: true });
    const localName = basename(file) + (file.endsWith('.js') ? '.descarga' : '');
    const supplied = resolve('../Car Repair & Auto Services_files', localName);
    if (existsSync(supplied)) await copyFile(supplied, file);
    else if (!existsSync(file)) {
      const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
      if (!response.ok) { console.warn('Unavailable template asset', response.status, url); return; }
      await writeFile(file, Buffer.from(await response.arrayBuffer()));
    }
    if (file.endsWith('.css')) {
      let css = await readFile(file, 'utf8');
      for (const match of css.matchAll(/url\(['"]?([^)'"\s]+)/g)) {
        if (/^(data:|https?:|#)/.test(match[1])) continue;
        const next = new URL(match[1], url).href;
        if (next.startsWith(base + 'assets/') && !completed.has(next)) pending.add(next);
      }
      if (basename(file) === 'style.css') {
        css = css.replace(/^@import\s+url\(.*\);?\s*$/gm, '');
        css = css.replaceAll('font-family: Oxanium;', 'font-family: var(--heading-font-family);')
          .replaceAll('font-family: Sarabun;', 'font-family: var(--body-font-family);')
          .replaceAll('font-family: Baskervville;', 'font-family: var(--body-font-family);');
        await writeFile(file, css);
      }
    }
  }));
}
await mkdir('public/fonts', { recursive: true });
let fontCSS = '';
for (const family of ['inter', 'montserrat']) {
  const url = `https://gabriels-auto.com/wp-content/uploads/elementor/google-fonts/css/${family}.css`;
  const response = await fetch(url);
  let css = await response.text();
  const matches = [...new Set([...css.matchAll(/url\(['"]?([^)'"\s]+)/g)].map(match => match[1]))];
  await Promise.all(matches.map(async source => {
    const absolute = new URL(source, url).href;
    const file = basename(new URL(absolute).pathname);
    if (!existsSync(`public/fonts/${file}`)) {
      const font = await fetch(absolute);
      if (!font.ok) throw Error(`Font download failed: ${absolute}`);
      await writeFile(`public/fonts/${file}`, Buffer.from(await font.arrayBuffer()));
    }
    css = css.replaceAll(source, `/fonts/${file}`);
  }));
  fontCSS += css + '\n';
}
await writeFile('public/fonts/wordpress.css', fontCSS);
console.log(`Prepared ${sourceFiles.length} original templates and ${completed.size} assets, plus the supplied logos and WordPress fonts.`);
