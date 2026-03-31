import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import mockCreateSupabaseClient from "@/api/test-utils/mockCreateSupabaseClient.test-util";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import { TEST_USER_ID } from "@/shared/test-utils/testUserConstants";
import type { UserSessionData } from "@/shared/userSessionData";

import eventSave from "./eventSave";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/user-session/getVerifiedSession");

const SAMPLE_USER_ID = TEST_USER_ID;

describe("eventSave", () => {
	it("creates event (happy path)", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({
			body: { event_name: "Party", event_slug: "party-1", private_notes: "pnotes" },
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc-key" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(
				makeUserSessionData({
					user: {
						user_id: SAMPLE_USER_ID,
					},
				}),
			),
		);

		const publicRow = {
			event_id: "evt-1",
			owner_id: SAMPLE_USER_ID,
			event_name: "Party",
			event_slug: "party-1",
		};

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventInsertRows: [{ event_id: "evt-1", owner_id: SAMPLE_USER_ID, private_notes: "pnotes" }],
			eventPublicInsertRows: [publicRow],
			eventUserInsertRows: [{ event_id: "evt-1", user_id: SAMPLE_USER_ID, role: "owner" }],
		});

		const res = await Effect.runPromise(eventSave(ctx));

		expect(res).toStrictEqual(publicRow);
		expect(vi.mocked(createClient)).toHaveBeenCalledWith("url", "svc-key");
	});

	it("returns ValidationError when request JSON is invalid", async () => {
		const ctx = makeCtx({ body: new Error("bad json") });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(
				makeUserSessionData({
					user: {
						user_id: SAMPLE_USER_ID,
					},
				}),
			),
		);

		await expect(Effect.runPromise(eventSave(ctx))).rejects.toThrow(/Invalid JSON body/);
	});

	it("fails when form schema validation fails", async () => {
		// missing required `event_name`
		const ctx = makeCtx({ body: { event_slug: "x" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(
				makeUserSessionData({
					user: {
						user_id: SAMPLE_USER_ID,
					},
				}),
			),
		);

		await expect(Effect.runPromise(eventSave(ctx))).rejects.toThrow(/is missing/);
	});

	it("cleans up and fails when public insert returns a DB error", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({ body: { event_name: "P", event_slug: "p" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(
				makeUserSessionData({
					user: {
						user_id: SAMPLE_USER_ID,
					},
				}),
			),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventInsertRows: [{ event_id: "evt-2", owner_id: SAMPLE_USER_ID }],
			eventPublicInsertError: { message: "public-insert-boom" },
		});

		await expect(Effect.runPromise(eventSave(ctx))).rejects.toThrow(/public-insert-boom/);
	});

	it("fails when creating event_user row fails (cleanup attempted)", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({ body: { event_name: "P", event_slug: "p" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(
				makeUserSessionData({
					user: {
						user_id: SAMPLE_USER_ID,
					},
				}),
			),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventInsertRows: [{ event_id: "evt-3", owner_id: SAMPLE_USER_ID }],
			eventPublicInsertRows: [
				{ event_id: "evt-3", owner_id: SAMPLE_USER_ID, event_name: "P", event_slug: "p" },
			],
			eventUserInsertError: { message: "owner-insert-failed" },
		});

		await expect(Effect.runPromise(eventSave(ctx))).rejects.toThrow(/owner-insert-failed/);
	});

	it("updates event when user is owner (update happy path)", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({
			body: {
				event_id: "evt-9",
				event_name: "Updated",
				event_description: "desc",
				event_slug: "evt-9",
			},
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(
				makeUserSessionData({
					user: {
						user_id: SAMPLE_USER_ID,
					},
				}),
			),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventUserSelectRow: { role: "owner" },
			eventUpdateSelectRow: { event_id: "evt-9", private_notes: "" },
			eventPublicUpdateRow: { event_id: "evt-9", event_name: "Updated", event_description: "desc" },
		});

		const res = await Effect.runPromise(eventSave(ctx));
		expect(res).toStrictEqual({
			event_id: "evt-9",
			event_name: "Updated",
			event_description: "desc",
		});
	});

	it("rejects when event playlist admin attempts to change restricted fields", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({ body: { event_id: "evt-admin", event_name: "X", event_slug: "bad" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(
				makeUserSessionData({
					user: {
						user_id: SAMPLE_USER_ID,
					},
				}),
			),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventUserSelectRow: { role: "event_playlist_admin" },
		});

		await expect(Effect.runPromise(eventSave(ctx))).rejects.toThrow(
			/Event playlist admins can only update active playlist, active song, and active slide/,
		);
	});

	it("allows event admin to update unrestricted event fields", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({
			body: {
				event_id: "evt-admin",
				event_name: "Updated Name",
				event_slug: "updated-slug",
				event_description: "updated description",
				is_public: true,
			},
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(
				makeUserSessionData({
					user: {
						user_id: SAMPLE_USER_ID,
					},
				}),
			),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventUserSelectRow: { role: "event_admin" },
			eventUpdateSelectRow: { event_id: "evt-admin", private_notes: "" },
			eventPublicUpdateRow: {
				event_id: "evt-admin",
				event_name: "Updated Name",
				event_slug: "updated-slug",
				event_description: "updated description",
			},
		});

		const res = await Effect.runPromise(eventSave(ctx));
		expect(res).toStrictEqual({
			event_id: "evt-admin",
			event_name: "Updated Name",
			event_slug: "updated-slug",
			event_description: "updated description",
		});
	});

	it("rejects when user is not owner or admin on update", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({ body: { event_id: "evt-x", event_name: "X", event_slug: "x" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(
				makeUserSessionData({
					user: {
						user_id: SAMPLE_USER_ID,
					},
				}),
			),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), { eventUserSelectRow: { role: "participant" } });

		await expect(Effect.runPromise(eventSave(ctx))).rejects.toThrow(/permission to update/);
	});
});
