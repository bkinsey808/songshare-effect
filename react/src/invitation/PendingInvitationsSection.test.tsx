import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useLocale from "@/react/lib/language/locale/useLocale";
import forceCast from "@/react/lib/test-utils/forceCast";

import PendingInvitationsSection from "./PendingInvitationsSection";
import usePendingInvitationSection from "./usePendingInvitationSection";

vi.mock("./usePendingInvitationSection");
vi.mock("@/react/lib/language/locale/useLocale");

/**
 * Mock LibraryIcon component.
 */
function LibraryIconMock(): ReactElement {
	return <div data-testid="library-icon" />;
}

vi.mock("@/react/lib/design-system/icons/LibraryIcon", (): { default: typeof LibraryIconMock } => ({
	default: LibraryIconMock,
}));

describe("pendingInvitationsSection", () => {
	const handleAcceptCommunity = vi.fn();
	const handleDeclineCommunity = vi.fn();
	const handleAcceptEvent = vi.fn();
	const handleDeclineEvent = vi.fn();

	function setup(): void {
		cleanup();
		vi.clearAllMocks();
		vi.mocked(useLocale).mockReturnValue(
			forceCast({
				lang: "en",
				t: (_key: string, fallback: string) => fallback,
			}),
		);
	}

	it("renders nothing when there are no invitations and no error", () => {
		setup();
		vi.mocked(usePendingInvitationSection).mockReturnValue(
			forceCast({
				hasInvitations: false,
				invitationError: undefined,
				pendingCommunityInvitations: [],
				pendingEventInvitations: [],
			}),
		);

		const { container } = render(<PendingInvitationsSection />, { wrapper: MemoryRouter });
		expect(container.firstChild).toBeNull();
	});

	it("renders error message when present", () => {
		setup();
		vi.mocked(usePendingInvitationSection).mockReturnValue(
			forceCast({
				hasInvitations: false,
				invitationError: "Some error occurred",
				pendingCommunityInvitations: [],
				pendingEventInvitations: [],
			}),
		);

		render(<PendingInvitationsSection />, { wrapper: MemoryRouter });
		expect(screen.getByText("Some error occurred")).toStrictEqual(expect.any(Object));
	});

	it("renders community and event invitations", () => {
		setup();
		vi.mocked(usePendingInvitationSection).mockReturnValue(
			forceCast({
				hasInvitations: true,
				pendingCommunityInvitations: [
					{
						community_id: "c1",
						community_name: "Community One",
						community_slug: "c1-slug",
						accepted: false,
					},
				],
				pendingEventInvitations: [
					{
						event_id: "e1",
						event_name: "Event One",
						event_slug: "e1-slug",
						accepted: false,
					},
				],
				handleAcceptCommunity,
				handleDeclineCommunity,
				handleAcceptEvent,
				handleDeclineEvent,
			}),
		);

		render(<PendingInvitationsSection />, { wrapper: MemoryRouter });

		expect(screen.getByText("Community One")).toStrictEqual(expect.any(Object));
		expect(screen.getByText("Event One")).toStrictEqual(expect.any(Object));
	});

	it("calls community handlers correctly", () => {
		setup();
		vi.mocked(usePendingInvitationSection).mockReturnValue(
			forceCast({
				hasInvitations: true,
				pendingCommunityInvitations: [
					{
						community_id: "c1",
						community_name: "C1",
						community_slug: "c1-slug",
						accepted: false,
					},
				],
				pendingEventInvitations: [],
				handleAcceptCommunity,
				handleDeclineCommunity,
			}),
		);

		render(<PendingInvitationsSection />, { wrapper: MemoryRouter });

		const [acceptBtn] = screen.getAllByRole("button", { name: /accept/i });
		const [declineBtn] = screen.getAllByRole("button", { name: /decline/i });

		fireEvent.click(forceCast<HTMLElement>(acceptBtn));
		expect(handleAcceptCommunity).toHaveBeenCalledWith("c1");

		fireEvent.click(forceCast<HTMLElement>(declineBtn));
		expect(handleDeclineCommunity).toHaveBeenCalledWith("c1");
	});

	it("calls event handlers correctly", () => {
		setup();
		vi.mocked(usePendingInvitationSection).mockReturnValue(
			forceCast({
				hasInvitations: true,
				pendingCommunityInvitations: [],
				pendingEventInvitations: [
					{
						event_id: "e1",
						event_name: "E1",
						event_slug: "e1-slug",
						accepted: false,
					},
				],
				handleAcceptEvent,
				handleDeclineEvent,
			}),
		);

		render(<PendingInvitationsSection />, { wrapper: MemoryRouter });

		const [acceptBtn] = screen.getAllByRole("button", { name: /accept/i });
		const [declineBtn] = screen.getAllByRole("button", { name: /decline/i });

		fireEvent.click(forceCast<HTMLElement>(acceptBtn));
		expect(handleAcceptEvent).toHaveBeenCalledWith("e1");

		fireEvent.click(forceCast<HTMLElement>(declineBtn));
		expect(handleDeclineEvent).toHaveBeenCalledWith("e1");
	});

	it("renders visit link when invitation is accepted", () => {
		setup();
		vi.mocked(usePendingInvitationSection).mockReturnValue(
			forceCast({
				hasInvitations: true,
				pendingCommunityInvitations: [
					{
						community_id: "c1",
						community_name: "Community One",
						community_slug: "c1-slug",
						accepted: true,
					},
				],
				pendingEventInvitations: [],
			}),
		);

		render(<PendingInvitationsSection />, { wrapper: MemoryRouter });

		expect(screen.getByText(/Visit Community/i)).toStrictEqual(expect.any(Object));
		expect(screen.queryByRole("button", { name: /accept/i })).toBeNull();
	});
});
