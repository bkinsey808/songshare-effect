#!/usr/bin/env node
import readline from 'node:readline';
import { resolve } from 'node:path';
import fs from 'node:fs';
import { chromium } from '@playwright/test';

// Usage:
// PROFILE_DIR="/mnt/c/Users/you/path/to/repo/tmp-chrome-profile" node scripts/save-storage-state-wsl.mjs
// or: node scripts/save-storage-state-wsl.mjs /mnt/c/Users/you/path/to/repo/tmp-chrome-profile

const profileDirArg = process.argv[2];
const profileDirEnv = process.env.PROFILE_DIR;
const profileDir = profileDirArg || profileDirEnv;

if (!profileDir) {
  console.error('Error: PROFILE_DIR not provided. Either set env PROFILE_DIR or pass as first arg.');
  console.error('Example:');
  console.error('  PROFILE_DIR="/mnt/c/Users/you/path/to/repo/tmp-chrome-profile" node scripts/save-storage-state-wsl.mjs');
  process.exit(1);
}

const outPath = resolve(process.cwd(), 'tests', 'storageState.json');
fs.mkdirSync(resolve(process.cwd(), 'tests'), { recursive: true });

(async () => {
  console.log('Using profile dir:', profileDir);
  console.log('Output storageState:', outPath);

  // Quick sanity check: ensure profileDir exists
  try {
    const stat = fs.statSync(profileDir);
    if (!stat.isDirectory()) {
      console.warn('Warning: PROFILE_DIR exists but is not a directory. Proceeding anyway.');
    }
  } catch (err) {
    console.warn('Warning: PROFILE_DIR does not exist yet. Playwright will create it when launching Chrome.');
  }

  console.log('\nMake sure Google Chrome is closed (the profile dir must not be in use by another Chrome process).');
  console.log('If you prefer to sign in manually first in Windows Chrome, do that now using the same profile directory, then close Chrome before continuing.');

  // Launch persistent context with the provided profile dir. Use channel 'chrome' to prefer system Chrome.
  let context;
  try {
    // Prefer an explicit Windows Chrome binary if present (WSL -> /mnt/c/...)
    const envChrome = process.env.CHROME_EXE;
    const winChromeDefault = '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe';
    let launchOptions = { headless: false };

    if (envChrome && fs.existsSync(envChrome)) {
      console.log('Using CHROME_EXE from env:', envChrome);
      launchOptions.executablePath = envChrome;
    } else if (fs.existsSync(winChromeDefault)) {
      console.log('Found Windows Chrome at', winChromeDefault);
      launchOptions.executablePath = winChromeDefault;
    } else {
      // No explicit Windows Chrome found; attempt to use Playwright channel 'chrome'.
      console.log('No Windows Chrome binary detected at', winChromeDefault);
      console.log('Falling back to Playwright channel: chrome (this requires `npx playwright install chrome`)');
      launchOptions.channel = 'chrome';
    }

    context = await chromium.launchPersistentContext(profileDir, launchOptions);
  } catch (err) {
    console.error('Failed to launch persistent Chrome context:', err);
    if (String(err.message || err).includes("Chromium distribution 'chrome' is not found")) {
      console.error('\nSuggestion: run `npx playwright install chrome` or set CHROME_EXE to the Windows chrome path');
    }
    process.exit(2);
  }

  const page = context.pages()[0] ?? await context.newPage();
  const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
  console.log('Opening app URL:', base);
  try {
    await page.goto(base);
  } catch (err) {
    console.warn('Warning: failed to navigate to', base, err.message || err.toString());
  }

  console.log('\nWhen the browser window is ready, complete the Google sign-in interactively (if needed).');
  console.log('Press ENTER here after you have completed sign-in and closed any consent dialogs.');

  await new Promise((resolveProm) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('', async () => {
      rl.close();
      resolveProm();
    });
  });

  // Give the browser a moment to settle and ensure cookies are written
  await page.waitForTimeout(1000);

  try {
    await context.storageState({ path: outPath });
    console.log('Saved storage state to', outPath);
  } catch (err) {
    console.error('Failed to save storageState:', err);
  }

  try {
    await context.close();
  } catch (err) {
    // ignore
  }

  console.log('Done. Use tests/storageState.json in your Playwright tests (test.use or playwright.config).');
  process.exit(0);
})();
