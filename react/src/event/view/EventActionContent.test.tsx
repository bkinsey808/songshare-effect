import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import EventActionContent from "./EventActionContent";

const SINGLE_CALL_COUNT = 1;

describe("event action content", () => {
	/**
	 * Renders `EventActionContent` with default props plus any test-specific overrides.
	 *
	 * @param overrides - Partial prop overrides for the current test scenario.
	 * @returns Nothing. The function mounts the component into the test DOM.
	 */
	function renderEventActionContent(
		overrides: Partial<React.ComponentProps<typeof EventActionContent>> = {},
	): void {
		cleanup();
		const props: React.ComponentProps<typeof EventActionContent> = {
			canJoin: false,
			canLeave: false,
			isParticipant: false,
			isOwner: false,
			actionLoading: false,
			participantStatus: undefined,
			handleJoinEvent: vi.fn(),
			handleLeaveEvent: vi.fn(),
			...overrides,
		};

		render(<EventActionContent {...props} />);
	}

	it("renders a leave button and calls the leave handler", () => {
		// Arrange
		const handleLeaveEvent = vi.fn();

		renderEventActionContent({
			canLeave: true,
			isParticipant: true,
			handleLeaveEvent,
		});

		// Act
		const leaveEventButton = screen.getByRole("button", { name: "Leave Event" });
		fireEvent.click(leaveEventButton);

		// Assert
		expect(handleLeaveEvent).toHaveBeenCalledTimes(SINGLE_CALL_COUNT);
	});

	it("renders a join button and calls the join handler", () => {
		// Arrange
		const handleJoinEvent = vi.fn();

		renderEventActionContent({
			canJoin: true,
			handleJoinEvent,
		});

		// Act
		const joinEventButton = screen.getByRole("button", { name: "Join Event" });
		fireEvent.click(joinEventButton);

		// Assert
		expect(handleJoinEvent).toHaveBeenCalledTimes(SINGLE_CALL_COUNT);
	});

	it("shows a loading leave label and disables the button while leaving", () => {
		// Act
		renderEventActionContent({
			canLeave: true,
			isParticipant: true,
			actionLoading: true,
		});

		const leavingButton = screen.getByRole("button", { name: "Leaving..." });

		// Assert
		expect(leavingButton).toHaveProperty("disabled", true);
	});

	it("shows a loading join label and disables the button while joining", () => {
		// Act
		renderEventActionContent({
			canJoin: true,
			actionLoading: true,
		});

		const joiningButton = screen.getByRole("button", { name: "Joining..." });

		// Assert
		expect(joiningButton).toHaveProperty("disabled", true);
	});

	it("shows the kicked message when the user cannot rejoin", () => {
		// Act
		renderEventActionContent({
			participantStatus: "kicked",
		});

		const kickedMessage = screen.getByText(
			"You have been removed from this event and cannot rejoin.",
		);

		// Assert
		expect(kickedMessage).not.toBeNull();
	});

	it("shows the generic unavailable message when the user cannot join", () => {
		// Act
		renderEventActionContent();

		const unavailableMessage = screen.getByText("You cannot join this event.");

		// Assert
		expect(unavailableMessage).not.toBeNull();
	});

	it("does not render a leave button for the owner", () => {
		// Act
		renderEventActionContent({
			canLeave: true,
			isParticipant: true,
			isOwner: true,
		});

		const leaveEventButton = screen.queryByRole("button", { name: "Leave Event" });

		// Assert
		expect(leaveEventButton).toBeNull();
	});

	it("prefers the leave action when both join and leave are available", () => {
		// Arrange
		const handleJoinEvent = vi.fn();
		const handleLeaveEvent = vi.fn();

		// Act
		renderEventActionContent({
			canJoin: true,
			canLeave: true,
			isParticipant: true,
			handleJoinEvent,
			handleLeaveEvent,
		});

		const leaveEventButton = screen.getByRole("button", { name: "Leave Event" });
		fireEvent.click(leaveEventButton);

		// Assert
		expect(screen.queryByRole("button", { name: "Join Event" })).toBeNull();
		expect(handleLeaveEvent).toHaveBeenCalledTimes(SINGLE_CALL_COUNT);
		expect(handleJoinEvent).not.toHaveBeenCalled();
	});

	it("shows the unavailable message for the owner instead of a leave action", () => {
		// Act
		renderEventActionContent({
			canLeave: true,
			isParticipant: true,
			isOwner: true,
		});

		const unavailableMessage = screen.getByText("You cannot join this event.");

		// Assert
		expect(unavailableMessage).not.toBeNull();
		expect(screen.queryByRole("button", { name: "Leave Event" })).toBeNull();
	});
});
