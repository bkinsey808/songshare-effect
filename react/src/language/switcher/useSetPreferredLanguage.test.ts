import { renderHook } from "@testing-library/react";
import { useLocation, useNavigate, type Location } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import setStoredLanguage from "../stored/setStoredLanguage";
import useSetPreferredLanguage from "./useSetPreferredLanguage";

vi.mock("react-router-dom");
vi.mock("../stored/setStoredLanguage");

describe("useSetPreferredLanguage", () => {
	it("persists preference and navigates by default", () => {
		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);
		vi.mocked(useLocation).mockReturnValue({
			pathname: "/en/some/path",
			search: "",
			hash: "",
			state: undefined,
			key: "t",
		} as Location);
		vi.mocked(setStoredLanguage).mockResolvedValue(undefined);

		const { result } = renderHook(() => useSetPreferredLanguage());
		result.current("es");

		expect(vi.mocked(setStoredLanguage)).toHaveBeenCalledWith("es");
		expect(mockNavigate).toHaveBeenCalledWith("/es/some/path", { replace: false });
	});

	it("respects opts and does not navigate when asked", () => {
		const mockNavigate = vi.fn();
		vi.mocked(useNavigate).mockReturnValue(mockNavigate);
		vi.mocked(useLocation).mockReturnValue({
			pathname: "/en/other",
			search: "",
			hash: "",
			state: undefined,
			key: "u",
		} as Location);
		vi.mocked(setStoredLanguage).mockResolvedValue(undefined);

		const { result } = renderHook(() => useSetPreferredLanguage());
		result.current("zh", { navigate: false });

		expect(vi.mocked(setStoredLanguage)).toHaveBeenCalledWith("zh");
		expect(mockNavigate).not.toHaveBeenCalled();
	});
});
