/**
 * Prevent background auth fetches from starting during tests by stubbing
 * network responses for the auth endpoints used by getSupabaseAuthToken.
 */
export default async function withAuthFetchMock<TReturnType>(
	task: () => Promise<TReturnType> | TReturnType,
): Promise<TReturnType> {
	const original =
		typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : undefined;

	async function authFetchMock(input: URL | RequestInfo, init?: RequestInit): Promise<Response> {
		let url = "";
		if (typeof input === "string") {
			url = input;
		} else if (input instanceof URL) {
			url = input.href;
		} else {
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion
			const req = input as unknown as Request;
			const { url: reqUrl } = req;
			url = reqUrl;
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

		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		const result = original ? await original(input as unknown as RequestInfo, init) : undefined;
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
