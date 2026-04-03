import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import handleHttpEndpoint from "@/api/http/handleHttpEndpoint";
import forceCast from "@/shared/test-utils/forceCast.test-util";
import { HTTP_INTERNAL, HTTP_TEMP_REDIRECT } from "@/shared/constants/http";
import promiseResolved, { promiseRejected } from "@/shared/test-utils/promiseResolved.test-util";

import oauthCallbackHandler from "./oauthCallbackHandler";

vi.mock("@/api/http/handleHttpEndpoint");
vi.mock("@/api/oauth-callback-factory/oauthCallbackFactory");

describe("oauthCallbackHandler", () => {
	it("returns createErrorResponse when handleHttpEndpoint rejects", async () => {
		vi.mocked(handleHttpEndpoint).mockReturnValue(() =>
			promiseRejected(new Error("unexpected error")),
		);

		const ctx = makeCtx({ env: { ENVIRONMENT: "development" } });
		const spyError = vi.spyOn(console, "error").mockImplementation(() => undefined);

		const response = await oauthCallbackHandler(ctx);

		expect(response.status).toBe(HTTP_INTERNAL);
		const json = forceCast<{
			success: boolean;
			error: string;
			details?: { message: string };
		}>(await response.json());
		expect(json).toMatchObject({ success: false, error: "Internal server error" });
		expect(json).toHaveProperty("details");
		expect(json.details).toMatchObject({ message: "unexpected error" });
		spyError.mockRestore();
	});

	it("returns response from handleHttpEndpoint when it succeeds", async () => {
		const successResponse = Response.json(
			{ ok: true },
			{ status: HTTP_TEMP_REDIRECT, headers: { Location: "/dashboard" } },
		);
		vi.mocked(handleHttpEndpoint).mockReturnValue(() => promiseResolved(successResponse));

		const ctx = makeCtx();

		const response = await oauthCallbackHandler(ctx);

		expect(response).toBe(successResponse);
	});
});
