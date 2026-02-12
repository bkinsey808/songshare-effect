import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";

vi.mock("./useSignInError");

// Note: we dynamically import the hook and the mocked module within each test so
// the mock is in place before the hook module is loaded.

describe("useSignIn", () => {
	it("returns initial isSignedIn from the app store", async () => {
		useAppStore.setState({ isSignedIn: true });

		const mod = await import("./useSignInError");
		vi.mocked(mod.default).mockReturnValue({
			signinError: undefined,
			provider: undefined,
			dismissError: vi.fn(),
		});

		const { default: useSignIn } = await import("./useSignIn");

		const { result } = renderHook(() => useSignIn());

		expect(result.current.isSignedIn).toBe(true);
	});

	it("updates isSignedIn when the store changes", async () => {
		useAppStore.setState({ isSignedIn: false });

		const mod = await import("./useSignInError");
		vi.mocked(mod.default).mockReturnValue({
			signinError: undefined,
			provider: undefined,
			dismissError: vi.fn(),
		});

		const { default: useSignIn } = await import("./useSignIn");

		const { result } = renderHook(() => useSignIn());
		expect(result.current.isSignedIn).toBe(false);

		useAppStore.setState({ isSignedIn: true });

		await waitFor(() => {
			expect(result.current.isSignedIn).toBe(true);
		});
	});

	it("exposes signinError, provider and dismissError from useSignInError", async () => {
		const dismissMock = vi.fn();
		const expected = {
			signinError: "errors.signin.providerMismatch",
			provider: "github",
			dismissError: dismissMock,
		};

		const mod = await import("./useSignInError");
		vi.mocked(mod.default).mockReturnValue(expected);

		const { default: useSignIn } = await import("./useSignIn");

		const { result } = renderHook(() => useSignIn());

		expect(result.current.signinError).toBe(expected.signinError);
		expect(result.current.provider).toBe(expected.provider);
		expect(result.current.dismissError).toBe(expected.dismissError);

		result.current.dismissError();

		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		expect(dismissMock).toHaveBeenCalledTimes(1);
	});
});
