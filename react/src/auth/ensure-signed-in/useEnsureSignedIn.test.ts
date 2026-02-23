import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ensureSignedIn from "./ensureSignedIn";
import useEnsureSignedIn from "./useEnsureSignedIn";

vi.mock("./ensureSignedIn");
const mockedEnsure = vi.mocked(ensureSignedIn);

// use a constant to avoid magic-number lint warnings
const ONE_CALL = 1;

describe("useEnsureSignedIn", () => {
	it("calls ensureSignedIn on mount with force=false by default", () => {
		mockedEnsure.mockClear();
		mockedEnsure.mockResolvedValue(undefined);

		const { rerender } = renderHook(
			(props: { force: boolean }) => {
				useEnsureSignedIn({ force: props.force });
			},
			{ initialProps: { force: false } },
		);

		expect(mockedEnsure).toHaveBeenCalledWith({ force: false });

		// rerendering with the same value shouldn't trigger again
		rerender({ force: false });
		expect(mockedEnsure).toHaveBeenCalledTimes(ONE_CALL);
	});

	it("re-invokes ensureSignedIn when force option changes", () => {
		mockedEnsure.mockClear();
		mockedEnsure.mockResolvedValue(undefined);

		const { rerender } = renderHook(
			(props: { force: boolean }) => {
				useEnsureSignedIn({ force: props.force });
			},
			{ initialProps: { force: false } },
		);

		expect(mockedEnsure).toHaveBeenCalledTimes(ONE_CALL);

		rerender({ force: true });
		expect(mockedEnsure).toHaveBeenCalledWith({ force: true });
		expect(mockedEnsure).toHaveBeenCalledTimes(ONE_CALL + ONE_CALL);
	});

	it("handles undefined options gracefully", () => {
		mockedEnsure.mockClear();
		mockedEnsure.mockResolvedValue(undefined);

		renderHook(() => {
			useEnsureSignedIn();
		});
		expect(mockedEnsure).toHaveBeenCalledWith({ force: false });
	});
});
