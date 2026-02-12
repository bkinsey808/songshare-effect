import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import makeAppSlice from "@/react/lib/test-utils/makeAppSlice";

import makeEventLibraryEntry from "../test-utils/makeEventLibraryEntry.mock";
import useEventLibraryCard from "./useEventLibraryCard";

describe("useEventLibraryCard", () => {
	it("start and cancel confirming toggle isConfirming", async () => {
		const entry = makeEventLibraryEntry();
		useAppStore.setState(makeAppSlice({ removeEventFromLibrary: () => Effect.succeed(undefined) }));

		const { result } = renderHook(() => useEventLibraryCard({ entry }));

		expect(result.current.isConfirming).toBe(false);
		expect(result.current.isDeleting).toBe(false);

		result.current.startConfirming();
		await waitFor(() => {
			expect(result.current.isConfirming).toBe(true);
		});

		result.current.cancelConfirming();
		await waitFor(() => {
			expect(result.current.isConfirming).toBe(false);
		});
	});

	it("handleConfirm calls remove and resets state on success", async () => {
		const entry = makeEventLibraryEntry();
		const removeSpy = vi.fn(() => Effect.succeed(undefined));
		useAppStore.setState(makeAppSlice({ removeEventFromLibrary: removeSpy }));

		const { result } = renderHook(() => useEventLibraryCard({ entry }));

		// start confirmation then confirm
		result.current.startConfirming();
		await waitFor(() => {
			expect(result.current.isConfirming).toBe(true);
		});

		result.current.handleConfirm();

		await waitFor(() => {
			expect(result.current.isDeleting).toBe(false);
			expect(result.current.isConfirming).toBe(false);
		});
		expect(removeSpy).toHaveBeenCalledWith({ event_id: entry.event_id });
	});

	it("handleConfirm resets state on failure", async () => {
		const entry = makeEventLibraryEntry();
		const removeSpy = vi.fn(() => Effect.fail(new Error("fail")));
		useAppStore.setState(makeAppSlice({ removeEventFromLibrary: removeSpy }));

		const { result } = renderHook(() => useEventLibraryCard({ entry }));

		result.current.startConfirming();
		await waitFor(() => {
			expect(result.current.isConfirming).toBe(true);
		});

		result.current.handleConfirm();

		await waitFor(() => {
			expect(result.current.isDeleting).toBe(false);
			expect(result.current.isConfirming).toBe(false);
		});

		expect(removeSpy).toHaveBeenCalledWith({ event_id: entry.event_id });
	});
});
