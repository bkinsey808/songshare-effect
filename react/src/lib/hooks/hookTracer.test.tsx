import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { clientWarn } from "@/react/lib/utils/clientLogger";

import { startHookTrace, traceHook, useLogHookTrace } from "./hookTracer";

vi.mock("@/react/lib/utils/clientLogger");

describe("hookTracer", () => {
	describe("startHookTrace", () => {
		it("clears buffer so useLogHookTrace does not log", () => {
			traceHook("a");
			startHookTrace();
			vi.mocked(clientWarn).mockClear();
			renderHook(() => {
				useLogHookTrace();
				return undefined;
			});
			expect(vi.mocked(clientWarn)).not.toHaveBeenCalled();
		});
	});

	describe("traceHook", () => {
		it("pushes name into buffer", () => {
			vi.mocked(clientWarn).mockClear();
			startHookTrace();
			traceHook("Foo");
			traceHook("Bar");
			const { unmount } = renderHook(() => {
				useLogHookTrace();
				return undefined;
			});
			unmount();
			expect(vi.mocked(clientWarn)).toHaveBeenCalledWith("HOOK TRACE:", "Foo -> Bar");
		});
	});

	describe("useLogHookTrace", () => {
		it("logs buffer after commit and clears it", () => {
			vi.mocked(clientWarn).mockClear();
			startHookTrace();
			traceHook("X");
			renderHook(() => {
				useLogHookTrace();
				return undefined;
			});
			expect(vi.mocked(clientWarn)).toHaveBeenCalledWith("HOOK TRACE:", "X");
		});

		it("does not log when buffer is empty", () => {
			vi.mocked(clientWarn).mockClear();
			startHookTrace();
			renderHook(() => {
				useLogHookTrace();
				return undefined;
			});
			expect(vi.mocked(clientWarn)).not.toHaveBeenCalled();
		});
	});
});
