import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { load } from 'cheerio';
import sanitize from 'sanitize-html';

const origin = 'https://gabriels-auto.com';
const cache = '.migration-cache';
const assetDir = 'public/media';
const dataDir = 'src/data';
const uploadPath = '/wp-content/uploads/';
const knownRoutes = new Set(['/']);
const requestedMedia = new Map();

await Promise.all([cache, assetDir, dataDir].map(dir => mkdir(dir, { recursive: true })));

function digest(text) {
  return createHash('sha256').update(text).digest('hex').slice(0, 12);
}

async function download(url, timeout = 30_000) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeout) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      if (attempt === 2) throw new Error(`${url}: ${error.message}`);
    }
  }
}

async function get(url) {
  const absolute = new URL(url, origin).href;
  const file = join(cache, digest(absolute));
  if (existsSync(file)) return readFile(file, 'utf8');
  const data = await download(absolute);
  await writeFile(file, data);
  return data.toString('utf8');
}

async function mapConcurrent(items, limit, task) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(items.length, limit) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await task(items[index], index);
    }
  }));
  return results;
}

function text(value = '') {
  return load(value, {}, false).text().replace(/\s+/g, ' ').trim();
}

function pathFor(url) {
  return decodeURI(new URL(url, origin).pathname).replace(/\/?$/, '/');
}

async function list(endpoint, fields, perPage, total) {
  const pages = Array.from({ length: Math.ceil(total / perPage) }, (_, index) => index + 1);
  const batches = await mapConcurrent(pages, 3, async page => {
    const url = `/wp-json/wp/v2/${endpoint}?per_page=${perPage}&page=${page}&_fields=${fields}`;
    const items = JSON.parse(await get(url));
    if (!Array.isArray(items)) throw new Error(`Unexpected WordPress response for ${url}`);
    return items;
  });
  return batches.flat();
}

function localMedia(value, base) {
  if (!value || /^data:/.test(value)) return '';
  const url = new URL(value, base);
  if (url.origin !== origin || !url.pathname.startsWith(uploadPath)) return url.href;
  url.search = '';
  url.hash = '';
  const extension = extname(url.pathname).toLowerCase();
  const name = basename(url.pathname, extname(url.pathname)).replace(/[^a-z0-9_-]/gi, '-').slice(0, 80);
  const file = `${name}-${digest(url.href)}${extension}`;
  requestedMedia.set(url.href, file);
  return `/media/${file}`;
}

function cleanLink(href, base) {
  if (!href || href === '#' || href.startsWith('#elementor-action')) return null;
  if (href.startsWith('#')) return href;
  let url;
  try { url = new URL(href, base); } catch { return null; }
  if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) return null;
  if (url.origin !== origin) return url.href;
  if (url.hash.startsWith('#elementor-action')) return null;
  if (url.pathname.startsWith(uploadPath)) return localMedia(url.href, base);
  const path = pathFor(url.href);
  return knownRoutes.has(path) ? `${path}${url.search}${url.hash}` : url.href;
}

function migrateBody(html, source, title) {
  const $ = load(html, {}, false);
  $('script, style, noscript, svg, template, form, iframe, .elementor-widget-form, .elementor-hidden-desktop').remove();
  const galleryImages = new Set();
  const imageBoxContent = new Set();
  $('.elementor-widget-image-box').each((_, element) => {
    const content = text($(element).html());
    if (content.length < 45) return;
    if (imageBoxContent.has(content)) $(element).remove();
    else imageBoxContent.add(content);
  });
  $('a[href]').each((_, element) => {
    const anchor = $(element);
    const href = anchor.attr('href');
    if (anchor.hasClass('e-gallery-item') && href && !anchor.find('img').length) {
      if (galleryImages.has(href)) { anchor.remove(); return; }
      galleryImages.add(href);
      const alt = anchor.attr('aria-label') || anchor.find('[aria-label]').first().attr('aria-label') || 'Vehicle repair project';
      anchor.append($('<img>').attr({ src: href, alt }));
    }
    const link = cleanLink(href, source);
    if (link) anchor.attr('href', link);
    else if (/quote|estimate|appointment/i.test(anchor.text())) anchor.attr('href', '/contact-us/');
    else anchor.removeAttr('href');
  });
  $('img').each((_, element) => {
    const image = $(element);
    const src = localMedia(image.attr('data-src') || image.attr('src'), source);
    if (!src) { image.remove(); return; }
    image.attr({ src, alt: image.attr('alt') || '', loading: 'lazy', decoding: 'async' });
  });
  $('h1').each((_, element) => {
    const heading = $(element);
    if (text(heading.html()).toLowerCase() === title.toLowerCase()) heading.remove();
    else heading.replaceWith($('<h2>').html(heading.html()).attr('id', heading.attr('id') || ''));
  });
  $('h2, h3, h4, h5, h6').each((_, element) => {
    const heading = $(element);
    if (text(heading.html()).length > 160) heading.replaceWith($('<p>').html(heading.html()));
  });
  const allowedTags = [...sanitize.defaults.allowedTags.filter(tag => !['div', 'span', 'section', 'header', 'footer', 'nav', 'aside', 'article', 'main'].includes(tag)), 'img', 'figure', 'figcaption'];
  return sanitize($.root().html() || '', {
    allowedTags,
    allowedAttributes: { '*': ['id'], a: ['href', 'aria-label'], img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'], td: ['rowspan', 'colspan'], th: ['rowspan', 'colspan', 'scope'] },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'],
  }).replace(/^\s+|\s+$/g, '').replace(/\n\s*\n/g, '\n');
}

