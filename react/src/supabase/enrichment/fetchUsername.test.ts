import { describe, expect, it, vi } from "vitest";

import type { SupabaseClientLike } from "@/react/supabase/client/SupabaseClientLike";

import type { EnrichmentConfig } from "./types";

import fetchUsername from "./fetchUsername";

function makeStubClient(
	resultProvider: () => unknown,
	capture?: {
		fromArg?: string;
		selectArg?: string;
		eqArgs?: [string, string];
	},
): SupabaseClientLike {
	return {
		from: (tableName: string) => {
			if (capture) {
				capture.fromArg = tableName;
			}
			return {
				select: (usernameColumn: string) => {
					if (capture) {
						capture.selectArg = usernameColumn;
					}
					return {
						eq: (userIdColumn: string, userId: string) => {
							if (capture) {
								capture.eqArgs = [userIdColumn, userId];
							}
							return {
								single: async (): Promise<unknown> => {
									await Promise.resolve();
									return resultProvider();
								},
							};
						},
					};
				},
			};
		},
		// Minimal stubs required by SupabaseClientLike for tests that only exercise `from` queries
		channel: (_name: string) => {
			type ChannelLike = {
				on: (event: string, opts: unknown, handler: (payload: unknown) => void) => ChannelLike;
				subscribe: (cb: (status: string, err?: unknown) => void) => unknown;
			};

			const channelLike: ChannelLike = {
				on: (_event: string, _opts: unknown, _handler: (payload: unknown) => void): ChannelLike =>
					channelLike,
				subscribe: (_cb: (status: string, err?: unknown) => void): unknown => ({}),
			};

			return channelLike;
		},
		removeChannel: (_channel: unknown): void => {
			// noop for tests
		},
		auth: { getUser: vi.fn().mockResolvedValue({ data: {}, error: undefined }) },
	};
}

describe("fetchUsername", () => {
	it("returns username when query returns valid data", async () => {
		// Supabase returns `error: null` when there is no error — tests must mirror that shape
		const client = makeStubClient(() => JSON.parse('{"data":{"username":"alice"},"error":null}'));
		const config: EnrichmentConfig = {
			client,
			userId: "user-1",
		};

		const username = await fetchUsername(config);
		expect(username).toBe("alice");
	});

	it("returns undefined when query returns an error", async () => {
		const client = makeStubClient(() => ({ data: undefined, error: { message: "not found" } }));
		const config: EnrichmentConfig = {
			client,
			userId: "user-2",
		};

		const spyWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const username = await fetchUsername(config);
		expect(username).toBeUndefined();
		expect(spyWarn).toHaveBeenCalledWith(
			"[fetchUsername] Could not fetch username for user user-2:",
			{ message: "not found" },
		);
		spyWarn.mockRestore();
	});

	it("returns undefined when username is not a string or data malformed", async () => {
		const spyWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		const client1 = makeStubClient(() => ({ data: { username: 123 }, error: undefined }));
		const cfg1: EnrichmentConfig = {
			client: client1,
			userId: "user-3",
		};
		await expect(fetchUsername(cfg1)).resolves.toBeUndefined();
		expect(spyWarn).toHaveBeenCalledWith(
			"[fetchUsername] Could not fetch username for user user-3:",
			undefined,
		);

		const client2 = makeStubClient(() => ({ foo: "bar" }));
		const cfg2: EnrichmentConfig = {
			client: client2,
			userId: "user-4",
		};
		await expect(fetchUsername(cfg2)).resolves.toBeUndefined();
		expect(spyWarn).toHaveBeenCalledWith(
			"[fetchUsername] Could not fetch username for user user-4:",
			undefined,
		);

		spyWarn.mockRestore();
	});

	it("returns undefined when underlying query throws", async () => {
		const client = makeStubClient(() =>
			(async () => {
				await Promise.resolve();
				throw new Error("network");
			})(),
		);

		const config: EnrichmentConfig = {
			client,
			userId: "user-5",
		};

		const spyWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		const username = await fetchUsername(config);
		expect(username).toBeUndefined();
		expect(spyWarn).toHaveBeenCalledWith(
			"[fetchUsername] Error fetching username for user user-5:",
			expect.any(Error),
		);
		spyWarn.mockRestore();
	});

	it("respects custom table/column names and passes them to client", async () => {
		const capture: { fromArg?: string; selectArg?: string; eqArgs?: [string, string] } = {};
		const client = makeStubClient(
			() => JSON.parse('{"data":{"username":"bob"},"error":null}'),
			capture,
		);
		const config: EnrichmentConfig = {
			client,
			userId: "user-6",
			tableName: "user_public",
			userIdColumn: "user_id",
			usernameColumn: "username",
		};

		const username = await fetchUsername(config);
		expect(username).toBe("bob");
		expect(capture.fromArg).toBe("user_public");
		expect(capture.selectArg).toBe("username");
		expect(capture.eqArgs).toStrictEqual(["user_id", "user-6"]);
	});
});
