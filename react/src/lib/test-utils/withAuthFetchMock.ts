/**
 * Prevent background auth fetches from starting during tests by stubbing
 * network responses for the auth endpoints used by getSupabaseAuthToken.
 */
function isRequestLike(input: unknown): input is Request {
	return typeof input === "object" && input !== null && "url" in input;
}

export default async function withAuthFetchMock<TReturnType>(
	task: () => Promise<TReturnType> | TReturnType,
): Promise<TReturnType> {
	const original: ((input: RequestInfo, init?: RequestInit) => Promise<Response>) | undefined =
		typeof globalThis.fetch === "function"
			? (globalThis.fetch.bind(globalThis) as (
					input: RequestInfo,
					init?: RequestInit,
				) => Promise<Response>)
			: undefined;

	async function authFetchMock(input: URL | RequestInfo, init?: RequestInit): Promise<Response> {
		let url = "";
		if (typeof input === "string") {
			url = input;
		} else if (input instanceof URL) {
			url = input.href;
		} else if (isRequestLike(input)) {
			const { url: requestUrl } = input;
			url = requestUrl;
		} else {
			url = String(input);
		}

		if (url.endsWith("/api/auth/visitor")) {
			return Response.json({ access_token: "visitor-token", expires_in: 3600 }, { status: 200 });
		}
		if (url.endsWith("/api/auth/user/token")) {
			return Response.json(
				{ success: true, data: { access_token: "user-token", expires_in: 3600 } },
				{ status: 200 },
			);
		}

		const callInput: RequestInfo = input instanceof URL ? input.href : input;
		const result = original ? await original(callInput, init) : undefined;
		return result ?? new Response(undefined, { status: 404 });
	}

	Object.defineProperty(globalThis, "fetch", {
		configurable: true,
		writable: true,
		value: authFetchMock,
	});

	try {
		return await task();
	} finally {
		Object.defineProperty(globalThis, "fetch", {
			value: original,
			configurable: true,
			writable: true,
		});
	}
}
