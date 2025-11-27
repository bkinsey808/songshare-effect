import { type Provider, guardAsProvider } from "@/shared/providers";

export function isProvider(
	value: unknown,
): value is (typeof Provider)[keyof typeof Provider] {
	try {
		guardAsProvider(value);
		return true;
	} catch {
		return false;
	}
}
