import { render, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";

import subscribeToPendingInvitations from "./subscribeToPendingInvitations";
import useInvitationSubscription from "./useInvitationSubscription";

// Automatic mocks - avoid untyped mock factories and require-hook for factories.
vi.mock("@/react/app-store/useAppStore");
vi.mock("./subscribeToPendingInvitations");

describe("useInvitationSubscription", () => {
	it("clears pending invitations when there is no signed-in user", async () => {
		const setPendingCommunityInvitations = vi.fn();
		const setPendingEventInvitations = vi.fn();

		// Configure store mock for this specific test
		vi.mocked(useAppStore).mockImplementation((selector) =>
			selector(
				forceCast({
					userSessionData: undefined,
					setPendingCommunityInvitations,
					setPendingEventInvitations,
					fetchPendingInvitations: vi.fn(),
				}),
			),
		);

		function TestComponent(): ReactElement {
			useInvitationSubscription();
			return <div />;
		}

		const { unmount } = render(<TestComponent />);

		await waitFor(() => {
			expect(setPendingCommunityInvitations).toHaveBeenCalledWith([]);
			expect(setPendingEventInvitations).toHaveBeenCalledWith([]);
		});

		expect(subscribeToPendingInvitations).not.toHaveBeenCalled();

		unmount();
	});

	it("fetches pending invitations and subscribes when user is signed in, and cleans up on unmount", async () => {
		const effectCalledSpy = vi.fn();
		const fetchPendingInvitationsMock = vi.fn().mockReturnValue(
			Effect.sync(() => {
				effectCalledSpy();
			}),
		);
		const subscribeCleanupMock = vi.fn();

		vi.mocked(useAppStore).mockImplementation((selector) =>
			selector(
				forceCast({
					userSessionData: { user: { user_id: "user-1" } },
					fetchPendingInvitations: fetchPendingInvitationsMock,
					setPendingCommunityInvitations: vi.fn(),
					setPendingEventInvitations: vi.fn(),
				}),
			),
		);

		// Mock getState for the subscription call
		vi.spyOn(useAppStore, "getState").mockReturnValue(forceCast({}));
		vi.mocked(subscribeToPendingInvitations).mockReturnValue(subscribeCleanupMock);

		function TestComponent(): ReactElement {
			useInvitationSubscription();
			return <div />;
		}

		const { unmount } = render(<TestComponent />);

		await waitFor(() => {
			expect(fetchPendingInvitationsMock).toHaveBeenCalledWith();
			expect(effectCalledSpy).toHaveBeenCalledWith();
			expect(subscribeToPendingInvitations).toHaveBeenCalledWith("user-1", expect.any(Function));
		});

		unmount();
		expect(subscribeCleanupMock).toHaveBeenCalledWith();
	});
});
