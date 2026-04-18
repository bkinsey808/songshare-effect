import { describe, expect, it, vi } from "vitest";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import { sliceResetFns } from "@/react/app-store/slice-reset-fns";
import type { AuthState } from "@/react/auth/slice/auth-slice.types";
import forceCast from "@/react/lib/test-utils/forceCast";

import createInvitationSlice from "./createInvitationSlice";
import type { InvitationSlice, PendingCommunityInvitation } from "./InvitationSlice.type";
import makeInvitationSlice from "./makeInvitationSlice.test-util";

const MIN_REGISTRATION = 0;

/**
 * Creates a minimal store with set/get/api and a calls log for createInvitationSlice tests.
 * Tracks what partials are passed to set for assertions.
 *
 * @returns mock store utilities used by tests
 * @returns mock store utilities used by tests
 */
function makeStore(): {
	set: Set<InvitationSlice>;
	get: Get<InvitationSlice>;
	calls: Partial<InvitationSlice>[];
	api: Api<InvitationSlice>;
} {
	const calls: Partial<InvitationSlice>[] = [];
	const state = makeInvitationSlice();

	/**
	 * Record a partial state patch for assertions in tests.
	 *
	 * @param partialOrFn - partial state or updater function applied to the mock
	 * @returns void
	 */
	function set(
		partialOrFn:
			| Partial<InvitationSlice>
			| ((previous: InvitationSlice) => Partial<InvitationSlice>),
	): void {
		if (typeof partialOrFn === "function") {
			const patch = (partialOrFn as (previous: InvitationSlice) => Partial<InvitationSlice>)(state);
			calls.push(patch);
		} else {
			calls.push(partialOrFn);
		}
	}

	/**
	 * Return the current mock InvitationSlice state used by tests.
	 *
	 * @returns InvitationSlice test double state
	 */
	function get(): InvitationSlice {
		return state;
	}

	const api: Api<InvitationSlice> = {
		getState: get,
		setState: set,
		subscribe:
			(_listener?: unknown): (() => void) =>
			() =>
				undefined,
		/**
		 * Return the initial mock state for assertions that need it.
		 *
		 * @returns InvitationSlice initial state
		 */
		getInitialState(): InvitationSlice {
			return state;
		},
	};

	return { set, get, calls, api };
}

describe("createInvitationSlice", () => {
	it("returns initial state and setter functions", () => {
		vi.resetAllMocks();

		const { set, get, api, calls } = makeStore();

		const slice = createInvitationSlice(set, forceCast<Get<InvitationSlice & AuthState>>(get), api);

		expect({
			pendingCommunityInvitations: slice.pendingCommunityInvitations,
			pendingEventInvitations: slice.pendingEventInvitations,
			isInvitationLoading: slice.isInvitationLoading,
			invitationError: slice.invitationError,
		}).toStrictEqual({
			pendingCommunityInvitations: [],
			pendingEventInvitations: [],
			isInvitationLoading: false,
			invitationError: undefined,
		});

		// Ensure setters call through to `set` with the correct partials.
		const community: PendingCommunityInvitation = {
			community_id: "c1",
			community_name: "Name",
			community_slug: "slug",
		};

		slice.setPendingCommunityInvitations([community]);
		expect(calls).toContainEqual({ pendingCommunityInvitations: [community] });

		const event = { event_id: "e1", event_name: "E", event_slug: "e-slug" };

		slice.setPendingEventInvitations([event]);
		expect(calls).toContainEqual({ pendingEventInvitations: [event] });

		slice.setInvitationLoading(true);
		expect(calls).toContainEqual({ isInvitationLoading: true });
	});

	it("registers a reset function that resets to the initial state", () => {
		vi.resetAllMocks();

		// Ensure a clean slate for the global reset set
		sliceResetFns.clear();

		const { set, get, api, calls } = makeStore();

		createInvitationSlice(set, forceCast<Get<InvitationSlice & AuthState>>(get), api);

		// One reset function should have been registered
		expect(sliceResetFns.size).toBeGreaterThan(MIN_REGISTRATION);

		// Invoke all registered reset functions and ensure `set` recorded the initial state
		for (const fn of sliceResetFns) {
			fn();
		}

		expect(calls).toContainEqual({
			pendingCommunityInvitations: [],
			pendingEventInvitations: [],
			isInvitationLoading: false,
			invitationError: undefined,
		});

		// Cleanup to avoid leaking into other tests
		sliceResetFns.clear();
	});
});
