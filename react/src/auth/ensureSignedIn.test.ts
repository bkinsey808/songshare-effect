import { describe, expect, it, vi } from "vitest";

import type { AppSlice } from "@/react/app-store/AppSlice.type";
import type { UserSessionData } from "@/shared/userSessionData";

import useAppStore from "@/react/app-store/useAppStore";
import { getCachedUserToken } from "@/react/supabase/token/tokenCache";
import { clientError } from "@/react/utils/clientLogger";
import { HTTP_NO_CONTENT, HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } from "@/shared/constants/http";

import ensureSignedIn from "./ensureSignedIn";
import parseUserSessionData from "./parseUserSessionData";

vi.mock("@/react/app-store/useAppStore", (): { default: { getState: () => unknown } } => ({
	default: { getState: vi.fn() },
}));

vi.mock("@/react/supabase/token/tokenCache", (): { getCachedUserToken: () => unknown } => ({
	getCachedUserToken: vi.fn(),
}));
vi.mock(
	"@/react/utils/clientLogger",
	(): { clientDebug: (...args: unknown[]) => void; clientError: (...args: unknown[]) => void } => ({
		clientDebug: vi.fn(),
		clientError: vi.fn(),
	}),
);
vi.mock("./parseUserSessionData", (): { default: (payload: unknown) => unknown } => ({
	default: vi.fn(),
}));

const mockedUseAppStore = vi.mocked(useAppStore);
const mockedGetCachedUserToken = vi.mocked(getCachedUserToken);
const mockedClientError = vi.mocked(clientError);
const mockedParse = vi.mocked(parseUserSessionData);

function restoreFetch(originalFetch: unknown): void {
	// Restore global fetch in a type-safe way for tests.
	// Use Reflect.set to avoid unsafe type assertions when mutating globals in tests.
	Reflect.set(globalThis, "fetch", originalFetch);
}

