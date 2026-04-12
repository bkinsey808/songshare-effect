import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import isPlainObject from './utils';
import path from 'node:path';

const CACHE_DIR = path.join(process.cwd(), '.cache', 'llm');

async function ensureDir(): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

function keyFor(obj: unknown): string {
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return crypto.createHash('sha256').update(str).digest('hex');
}

export async function getCached(keyObj: unknown): Promise<string | undefined> {
  await ensureDir();
  const key = keyFor(keyObj);
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (isPlainObject(parsed) && 'text' in parsed) {
      const val = parsed['text'];
      if (typeof val === 'string') { return val; }
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function setCached(keyObj: unknown, text: string): Promise<void> {
  await ensureDir();
  const key = keyFor(keyObj);
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  await fs.writeFile(filePath, JSON.stringify({ text, ts: Date.now() }), 'utf8');
}
