/* eslint-disable @typescript-eslint/no-explicit-any, no-console, unicorn/no-null, no-await-in-loop, @typescript-eslint/explicit-module-boundary-types */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env?.['PLAYWRIGHT_BASE_URL'] ?? 'https://localhost:5173';
const ORIGIN = new URL(BASE_URL).origin;
const WAIT_TIMEOUT = 10_000;
const SAMPLE_WAIT = 5000;
const MAX_LOGS = 50;
const SNIPPET_LEN = 2000;
const START_IDX = 0;
const FIRST_INDEX = 0;
const MIN_OPTIONS = 1;
const MATCH_RMS_GROUP = 1;
const RMS_THRESHOLD = 0;

// Allow overriding the device match via env var for local runs. If provided, the test will fail
// if no device matches the substring (case-insensitive). Otherwise it will skip when no
// Voicemeeter-like device is present (useful for CI/hardware-absent environments).
const DEVICE_SUBSTRING = (process.env['PLAYWRIGHT_DEVICE_SUBSTRING'] || process.env['VOICEMEETER_DEVICE_SUBSTRING'] || '').trim();

test('voicemeeter input selection should produce non-zero RMS when connected', async ({ page }) => {
  const consoleMessages: { type: string; text: string }[] = [];
  page.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));

  await page.goto(`${BASE_URL}/test-pages/butterchurn-port-test.html`, { waitUntil: 'load' });

  // Grant microphone permission so device labels appear and getUserMedia won't prompt
  try {
    await page.context().grantPermissions(['microphone'], { origin: ORIGIN });
  } catch (error) {
    // Some environments may not support grantPermissions; continue
    // eslint-disable-next-line no-console
    console.warn('grantPermissions failed (continuing):', String(error));
  }

  const startBtn = page.locator('text=Start visualization').first();
  await startBtn.waitFor({ state: 'visible', timeout: 5000 });
  await startBtn.click();

  // Ensure getUserMedia is requested once to populate labels (some browsers require this to fill device labels)
  try {
    await page.evaluate(async () => {
      try { await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { /* ignore */ }
    });
  } catch {
    // ignore
  }

  // Wait for the audio inputs select to populate with real options
  await page.waitForFunction(({ minOptions, firstIndex }) => {
    const sel = document.querySelector<HTMLSelectElement>('#audio-inputs');
    if (!sel) { return false; }
    if (sel.options.length < minOptions) { return false; }
    const firstOpt = sel.options.item(firstIndex);
    if (!firstOpt) { return false; }
    const firstText = (firstOpt.textContent || '').toLowerCase();
    if (firstText.includes('no audio inputs') || firstText.includes('permission')) { return false; }
    return true;
  }, { minOptions: MIN_OPTIONS, firstIndex: FIRST_INDEX }, { timeout: WAIT_TIMEOUT });

  const deviceList = await page.$$eval('#audio-inputs option', (opts) => opts.map((opt) => ({ value: (opt as HTMLOptionElement).value, text: (opt.textContent || '').trim() })));

  // Find a device to use. Priority: 1) explicit DEVICE_SUBSTRING env var (fail if not found),
  // 2) a Voicemeeter-like device by heuristic, 3) skip the test on CI if none found.
  // Default to 'Voicemeeter Out A1' unless overridden by env var
  const substring = DEVICE_SUBSTRING || 'Voicemeeter Out A1';
  // Log which substring we're looking for — captured by Playwright console collection
  // eslint-disable-next-line no-console
  console.log('Looking for audio device matching substring:', substring);
  const voicemeeterDevice = deviceList.find((dev) => new RegExp(substring, 'i').test(`${dev.text} ${dev.value}`));

  if (!voicemeeterDevice) {
    // Dump device list to console for diagnostics
    // eslint-disable-next-line no-console
    console.error('No matching device found. Available devices:');
    // eslint-disable-next-line no-console
    console.error(JSON.stringify(deviceList));
    // Capture a screenshot to help diagnose UI/device listing issues (headed tests only)
    try {
      await page.screenshot({ path: 'voicemeeter-device-list-screenshot.png' });
    } catch {
      // ignore screenshot failures
    }

    if (DEVICE_SUBSTRING) {
      // Fail loudly if user requested a specific device but none matched
      // eslint-disable-next-line no-console
      console.error('Requested device substring:', DEVICE_SUBSTRING);
      throw new Error(`No device matching substring "${DEVICE_SUBSTRING}" found. See available devices in the logs.`);
    }

    // No suitable device found — skip the test in hardware-absent environments
    test.skip(true, 'No Voicemeeter/VB-Audio-like device found on this machine; skipping hardware-dependent test');
  }

  // Select and connect the matched device
  if (!voicemeeterDevice) { throw new Error('Unexpected: voicemeeterDevice missing after checks'); }
  await page.selectOption('#audio-inputs', voicemeeterDevice.value ? { value: voicemeeterDevice.value } : voicemeeterDevice.value);
  const useBtn = page.locator('#use-input-device');
  await useBtn.click();

  // Wait for status to indicate the selected device was connected
  await page.waitForFunction(() => {
    const st = document.querySelector('#status');
    if (!st) { return false; }
    const txt = (st.textContent || '').toLowerCase();
    return txt.includes('selected input connected') || txt.includes('selected input started') || txt.includes('selected input connected to visualizer');
  }, {}, { timeout: WAIT_TIMEOUT });

  // Trigger sampling and wait for result
  const sampleBtn = page.locator('#diag-sample-rms');
  await sampleBtn.click();

  await page.waitForFunction(() => {
    const out = document.querySelector('#diag-output');
    if (!out) { return false; }
    const t = (out.textContent || '').toLowerCase();
    return t.includes('sampled rms') || t.includes('no source connected');
  }, {}, { timeout: SAMPLE_WAIT });

  const diagText = (await page.locator('#diag-output').textContent()) || '';
  if (diagText.toLowerCase().includes('no source connected')) {
    // eslint-disable-next-line no-console
    console.error('voicemeeter.spec.consoleMessages:', JSON.stringify(consoleMessages.slice(START_IDX, MAX_LOGS)));
    const preTexts = await page.$$eval('pre', (elements) => elements.map((el) => (el.textContent || '')));
    const snippets = preTexts.map((t) => t.slice(START_IDX, SNIPPET_LEN));
    // eslint-disable-next-line no-console
    console.error('voicemeeter.spec.preTexts:', JSON.stringify(snippets));
    throw new Error('No source connected to sample; ensure the selected device is producing audio and permissions are granted');
  }

  const match = diagText.match(/sampled rms:\s*([0-9]+(?:\.[0-9]+)?)/i);
  expect(match, 'Expected Sampled RMS output').not.toBeNull();
  const rmsText = match?.[MATCH_RMS_GROUP] ?? '0';
  const rms = Number.parseFloat(rmsText);
  // Ensure RMS is greater than zero (non-silent)
  expect(rms > RMS_THRESHOLD, `Expected RMS > ${RMS_THRESHOLD} but got ${rms}`).toBeTruthy();
});
