import { Effect } from "effect";
import { sign } from "hono/jwt";
import { describe, expect, it, vi } from "vitest";

import createJwt from "./createJwt";

vi.mock("hono/jwt");

describe("createJwt", () => {
	it("signs a plain object payload", async () => {
		vi.resetAllMocks();
		vi.mocked(sign).mockResolvedValueOnce("token-obj");

		const result = await Effect.runPromise(createJwt({ alpha: 1 }, "secret-x"));

		expect(result).toBe("token-obj");
		expect(vi.mocked(sign)).toHaveBeenCalledWith({ alpha: 1 }, "secret-x");
	});

	it("serializes non-object payload into { payload: string }", async () => {
		vi.resetAllMocks();
		vi.mocked(sign).mockResolvedValueOnce("token-primitive");

		const payload = "boom";
		const result = await Effect.runPromise(createJwt(payload, "secret-y"));

		expect(result).toBe("token-primitive");
		expect(vi.mocked(sign)).toHaveBeenCalledWith({ payload: "boom" }, "secret-y");
	});

	it("maps sign rejection to ServerError", async () => {
		vi.resetAllMocks();
		vi.mocked(sign).mockRejectedValueOnce(new Error("sign-failed"));

		await expect(Effect.runPromise(createJwt({ ok: true }, "s"))).rejects.toThrow(/sign-failed/);
	});
});