const fields = 'id,slug,link,date,author,title,excerpt,content,featured_media,categories';
const [pageIndex, posts, categories, authorSitemap, sitemap] = await Promise.all([
  list('pages', 'id,link', 100, 34),
  list('posts', fields, 20, 12),
  list('categories', 'id,slug,link,name,count', 30, 9),
  get('/author-sitemap.xml').catch(error => { console.warn(error.message); return ''; }),
  get('/page-sitemap.xml'),
]);

const sitemapPaths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => pathFor(match[1]));
const pagePaths = new Set(pageIndex.map(page => pathFor(page.link)));
const missing = sitemapPaths.filter(path => !pagePaths.has(path));
if (missing.length) throw new Error(`Missing pages listed in WordPress sitemap: ${missing.join(', ')}`);
const authorLinks = [...authorSitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const authorIds = [...new Set(posts.map(post => post.author))];
const authors = authorLinks.length === 1 && authorIds.length === 1 ? [{ id: authorIds[0], name: 'Gabriel’s Auto Service', link: authorLinks[0] }] : [];
console.log(`Found ${pageIndex.length} pages and ${posts.length} posts. Importing their content.`);
const pages = await mapConcurrent(pageIndex, 6, async ({ id }) => JSON.parse(await get(`/wp-json/wp/v2/pages/${id}?_fields=${fields}`)));

for (const entry of [...pages, ...posts, ...categories, ...authors]) knownRoutes.add(pathFor(entry.link));
for (const post of posts) {
  const [year, month, day] = post.date.slice(0, 10).split('-');
  for (const segments of [[year], [year, month], [year, month, day]]) knownRoutes.add(`/${segments.join('/')}/`);
}
for (let page = 2; page <= Math.ceil(posts.length / 9); page++) knownRoutes.add(`/blog/page/${page}/`);

const wpHome = load(await get('/'));
const logo = wpHome('img').toArray().map(node => wpHome(node).attr('src')).find(src => src && /logo/i.test(src) && src.includes(uploadPath));
const logoPath = localMedia(logo, origin);

const records = await mapConcurrent([...pages, ...posts], 5, async entry => {
  const path = pathFor(entry.link);
  const title = text(entry.title.rendered);
  const kind = 'categories' in entry ? 'post' : 'page';
  let featured = null;
  if (entry.featured_media) {
    const media = JSON.parse(await get(`/wp-json/wp/v2/media/${entry.featured_media}?_fields=source_url,alt_text,media_details`));
    const url = media.media_details?.sizes?.large?.source_url || media.source_url;
    if (url) featured = { src: localMedia(url, entry.link), alt: media.alt_text || '' };
  }
  let html = migrateBody(entry.content.rendered, entry.link, title);
  const body = load(html, {}, false);
  const image = body('img[src]').first();
  const gallery = [];
  if (path === '/our-work/') {
    body('img[src]').each((_, element) => {
      const photo = body(element);
      const src = photo.attr('src');
      if (/\/Gabriels?-.*\.jpg$/i.test(src)) {
        if (!gallery.includes(src)) gallery.push(src);
        photo.remove();
      }
    });
    body('figure').filter((_, element) => !body(element).find('img').length && !body(element).text().trim()).remove();
    html = body.root().html();
  }
  return {
    path, title, kind, html, date: entry.date.slice(0, 10),
    excerpt: text(entry.excerpt?.rendered) || text(body('p').first().html()).slice(0, 230),
    image: featured || (image.length ? { src: image.attr('src'), alt: image.attr('alt') || '' } : null),
    categories: entry.categories || [], author: entry.author, gallery,
  };
});

const unavailableMedia = [];
await mapConcurrent([...requestedMedia], 6, async ([url, file]) => {
  const path = join(assetDir, file);
  if (existsSync(path)) return;
  try { await writeFile(path, await download(url, 22_000)); }
  catch (error) { unavailableMedia.push([`/media/${file}`, url]); console.warn(error.message); }
});
for (const record of records) {
  for (const [local, original] of unavailableMedia) {
    record.html = record.html.replaceAll(local, original);
    if (record.image?.src === local) record.image.src = original;
    record.gallery = record.gallery.map(src => src === local ? original : src);
  }
}

const pageRecords = records.filter(item => item.kind === 'page');
const postRecords = records.filter(item => item.kind === 'post');
const snapshot = {
  source: origin,
  logo: unavailableMedia.find(([local]) => local === logoPath)?.[1] || logoPath,
  pages: pageRecords,
  posts: postRecords,
  categories: categories.filter(category => category.count > 0).map(({ id, name, link }) => ({ id, name: text(name), path: pathFor(link) })),
  authors: authors.map(({ id, name, link }) => ({ id, name: text(name), path: pathFor(link) })),
};
await writeFile(join(dataDir, 'wordpress.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Imported ${pageRecords.length} pages, ${postRecords.length} posts and ${requestedMedia.size - unavailableMedia.length} local media files.`);
console.log(`Pages: ${pageRecords.map(page => page.path).join(' ')}`);
