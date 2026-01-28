import { renderHook, waitFor } from "@testing-library/react";
import { type Location, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import mockLocaleWithLang from "@/react/test-utils/mockLocaleWithLang";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import getPathWithoutLang from "@/shared/language/getPathWithoutLang";

import useNavigation from "./useNavigation";

/**
 * We mock `useLocale` and
 * `useLocation` to simulate language-prefixed routes and make test cases
 * deterministic and independent of react-i18next runtime state.
 */
vi.mock("@/react/language/locale/useLocale");
vi.mock("@/shared/language/buildPathWithLang");
vi.mock("@/shared/language/getPathWithoutLang");
vi.mock("react-router-dom");

/**
 * These tests focus on the hook's active-path detection and controlled vs
 * uncontrolled `actionsExpanded` behavior.
 */
describe("useNavigation", () => {
	it("defaults to actions expanded when uncontrolled", () => {
		mockLocaleWithLang();
		vi.mocked(useLocation).mockReturnValue({
			pathname: "/en",
			search: "",
			hash: "",
			state: undefined,
			key: "a",
		} as Location);

		const { result } = renderHook(() => useNavigation({}));
		expect(result.current.isHeaderActionsExpanded).toBe(true);
		expect(result.current.isActionsVisible).toBe(true);
	});

	it("toggleActions updates internal state and calls callback when uncontrolled", async () => {
		mockLocaleWithLang();
		vi.mocked(useLocation).mockReturnValue({
			pathname: "/en",
			search: "",
			hash: "",
			state: undefined,
			key: "b",
		} as Location);

		const onChange = vi.fn();
		const { result } = renderHook(() => useNavigation({ onActionsExpandedChange: onChange }));

		// initially true per implementation
		expect(result.current.isHeaderActionsExpanded).toBe(true);

		// The hook invokes the `onActionsExpandedChange` callback synchronously
		// while the hook's internal state is updated asynchronously by React.
		// Assert the callback immediately and use `waitFor` to observe the
		// resulting internal state change without relying on deprecated `act`.
		result.current.toggleActions();
		expect(onChange).toHaveBeenCalledWith(false);

		// wait for internal state update to be applied
		await waitFor(() => {
			expect(result.current.isHeaderActionsExpanded).toBe(false);
		});
	});

	it("toggleActions calls callback but does not override controlled prop", () => {
		mockLocaleWithLang();
		vi.mocked(useLocation).mockReturnValue({
			pathname: "/en",
			search: "",
			hash: "",
			state: undefined,
			key: "c",
		} as Location);

		const onChange = vi.fn();
		const { result } = renderHook(() =>
			useNavigation({ actionsExpanded: false, onActionsExpandedChange: onChange }),
		);

		expect(result.current.isHeaderActionsExpanded).toBe(false);

		// toggle and assert callback is called; controlled prop should still hold
		result.current.toggleActions();
		expect(onChange).toHaveBeenCalledWith(true);
		expect(result.current.isHeaderActionsExpanded).toBe(false);
	});

	it("isActive treats home (empty path) as active for language root", () => {
		mockLocaleWithLang();
		// Simulate being at the language root
		vi.mocked(useLocation).mockReturnValue({
			pathname: "/en",
			search: "",
			hash: "",
			state: undefined,
			key: "e",
		} as Location);
		vi.mocked(getPathWithoutLang).mockReturnValue("/");

		const { result } = renderHook(() => useNavigation({}));
		expect(result.current.isActive("")).toBe(true);
	});

	it("isActive treats home (empty path) as active when dashboard path present", () => {
		mockLocaleWithLang();
		// Simulate being on dashboard
		vi.mocked(useLocation).mockReturnValue({
			pathname: "/en/dashboard",
			search: "",
			hash: "",
			state: undefined,
			key: "f",
		} as Location);
		vi.mocked(getPathWithoutLang).mockReturnValue("/dashboard");

		const { result } = renderHook(() => useNavigation({}));
		expect(result.current.isActive("")).toBe(true);
	});

	it("isActive matches explicit paths and descendants", () => {
		mockLocaleWithLang();
		// For this test buildPathWithLang will produce the canonical path
		vi.mocked(buildPathWithLang).mockImplementation(
			(path: string, language: string) => `/${language}${path}`,
		);

		// exact match
		vi.mocked(useLocation).mockReturnValue({
			pathname: "/en/about",
			search: "",
			hash: "",
			state: undefined,
			key: "g",
		} as Location);
		const { result: r1 } = renderHook(() => useNavigation({}));
		expect(r1.current.isActive("about")).toBe(true);

		// descendant path should also be active
		vi.mocked(useLocation).mockReturnValue({
			pathname: "/en/about/team",
			search: "",
			hash: "",
			state: undefined,
			key: "h",
		} as Location);
		const { result: r2 } = renderHook(() => useNavigation({}));
		expect(r2.current.isActive("about")).toBe(true);

		// non-matching path is not active
		vi.mocked(useLocation).mockReturnValue({
			pathname: "/en/contact",
			search: "",
			hash: "",
			state: undefined,
			key: "i",
		} as Location);
		const { result: r3 } = renderHook(() => useNavigation({}));
		expect(r3.current.isActive("about")).toBe(false);
	});
});
