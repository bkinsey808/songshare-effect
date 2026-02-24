import { describe, expect, it, vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";

import useAppStore from "@/react/app-store/useAppStore";
import {
	getCachedUserTokenSpy,
	type GetCachedUserTokenSpy,
} from "@/react/lib/supabase/token/getCachedUserToken.test-util";
import forceCast from "@/react/lib/test-utils/forceCast";
import makeAppSlice from "@/react/lib/test-utils/makeAppSlice";
import { restoreFetch } from "@/react/lib/test-utils/restoreFetch.test-util";
import { spyClientError } from "@/react/lib/utils/clientError.test-util";
import makeUserPublic from "@/react/playlist/test-utils/makeUserPublic.mock";
// Helpers live in a companion file so this test never needs any
// lint-disable comments. A custom rule (`no-disable-in-tests`) enforces the
// separation.
import { HTTP_NO_CONTENT, HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } from "@/shared/constants/http";

import ensureSignedIn from "./ensureSignedIn";

vi.mock("@/react/app-store/useAppStore", (): { default: { getState: () => unknown } } => ({
	default: { getState: vi.fn() },
}));

// `getCachedUserToken` is a simple exported function; mock via absolute path to match normal imports
// and keep consistency with the spy helper above.
vi.mock("@/react/lib/supabase/token/token-cache", (): { getCachedUserToken: () => unknown } => ({
	getCachedUserToken: vi.fn(),
}));
vi.mock(
	"@/react/lib/utils/clientLogger",
	(): { clientDebug: (...args: unknown[]) => void; clientError: (...args: unknown[]) => void } => ({
		clientDebug: vi.fn(),
		clientError: vi.fn(),
	}),
);

const SAMPLE_USER_SESSION: UserSessionData = {
	user: {
		created_at: "2026-01-01T00:00:00Z",
		email: "u@example.com",
		google_calendar_access: "none",
		google_calendar_refresh_token: undefined,
		linked_providers: undefined,
		name: "Test User",
		role: "user",
		role_expires_at: undefined,
		sub: undefined,
		updated_at: "2026-01-01T00:00:00Z",
		user_id: "u1",
	},
	userPublic: forceCast(makeUserPublic({ user_id: "u1", username: "u1" })),
	oauthUserData: { email: "u@example.com" },
	oauthState: { csrf: "x", lang: "en", provider: "google" },
	ip: "127.0.0.1",
};

const mockedUseAppStore = vi.mocked(useAppStore);

describe("ensureSignedIn", () => {
	it("returns undefined immediately when store indicates signed out", async () => {
		vi.resetAllMocks();

		const mockedGetCachedUserTokenSpy: GetCachedUserTokenSpy = await getCachedUserTokenSpy();
		mockedGetCachedUserTokenSpy.mockReturnValue(undefined);
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
		const mockedGetCachedUserTokenSpy: GetCachedUserTokenSpy = await getCachedUserTokenSpy();
		mockedGetCachedUserTokenSpy.mockReturnValue("token-123");
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
			const mockedGetCachedUserTokenSpy: GetCachedUserTokenSpy = await getCachedUserTokenSpy();
			mockedGetCachedUserTokenSpy.mockReturnValue(undefined);
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
		const mockedGetCachedUserTokenSpyA: GetCachedUserTokenSpy = await getCachedUserTokenSpy();
		mockedGetCachedUserTokenSpyA.mockReturnValue(undefined);
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
		const mockedGetCachedUserTokenSpyB: GetCachedUserTokenSpy = await getCachedUserTokenSpy();
		mockedGetCachedUserTokenSpyB.mockReturnValue(undefined);
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

		const mockedClientError = await spyClientError();
		const res = await ensureSignedIn();
		expect(res).toBeUndefined();
		expect(mockedClientError).toHaveBeenCalledWith("useEnsureSignedIn json error", badJsonError);
		expect(store.signIn).not.toHaveBeenCalled();
		restoreFetch(originalFetch);
	});

	it("applies signIn and sets signed in when payload parses to data", async () => {
		vi.resetAllMocks();
		const mockedGetCachedUserTokenSpy: GetCachedUserTokenSpy = await getCachedUserTokenSpy();
		mockedGetCachedUserTokenSpy.mockReturnValue(undefined);
		const signIn = vi.fn();
		const setIsSignedIn = vi.fn();
		vi.spyOn(mockedUseAppStore, "getState").mockImplementation(() =>
			makeAppSlice({ isSignedIn: undefined, signIn, setIsSignedIn }),
		);

		const data: UserSessionData = {
			...SAMPLE_USER_SESSION,
			user: { ...SAMPLE_USER_SESSION.user, user_id: "u1" },
		};
		const payload = data;
		const originalFetch = globalThis.fetch;
		const fetchMock = vi
			.fn()
			.mockResolvedValue({ status: 200, ok: true, json: vi.fn().mockResolvedValue(payload) });
		vi.stubGlobal("fetch", fetchMock);

		const res = await ensureSignedIn();
		expect(res).toBe(data);
		expect(signIn).toHaveBeenCalledWith(data);
		expect(setIsSignedIn).toHaveBeenCalledWith(true);
		restoreFetch(originalFetch);
	});

	it("logs when signIn throws but continues", async () => {
		vi.resetAllMocks();
		const mockedGetCachedUserTokenSpy2: GetCachedUserTokenSpy = await getCachedUserTokenSpy();
		mockedGetCachedUserTokenSpy2.mockReturnValue(undefined);
		const signIn = vi.fn(() => {
			throw new Error("sign fail");
		});
		const setIsSignedIn = vi.fn();
		vi.spyOn(mockedUseAppStore, "getState").mockImplementation(() =>
			makeAppSlice({ isSignedIn: undefined, signIn, setIsSignedIn }),
		);

		const data: UserSessionData = {
			...SAMPLE_USER_SESSION,
			user: { ...SAMPLE_USER_SESSION.user, user_id: "u2" },
		};
		const payload = data;
		const originalFetch = globalThis.fetch;
		const fetchMock = vi
			.fn()
			.mockResolvedValue({ status: 200, ok: true, json: vi.fn().mockResolvedValue(payload) });
		vi.stubGlobal("fetch", fetchMock);

		const mockedClientError = await spyClientError();
		const res = await ensureSignedIn();
		expect(res).toBe(data);
		expect(mockedClientError).toHaveBeenCalledWith("apply signIn failed:", expect.any(Error));
		expect(setIsSignedIn).not.toHaveBeenCalled();
		restoreFetch(originalFetch);
	});

	it("returns undefined when payload is invalid", async () => {
		vi.resetAllMocks();
		const mockedGetCachedUserTokenSpy3: GetCachedUserTokenSpy = await getCachedUserTokenSpy();
		mockedGetCachedUserTokenSpy3.mockReturnValue(undefined);
		vi.spyOn(mockedUseAppStore, "getState").mockImplementation(() =>
			makeAppSlice({ isSignedIn: undefined }),
		);
		const originalFetch = globalThis.fetch;
		const fetchMock = vi
			.fn()
			.mockResolvedValue({ status: 200, ok: true, json: vi.fn().mockResolvedValue({}) });
		vi.stubGlobal("fetch", fetchMock);

		// invalid payload leads parseUserSessionData to return undefined
		const mockedClientError = await spyClientError();
		const res = await ensureSignedIn();
		expect(res).toBeUndefined();
		// parse returns undefined; no error log should occur
		expect(mockedClientError).not.toHaveBeenCalled();
		restoreFetch(originalFetch);
	});

	it("returns undefined on AbortError without logging an error", async () => {
		vi.resetAllMocks();
		const mockedGetCachedUserTokenSpy4: GetCachedUserTokenSpy = await getCachedUserTokenSpy();
		mockedGetCachedUserTokenSpy4.mockReturnValue(undefined);
		vi.spyOn(mockedUseAppStore, "getState").mockImplementation(() =>
			makeAppSlice({ isSignedIn: undefined }),
		);
		const originalFetch = globalThis.fetch;
		const fetchMock = vi.fn().mockRejectedValue({ name: "AbortError" });
		vi.stubGlobal("fetch", fetchMock);

		const mockedClientError = await spyClientError();
		const res = await ensureSignedIn();
		expect(res).toBeUndefined();
		expect(mockedClientError).not.toHaveBeenCalledWith("ensureSignedIn error", expect.anything());
		restoreFetch(originalFetch);
	});

	it("dedupes concurrent requests using globalInFlight", async () => {
		vi.resetAllMocks();
		const mockedGetCachedUserTokenSpy5: GetCachedUserTokenSpy = await getCachedUserTokenSpy();
		mockedGetCachedUserTokenSpy5.mockReturnValue(undefined);
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
