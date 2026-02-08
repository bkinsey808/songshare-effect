import { vi } from "vitest";

/**
 * Test helper to mock react-i18next useTranslation.
 */
export default function mockTranslation(): void {
	vi.doMock("react-i18next", () => ({
		useTranslation: (): { t: (key: string, def?: string) => string } => ({
			t: (key: string, def?: string): string => (typeof def === "string" ? def : key),
		}),
	}));
}
