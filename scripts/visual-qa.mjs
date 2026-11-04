import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import sharp from 'sharp';

const baseUrl = (process.env.VISUAL_QA_BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const outputRoot = process.env.VISUAL_QA_OUTPUT || join('outputs', 'visual-qa', new Date().toISOString().replace(/[:.]/g, '-'));

const routes = [
  '/',
  '/experiencias',
  '/grupos-y-retiros',
  '/nuestro-proyecto',
  '/como-llegar',
  '/estadia',
  '/familion',
  '/achala-viva',
  '/escuelas',
  '/gondorbows',
  '/el-vuelo-del-condor',
  '/organizamos-tu-experiencia',
  '/inti-raymi',
  '/pachamama-fest',
  '/despertar',
  '/coliving',
  '/ciclo-vital-femenino',
  '/killa-raymi',
  '/alma-de-lobo',
  '/sunset-y-rio',
  '/empresas',
  '/cordoba-fly-fishing',
  '/voluntariado',
  '/reforestacion',
  '/brote-ronda-de-mujeres',
  '/festival-raiz-sonora',
  '/terminos-y-condiciones',
  '/politica-de-privacidad',
];

const criticalRoutes = new Set([
  '/',
  '/experiencias',
  '/grupos-y-retiros',
  '/nuestro-proyecto',
  '/como-llegar',
  '/estadia',
]);

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'compact-desktop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
];

const slugFor = route => route === '/' ? 'home' : route.slice(1).replaceAll('/', '--');

await mkdir(outputRoot, { recursive: true });
const systemChrome = process.env.PLAYWRIGHT_CHROME_PATH
  || (existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : undefined);
