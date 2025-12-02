import { mkdir } from "node:fs/promises";

export default async function ensureDir(dir: string): Promise<void> {
	await mkdir(dir, { recursive: true });
}