function makeAppSlice(overrides: Partial<AppSlice> = {}): AppSlice {
	const base: Partial<AppSlice> = {
		isSignedIn: undefined,
		userSessionData: undefined,
		showSignedInAlert: false,
		setIsSignedIn: vi.fn(),
		signIn: vi.fn(),
		signOut: vi.fn(),
		setShowSignedInAlert: vi.fn(),
	};
	// The test helper returns a full AppSlice shape for callers that expect it.
	// We suppress the lint rule here because constructing a full AppSlice in tests
	// would be verbose; this cast is intentionally narrow but safe for tests.
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	return { ...base, ...overrides } as unknown as AppSlice;
}
describe("ensureSignedIn", () => {
	it("returns undefined immediately when store indicates signed out", async () => {
		vi.resetAllMocks();
		mockedGetCachedUserToken.mockReturnValue(undefined);
		const originalFetch = globalThis.fetch;
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		vi.spyOn(mockedUseAppStore, "getState").mockImplementation(() =>
			makeAppSlice({ isSignedIn: false }),
		);

		const res = await ensureSignedIn();
		expect(res).toBeUndefined();
		expect(fetchMock).not.toHaveBeenCalled();
		restoreFetch(originalFetch);
	});

	it("returns undefined immediately when signed in and cached token exists", async () => {
		vi.resetAllMocks();
		mockedGetCachedUserToken.mockReturnValue("token-123");
		const originalFetch = globalThis.fetch;
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		vi.spyOn(mockedUseAppStore, "getState").mockImplementation(() =>
			makeAppSlice({ isSignedIn: true }),
		);

		const res = await ensureSignedIn();
		expect(res).toBeUndefined();
		expect(fetchMock).not.toHaveBeenCalled();
		restoreFetch(originalFetch);
	});

	it.each([HTTP_UNAUTHORIZED, HTTP_NO_CONTENT, HTTP_NOT_FOUND])(
		"treats %s as not signed in and sets isSignedIn(false)",
		async (statusCode) => {
			vi.resetAllMocks();
			mockedGetCachedUserToken.mockReturnValue(undefined);
			const setIsSignedIn = vi.fn();
			vi.spyOn(mockedUseAppStore, "getState").mockImplementation(() =>
				makeAppSlice({ isSignedIn: undefined, setIsSignedIn }),
			);
			const originalFetch = globalThis.fetch;
			const _fetchMock = vi.fn().mockResolvedValue({ status: statusCode, ok: false });
			vi.stubGlobal("fetch", _fetchMock);
			const res = await ensureSignedIn();
			expect(res).toBeUndefined();
			expect(setIsSignedIn).toHaveBeenCalledWith(false);
			restoreFetch(originalFetch);
		},
	);

	it("logs and sets signed out for server errors (non-ok) other than common unauthenticated statuses", async () => {
		vi.resetAllMocks();
		mockedGetCachedUserToken.mockReturnValue(undefined);
		const setIsSignedIn = vi.fn();
		vi.spyOn(mockedUseAppStore, "getState").mockImplementation(() =>
			makeAppSlice({ isSignedIn: undefined, setIsSignedIn }),
		);
		const originalFetch = globalThis.fetch;
		const fetchMock = vi.fn().mockResolvedValue({ status: 500, ok: false });
		vi.stubGlobal("fetch", fetchMock);

		const res = await ensureSignedIn();
		expect(res).toBeUndefined();
		expect(setIsSignedIn).toHaveBeenCalledWith(false);
		restoreFetch(originalFetch);
	});

	it("handles json parse errors gracefully and logs them", async () => {
		vi.resetAllMocks();
		mockedGetCachedUserToken.mockReturnValue(undefined);
		const store = { isSignedIn: undefined, signIn: vi.fn(), setIsSignedIn: vi.fn() };
		vi.spyOn(mockedUseAppStore, "getState").mockImplementation(() => makeAppSlice({ ...store }));
		const badJsonError = new Error("bad json");
		const originalFetch = globalThis.fetch;
		const fetchMock = vi.fn().mockResolvedValue({
			status: 200,
			ok: true,
			json: vi.fn().mockRejectedValue(badJsonError),
		});
		vi.stubGlobal("fetch", fetchMock);

		const res = await ensureSignedIn();
		expect(res).toBeUndefined();
		expect(mockedClientError).toHaveBeenCalledWith("useEnsureSignedIn json error", badJsonError);
		expect(store.signIn).not.toHaveBeenCalled();
		restoreFetch(originalFetch);
	});

	it("applies signIn and sets signed in when payload parses to data", async () => {
		vi.resetAllMocks();
		mockedGetCachedUserToken.mockReturnValue(undefined);
		const signIn = vi.fn();
		const setIsSignedIn = vi.fn();
		vi.spyOn(mockedUseAppStore, "getState").mockImplementation(() =>
			makeAppSlice({ isSignedIn: undefined, signIn, setIsSignedIn }),
		);

		const payload = { foo: "bar" };
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		const data = { user: { user_id: "u1" } } as unknown as UserSessionData;
		const originalFetch = globalThis.fetch;
		const fetchMock = vi
			.fn()
			.mockResolvedValue({ status: 200, ok: true, json: vi.fn().mockResolvedValue(payload) });
		vi.stubGlobal("fetch", fetchMock);
		mockedParse.mockReturnValue(data);

		const res = await ensureSignedIn();
		expect(res).toBe(data);
		expect(signIn).toHaveBeenCalledWith(data);
		expect(setIsSignedIn).toHaveBeenCalledWith(true);
		restoreFetch(originalFetch);
	});

	it("logs when signIn throws but continues", async () => {
		vi.resetAllMocks();
		mockedGetCachedUserToken.mockReturnValue(undefined);
		const signIn = vi.fn(() => {
			throw new Error("sign fail");
		});
		const setIsSignedIn = vi.fn();
		vi.spyOn(mockedUseAppStore, "getState").mockImplementation(() =>
			makeAppSlice({ isSignedIn: undefined, signIn, setIsSignedIn }),
		);

		const payload = { foo: "bar" };
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		const data = { user: { user_id: "u2" } } as unknown as UserSessionData;
		const originalFetch = globalThis.fetch;
		const fetchMock = vi
			.fn()
			.mockResolvedValue({ status: 200, ok: true, json: vi.fn().mockResolvedValue(payload) });
		vi.stubGlobal("fetch", fetchMock);
		mockedParse.mockReturnValue(data);

		const res = await ensureSignedIn();
		expect(res).toBe(data);
		expect(mockedClientError).toHaveBeenCalledWith("apply signIn failed:", expect.any(Error));
		expect(setIsSignedIn).not.toHaveBeenCalled();
		restoreFetch(originalFetch);
	});

	it("handles parseUserSessionData throwing by logging and returning undefined", async () => {
		vi.resetAllMocks();
		mockedGetCachedUserToken.mockReturnValue(undefined);
		vi.spyOn(mockedUseAppStore, "getState").mockImplementation(() =>
			makeAppSlice({ isSignedIn: undefined }),
		);
		const originalFetch = globalThis.fetch;
		const fetchMock = vi
			.fn()
			.mockResolvedValue({ status: 200, ok: true, json: vi.fn().mockResolvedValue({}) });
		vi.stubGlobal("fetch", fetchMock);
		mockedParse.mockImplementation(() => {
			throw new Error("parse failed");
		});

		const res = await ensureSignedIn();
		expect(res).toBeUndefined();
		expect(mockedClientError).toHaveBeenCalledWith("ensureSignedIn error", expect.any(Error));
		restoreFetch(originalFetch);
	});

	it("returns undefined on AbortError without logging an error", async () => {
		vi.resetAllMocks();
		mockedGetCachedUserToken.mockReturnValue(undefined);
		vi.spyOn(mockedUseAppStore, "getState").mockImplementation(() =>
			makeAppSlice({ isSignedIn: undefined }),
		);
		const originalFetch = globalThis.fetch;
		const fetchMock = vi.fn().mockRejectedValue({ name: "AbortError" });
		vi.stubGlobal("fetch", fetchMock);

		const res = await ensureSignedIn();
		expect(res).toBeUndefined();
		expect(mockedClientError).not.toHaveBeenCalledWith("ensureSignedIn error", expect.anything());
		restoreFetch(originalFetch);
	});

	it("dedupes concurrent requests using globalInFlight", async () => {
		vi.resetAllMocks();
		mockedGetCachedUserToken.mockReturnValue(undefined);
		const signIn = vi.fn();
		const setIsSignedIn = vi.fn();
		vi.spyOn(mockedUseAppStore, "getState").mockImplementation(() =>
			makeAppSlice({ isSignedIn: undefined, signIn, setIsSignedIn }),
		);

		const originalFetch = globalThis.fetch;
		const fetchMock = vi
			.fn()
			.mockImplementation(
				async (): Promise<{ status: number; ok: boolean; json: () => unknown }> => {
					// microtask delay to ensure concurrent callers observe dedupe
					await Promise.resolve();
					return { status: 200, ok: true, json: () => ({}) };
				},
			);
		vi.stubGlobal("fetch", fetchMock);
		const promise1 = ensureSignedIn();
		const promise2 = ensureSignedIn();
		expect(promise1).toBe(promise2);

		// now resolve the underlying fetch with a successful response shape
		await promise1;
		expect(signIn).not.toHaveBeenCalledWith(expect.anything());
		restoreFetch(originalFetch);
	});

	it("does not apply signIn if client explicitly signed out during in-flight request unless forced", async () => {
		const signIn = vi.fn();
		const setIsSignedIn = vi.fn();
		// Initially undefined, then after fetch resolves we pretend the client signed out
		vi.spyOn(mockedUseAppStore, "getState")
			.mockImplementationOnce(() => makeAppSlice({ isSignedIn: undefined, signIn, setIsSignedIn }))
			.mockImplementation(() => makeAppSlice({ isSignedIn: false, signIn, setIsSignedIn }));

		const originalFetch = globalThis.fetch;
		const fetchMock = vi
			.fn()
			.mockResolvedValue({ status: 200, ok: true, json: vi.fn().mockResolvedValue({}) });
		vi.stubGlobal("fetch", fetchMock);

		const promise = ensureSignedIn();
		// wait for the in-flight request to complete
		const res = await promise;
		// allow post-processing microtasks to complete (post-flight handler)
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();
		expect(res).toBeUndefined();
		expect(signIn).not.toHaveBeenCalled();

		// cleanup: ensure global fetch is restored
		restoreFetch(originalFetch);
	});
});
