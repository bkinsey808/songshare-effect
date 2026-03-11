import { describe, expect, it } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";

import createErrorResponse from "./createErrorResponse";

const HTTP_STATUS_INTERNAL = 500;
const ERROR_MSG = "Database connection failed";

describe("createErrorResponse", () => {
	it("returns 500 with details when not production", async () => {
		const ctx = makeCtx({ env: { ENVIRONMENT: "development" } });
		const err = new Error(ERROR_MSG);
		const res = createErrorResponse(ctx, err);

		expect(res.status).toBe(HTTP_STATUS_INTERNAL);
		const body = await res.json();
		expect(body).toMatchObject({
			success: false,
			error: "Internal server error",
			details: { message: ERROR_MSG },
		});
	});

	it("extracts message from non-Error when not production", async () => {
		const ctx = makeCtx({ env: { ENVIRONMENT: "development" } });
		const res = createErrorResponse(ctx, "string error");

		const body = await res.json();
		expect(body).toMatchObject({ details: { message: "string error" } });
	});

	it("returns 500 without details when production", async () => {
		const ctx = makeCtx({ env: { ENVIRONMENT: "production" } });
		const err = new Error(ERROR_MSG);
		const res = createErrorResponse(ctx, err);

		expect(res.status).toBe(HTTP_STATUS_INTERNAL);
		const body = await res.json();
		expect(body).toStrictEqual({ success: false, error: "Internal server error" });
	});

	it("returns 500 with details when ENVIRONMENT is undefined", async () => {
		const ctx = makeCtx({ env: {} });
		const err = new Error(ERROR_MSG);
		const res = createErrorResponse(ctx, err);

		const body = await res.json();
		expect(body).toMatchObject({ details: { message: ERROR_MSG } });
	});
});