const browser = await chromium.launch({
  ...(systemChrome ? { executablePath: systemChrome } : {}),
  ...(!baseUrl.startsWith('http://127.0.0.1') && process.env.HTTPS_PROXY
    ? { proxy: { server: process.env.HTTPS_PROXY } }
    : {}),
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const results = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      serviceWorkers: 'block',
      reducedMotion: 'reduce',
      ignoreHTTPSErrors: true,
    });

    for (const route of routes) {
      const page = await context.newPage();
      const runtimeErrors = [];
      page.on('pageerror', error => runtimeErrors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error' && !message.text().includes('favicon')) runtimeErrors.push(message.text());
      });

      const url = `${baseUrl}${route}`;
      const record = { route, viewport: viewport.name, url, issues: [], runtimeErrors };

      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        if (response && !response.ok()) record.issues.push({ type: 'http', detail: `HTTP ${response.status()}` });

        await page.waitForFunction(() => !document.getElementById('loader-container'), null, { timeout: 15_000 }).catch(() => {});
        await page.waitForTimeout(700);

        // Visit the whole page so lazy images, content-visibility and reveal observers are exercised.
        await page.evaluate(async () => {
          const step = Math.max(320, Math.round(window.innerHeight * 0.75));
          for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise(resolve => setTimeout(resolve, 35));
          }
          window.scrollTo(0, document.documentElement.scrollHeight);
        });
        await page.waitForTimeout(700);

        const layout = await page.evaluate(() => {
          const visible = element => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0.01 && rect.width > 1 && rect.height > 1;
          };
          const describe = element => {
            const id = element.id ? `#${element.id}` : '';
            const classes = typeof element.className === 'string'
              ? `.${element.className.trim().split(/\s+/).slice(0, 3).join('.')}`
              : '';
            return `${element.tagName.toLowerCase()}${id}${classes}`.slice(0, 180);
          };
          const viewportWidth = document.documentElement.clientWidth;
          const overflow = [];
          const clippedText = [];
          const all = [...document.body.querySelectorAll('*')];

          for (const element of all) {
            if (!visible(element)) continue;
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            const position = style.position;
            const isPageWidthWrapper = rect.width >= viewportWidth - 1 && rect.left <= 1;
            if (!isPageWidthWrapper && position !== 'absolute' && rect.width < viewportWidth * 2 && (rect.left < -2 || rect.right > viewportWidth + 2)) {
              overflow.push({ element: describe(element), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) });
            }

            const text = element.childElementCount === 0 ? element.textContent?.trim() : '';
            const clipsOverflow = ['hidden', 'clip'].includes(style.overflowX) || ['hidden', 'clip'].includes(style.overflow);
            if (text && text.length > 3 && clipsOverflow && element.scrollWidth > element.clientWidth + 2) {
              clippedText.push({ element: describe(element), text: text.slice(0, 100), clientWidth: element.clientWidth, scrollWidth: element.scrollWidth });
            }
          }

          const brokenImages = [...document.images]
            .filter(image => visible(image) && image.complete && image.naturalWidth === 0)
            .map(image => ({ src: image.currentSrc || image.src, alt: image.alt }));

          const hiddenReveals = [...document.querySelectorAll('[data-reveal]')]
            .filter(element => {
              const rect = element.getBoundingClientRect();
              return rect.top < window.innerHeight && rect.bottom > 0 && Number(getComputedStyle(element).opacity) < 0.1;
            })
            .map(describe);

          const header = document.querySelector('[data-header-main-row]');
          const headerItems = header
            ? [...header.querySelectorAll(':scope > *')].filter(visible).map(element => {
                const rect = element.getBoundingClientRect();
                return { element: describe(element), left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
              })
            : [];
          const headerCollisions = [];
          for (let index = 0; index < headerItems.length; index += 1) {
            for (let otherIndex = index + 1; otherIndex < headerItems.length; otherIndex += 1) {
              const a = headerItems[index];
              const b = headerItems[otherIndex];
              const horizontal = Math.min(a.right, b.right) - Math.max(a.left, b.left);
              const vertical = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
              if (horizontal > 2 && vertical > 2) headerCollisions.push({ a: a.element, b: b.element });
            }
          }

          const wrappedDesktopNav = window.innerWidth >= 1024
            ? [...document.querySelectorAll('header nav > ul > li > a')]
                .filter(visible)
                .filter(anchor => {
                  const lineHeight = Number.parseFloat(getComputedStyle(anchor).lineHeight);
                  return Number.isFinite(lineHeight) && anchor.getBoundingClientRect().height > lineHeight * 1.8;
                })
                .map(anchor => ({ element: describe(anchor), text: anchor.textContent?.trim() }))
            : [];

          return {
            bodyScrollWidth: document.body.scrollWidth,
            documentScrollWidth: document.documentElement.scrollWidth,
            viewportWidth,
            overflow: overflow.slice(0, 30),
            clippedText: clippedText.slice(0, 30),
            brokenImages,
            hiddenReveals,
            headerCollisions,
            wrappedDesktopNav,
          };
        });

        if (layout.bodyScrollWidth > layout.viewportWidth + 2 || layout.documentScrollWidth > layout.viewportWidth + 2) {
          record.issues.push({ type: 'horizontal-overflow', detail: layout });
        }
        if (layout.overflow.length) record.issues.push({ type: 'overflowing-elements', detail: layout.overflow });
        if (layout.clippedText.length) record.issues.push({ type: 'clipped-text', detail: layout.clippedText });
        if (layout.brokenImages.length) record.issues.push({ type: 'broken-images', detail: layout.brokenImages });
        if (layout.hiddenReveals.length) record.issues.push({ type: 'hidden-reveals', detail: layout.hiddenReveals });
        if (layout.headerCollisions.length) record.issues.push({ type: 'header-collision', detail: layout.headerCollisions });
        if (layout.wrappedDesktopNav.length) record.issues.push({ type: 'wrapped-desktop-nav', detail: layout.wrappedDesktopNav });

        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(250);
        const screenshotPath = join(outputRoot, `${viewport.name}--${slugFor(route)}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false, animations: 'disabled' });
        record.screenshot = screenshotPath;

        if (criticalRoutes.has(route) && ['mobile', 'desktop'].includes(viewport.name)) {
          const fullPath = join(outputRoot, `${viewport.name}--${slugFor(route)}--full.png`);
          await page.screenshot({ path: fullPath, fullPage: true, animations: 'disabled' });
          record.fullScreenshot = fullPath;
        }
      } catch (error) {
        record.issues.push({ type: 'navigation', detail: error.message });
      } finally {
        results.push(record);
        await page.close();
      }
    }

    await context.close();
  }
} finally {
  await browser.close();
}

for (const viewport of viewports) {
  const records = results.filter(record => record.viewport === viewport.name && record.screenshot);
  if (!records.length) continue;
  const thumbWidth = viewport.name === 'desktop' ? 360 : viewport.name === 'compact-desktop' ? 320 : 260;
  const thumbHeight = Math.round(thumbWidth * viewport.height / viewport.width);
  const columns = viewport.name === 'desktop' ? 4 : 3;
  const rows = Math.ceil(records.length / columns);
  const labelHeight = 32;
  const canvas = sharp({
    create: {
      width: columns * thumbWidth,
      height: rows * (thumbHeight + labelHeight),
      channels: 4,
      background: '#efece4',
    },
  });

  const composites = [];
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const left = (index % columns) * thumbWidth;
    const top = Math.floor(index / columns) * (thumbHeight + labelHeight);
    const image = await sharp(record.screenshot).resize(thumbWidth, thumbHeight, { fit: 'cover', position: 'top' }).png().toBuffer();
    const label = Buffer.from(`<svg width="${thumbWidth}" height="${labelHeight}"><rect width="100%" height="100%" fill="#173127"/><text x="10" y="21" fill="white" font-family="Arial" font-size="13">${record.route.replaceAll('&', '&amp;')}</text></svg>`);
    composites.push({ input: image, left, top });
    composites.push({ input: label, left, top: top + thumbHeight });
  }

  await canvas.composite(composites).png().toFile(join(outputRoot, `contact-sheet--${viewport.name}.png`));
}

const failed = results.filter(record => record.issues.length || record.runtimeErrors.length);
await writeFile(join(outputRoot, 'report.json'), JSON.stringify({ baseUrl, outputRoot, routes, viewports, results }, null, 2));

console.log(`Visual QA complete: ${results.length} route/viewport combinations.`);
console.log(`Issues: ${failed.length}. Artifacts: ${outputRoot}`);
for (const record of failed) {
  const kinds = [...new Set([...record.issues.map(issue => issue.type), ...(record.runtimeErrors.length ? ['runtime-error'] : [])])];
  console.log(`- ${record.viewport} ${record.route}: ${kinds.join(', ')}`);
}

if (failed.length) process.exitCode = 1;

