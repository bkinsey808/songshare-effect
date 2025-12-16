import { chromium } from 'playwright';

const RESPONSE_THRESHOLD = 400;
const WAIT_MS = 2000;
const PRE_SAMPLE_LIMIT = 5;
const PAGE_TIMEOUT = 20_000;

try {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.on('console', (msg) => { console.error('PAGE_CONSOLE', msg.type(), msg.text()); });
  page.on('pageerror', (err) => { console.error('PAGE_ERROR', err); });
  page.on('response', (res) => {
    if (res.status() >= RESPONSE_THRESHOLD) {
      console.error('PAGE_RESPONSE', res.status(), res.url());
    }
  });

  try {
    await page.goto('https://127.0.0.1:5173/test-pages/butterchurn-port-test.html', { waitUntil: 'load', timeout: PAGE_TIMEOUT });
    await page.waitForTimeout(WAIT_MS);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const rawUsingPort = /** @type {unknown} */ (await page.evaluate(() => globalThis.__butterchurn_using_port ?? undefined));
    const usingPort = typeof rawUsingPort === 'boolean' ? rawUsingPort : undefined;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const rawRenderFlag = /** @type {unknown} */ (await page.evaluate(() => globalThis.__butterchurn_render_active ?? undefined));
    const renderFlag = typeof rawRenderFlag === 'boolean' ? rawRenderFlag : undefined;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const rawPreTexts = /** @type {unknown} */ (await page.$$eval('pre', (els) => els.map((el) => el.textContent || '')));
    const preTexts = Array.isArray(rawPreTexts) ? rawPreTexts.map(String) : [];
    const canvasExists = await page.evaluate(() => !!document.querySelector('canvas'));
    console.error('DEBUG usingPort=', usingPort, 'renderFlag=', renderFlag, 'preTexts=', preTexts.slice(undefined, PRE_SAMPLE_LIMIT), 'canvasExists=', canvasExists);
  } catch (error) {
    console.error('SCRIPT ERROR', error);
  } finally {
    await browser.close();
  }
} catch (error) {
  console.error('debug-butterchurn-port-page failed:', error);
}