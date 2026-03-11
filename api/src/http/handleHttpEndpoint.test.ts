import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { AuthenticationError, ValidationError } from "@/api/api-errors";
import makeCtx, { makeCtxWithJsonResponse } from "@/api/hono/makeCtx.test-util";
import { HTTP_STATUS } from "@/shared/demo/api";

import handleHttpEndpoint from "./handleHttpEndpoint";

const SAMPLE_DATA = { id: "item-1", name: "Test" };

describe("handleHttpEndpoint", () => {
	it("returns default success envelope when effect succeeds", async () => {
		const ctx = makeCtxWithJsonResponse();
		const handler = handleHttpEndpoint(() => Effect.succeed(SAMPLE_DATA));
		const res = await handler(ctx);

		expect(res).toBeInstanceOf(Response);
		expect(res.status).toBe(HTTP_STATUS.OK);
		const body = await res.json();
		expect(body).toStrictEqual({ success: true, data: SAMPLE_DATA });
	});

	it("uses custom userOnSuccess when provided", async () => {
		const ctx = makeCtxWithJsonResponse();
		const customShape = { ok: true, payload: SAMPLE_DATA };
		const handler = handleHttpEndpoint(
			() => Effect.succeed(SAMPLE_DATA),
			(data) => ({ ok: true, payload: data }),
		);
		const res = await handler(ctx);

		expect(res.status).toBe(HTTP_STATUS.OK);
		const body = await res.json();
		expect(body).toStrictEqual(customShape);
	});

	it("returns effect data directly when it is a Response", async () => {
		const ctx = makeCtx();
		const customResponse = Response.json({ custom: true }, { status: HTTP_STATUS.CREATED });

		const handler = handleHttpEndpoint(() => Effect.succeed(customResponse));
		const res = await handler(ctx);

		expect(res).toBe(customResponse);
		expect(res.status).toBe(HTTP_STATUS.CREATED);
		const body = await res.json();
		expect(body).toStrictEqual({ custom: true });
	});

	it("returns error response when effect fails with ValidationError", async () => {
		const ctx = makeCtxWithJsonResponse({ env: { ENVIRONMENT: "development" } });
		const err = new ValidationError({ message: "Invalid input", field: "email" });
		const handler = handleHttpEndpoint(() => Effect.fail(err));
		const res = await handler(ctx);

		expect(res).toBeInstanceOf(Response);
		expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
		const body = await res.json();
		expect(body).toMatchObject({ error: "Invalid input", field: "email" });
	});

	it("returns 401 when effect fails with AuthenticationError", async () => {
		const ctx = makeCtxWithJsonResponse({ env: { ENVIRONMENT: "development" } });
		const err = new AuthenticationError({ message: "No token" });
		const handler = handleHttpEndpoint(() => Effect.fail(err));
		const res = await handler(ctx);

		expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
		const body = await res.json();
		expect(body).toMatchObject({ error: "No token" });
	});

	it("logs AuthenticationError with console.warn", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const ctx = makeCtxWithJsonResponse({ env: { ENVIRONMENT: "development" } });
		const err = new AuthenticationError({ message: "No token" });
		const handler = handleHttpEndpoint(() => Effect.fail(err));
		await handler(ctx);

		expect(warnSpy).toHaveBeenCalledWith(
			"[handleHttpEndpoint] AuthenticationError:",
			expect.any(String),
		);
		warnSpy.mockRestore();
	});
});
