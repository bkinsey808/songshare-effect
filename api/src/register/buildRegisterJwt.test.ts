import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import { parseOauthState } from "@/shared/oauth/oauthState";

import createJwt from "@/api/oauth/createJwt";

import buildRegisterJwt from "./buildRegisterJwt";

vi.mock("@/api/oauth/createJwt");

function installCreateJwtMock(): void {
	vi.mocked(createJwt).mockImplementation(() =>
		Effect.succeed("mocked-jwt-token"),
	);
}

describe("buildRegisterJwt", () => {
	it("fails when JWT_SECRET is missing", async () => {
		installCreateJwtMock();
		const ctx = makeCtx({ env: { JWT_SECRET: "" } });
		const oauthUserData = { email: "a@b.com" };
		const oauthState = parseOauthState(
			encodeURIComponent(JSON.stringify({ csrf: "x", lang: "en", provider: "google" })),
		);

		const result = await Effect.runPromise(
			Effect.exit(
				buildRegisterJwt({ ctx, oauthUserData, oauthState }),
			),
		);

		expect(result._tag).toBe("Failure");
	});

	it("succeeds when JWT_SECRET is set", async () => {
		installCreateJwtMock();
		const ctx = makeCtx({ env: { JWT_SECRET: "secret" } });
		const oauthUserData = { email: "a@b.com" };
		const oauthState = parseOauthState(
			encodeURIComponent(JSON.stringify({ csrf: "x", lang: "en", provider: "google" })),
		);

		const result = await Effect.runPromise(
			buildRegisterJwt({ ctx, oauthUserData, oauthState }),
		);

		expect(result).toBe("mocked-jwt-token");
	});
});
