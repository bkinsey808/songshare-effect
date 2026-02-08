import { describe, expect, it, vi } from "vitest";

import getStoredLanguage from "../stored/getStoredLanguage";
import setStoredLanguage from "../stored/setStoredLanguage";
import { persistLanguagePreferenceIfMissing } from "./persistLanguagePreference";

vi.mock("../stored/getStoredLanguage");
vi.mock("../stored/setStoredLanguage");

describe("persistLanguagePreferenceIfMissing", () => {
	it("persists when no stored preference exists", async () => {
		vi.clearAllMocks();
		vi.mocked(getStoredLanguage).mockResolvedValue(undefined);
		vi.mocked(setStoredLanguage).mockResolvedValue(undefined);

		await persistLanguagePreferenceIfMissing("es");

		expect(vi.mocked(setStoredLanguage)).toHaveBeenCalledWith("es");
	});

	it("does not persist when a preference already exists", async () => {
		vi.clearAllMocks();
		vi.mocked(getStoredLanguage).mockResolvedValue("zh");
		vi.mocked(setStoredLanguage).mockResolvedValue(undefined);

		await persistLanguagePreferenceIfMissing("es");

		expect(vi.mocked(setStoredLanguage)).not.toHaveBeenCalled();
	});

	it("swallows errors from getStoredLanguage", async () => {
		vi.clearAllMocks();
		vi.mocked(getStoredLanguage).mockRejectedValue(new Error("boom"));
		vi.mocked(setStoredLanguage).mockResolvedValue(undefined);

		await expect(persistLanguagePreferenceIfMissing("es")).resolves.toBeUndefined();
		expect(vi.mocked(setStoredLanguage)).not.toHaveBeenCalled();
	});

	it("swallows errors from setStoredLanguage", async () => {
		vi.clearAllMocks();
		vi.mocked(getStoredLanguage).mockResolvedValue(undefined);
		vi.mocked(setStoredLanguage).mockRejectedValue(new Error("boom"));

		await expect(persistLanguagePreferenceIfMissing("es")).resolves.toBeUndefined();
	});
});
