import { type Provider, guardAsProvider } from "@/shared/providers";

export const isProvider = (
	value: unknown,
): value is (typeof Provider)[keyof typeof Provider] => {
	try {
		guardAsProvider(value);
		return true;
	} catch {
		return false;
	}
};
