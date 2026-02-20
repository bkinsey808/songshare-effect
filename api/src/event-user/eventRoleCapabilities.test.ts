import { describe, expect, it } from "vitest";

import { getEventRoleCapabilities, normalizeEventRole } from "./eventRoleCapabilities";

describe("eventRoleCapabilities", () => {
	it("returns undefined for unknown role values", () => {
		expect(normalizeEventRole("admin")).toBeUndefined();
	});

	it("grants full capabilities to owner and event_admin", () => {
		expect(getEventRoleCapabilities("owner")).toStrictEqual({
			canManageParticipants: true,
			canManageRoles: true,
			canUpdateEventAllFields: true,
			canUpdateEventPlaybackFields: true,
		});
		expect(getEventRoleCapabilities("event_admin")).toStrictEqual({
			canManageParticipants: true,
			canManageRoles: true,
			canUpdateEventAllFields: true,
			canUpdateEventPlaybackFields: true,
		});
	});

	it("limits playlist admins to playback updates only", () => {
		expect(getEventRoleCapabilities("event_playlist_admin")).toStrictEqual({
			canManageParticipants: false,
			canManageRoles: false,
			canUpdateEventAllFields: false,
			canUpdateEventPlaybackFields: true,
		});
		expect(getEventRoleCapabilities("admin")).toStrictEqual({
			canManageParticipants: false,
			canManageRoles: false,
			canUpdateEventAllFields: false,
			canUpdateEventPlaybackFields: false,
		});
	});
});
