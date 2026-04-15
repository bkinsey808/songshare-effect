import { cleanup, fireEvent, render, renderHook, waitFor, within } from "@testing-library/react";
// no explicit ReactElement import — use inferred types
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";
import { TEST_USER_ID } from "@/shared/test-utils/testUserConstants";

import runAction from "../runAction";
import useEventParticipantManagement from "./useEventParticipantManagement";

// No manual mock for 'effect' to preserve full library exports used across the repo.
vi.mock("@/react/app-store/useAppStore");
vi.mock("../runAction");
vi.mock("@/shared/fetch/postJson");
vi.mock("../refreshEvent");

const mockedUseAppStore = vi.mocked(useAppStore);
const mockedRunAction = vi.mocked(runAction);

// Store slices accessed by this hook — used to build a typed mock state.
const mockFetchUserLibrary = vi.fn(() => Effect.sync(() => undefined));
const mockState = { fetchUserLibrary: mockFetchUserLibrary };

// Infer runAction opts from the real signature so it auto-tracks changes.
// Uses `infer First` instead of [0] to avoid a magic-number lint error.
type RunOpts = Parameters<typeof runAction> extends [infer First, ...unknown[]] ? First : never;

// Fixture constants — avoids magic strings throughout.
const EVT_ID = "evt-1";
const EVENT_SLUG = "slug-1";
const EVT_ID_9 = "evt-9";
const EVENT_SLUG_X = "slug-x";
const USER_ID_U1 = "u1";
const USER_ID_U2 = "u2";
const USER_ID_9 = "user-9";
const USER_ID_123 = TEST_USER_ID;
const USER_ID_Z = "uZ";
const INVITED_USER_INPUT = " invited-user ";
const BLANK_INPUT = "   ";

/**
 * Install a minimal mocked `useAppStore` for tests.
 *
 * Invokes each selector against a typed mock state object instead of
 * inspecting the stringified selector source, keeping the pattern robust
 * across builds and minification.
 *
 * @returns fetchUserLibrary - mocked stub returned by the selector
 */
function installStore(): { fetchUserLibrary: typeof mockFetchUserLibrary } {
	mockFetchUserLibrary.mockClear();
	// Invoke each selector against the mock state so the real selector runs.
	// forceCast wraps the double assertion to keep the call-site lint-clean.
	mockedUseAppStore.mockImplementation((selector: unknown) =>
		forceCast<(state: typeof mockState) => unknown>(selector)(mockState),
	);
	return { fetchUserLibrary: mockFetchUserLibrary };
}

/**
 * Minimal test harness that renders `useEventParticipantManagement` and
 * exposes its outputs and handlers in a tiny DOM surface used by tests.
 *
 * @param props - props passed to the harness component
 * @param currentEventId - optional current event id passed to the hook
 * @param event_slug - optional event slug passed to the hook
 * @returns React element containing invite input and action buttons
 */
function Harness(props: { currentEventId?: string; event_slug?: string }): ReactElement {
	const { inviteUserIdInput, onInviteUserSelect, onInviteClick, onKickParticipant } =
		useEventParticipantManagement({
			currentEventId: props.currentEventId,
			event_slug: props.event_slug,
			fetchEventBySlug: (_slug: string) => Effect.sync(() => undefined),
			setActionState: vi.fn(),
		});

	return (
		<div>
			{/* invite-input: reflects the currently selected user id */}
			<span data-testid="invite-input">{inviteUserIdInput ?? ""}</span>

			{/* select-u1: simulates selecting USER_ID_U1 from the invite search */}
			<button
				data-testid="select-u1"
				type="button"
				onClick={() => {
					onInviteUserSelect(USER_ID_U1);
				}}
			>
				select-u1
			</button>

			{/* invite-btn: submits the currently selected user as an invite */}
			<button
				data-testid="invite-btn"
				type="button"
				onClick={() => {
					onInviteClick();
				}}
			>
				invite
			</button>

			{/* kick-u2: kicks USER_ID_U2 from the event */}
			<button
				data-testid="kick-u2"
				type="button"
				onClick={() => {
					onKickParticipant(USER_ID_U2);
				}}
			>
				kick-u2
			</button>
		</div>
	);
}

describe("useEventParticipantManagement — Harness", () => {
	it("harness integrates with dom (documentation by harness)", async () => {
		// cleanup() is required: no globals:true and afterEach is disallowed by
		// the project linter. Each harness test starts clean by calling cleanup() itself.
		cleanup();
		mockedRunAction.mockReset();
		installStore();

		const rendered = render(<Harness currentEventId={EVT_ID} event_slug={EVENT_SLUG} />);

		const selectBtn = within(rendered.container).getByTestId("select-u1");
		fireEvent.click(selectBtn);

		await waitFor(() => {
			expect(within(rendered.container).getByTestId("invite-input").textContent).toBe(USER_ID_U1);
		});
	});

	it("invite button runs runAction with actionKey invite and clears the input", async () => {
		cleanup();
		mockedRunAction.mockReset();
		installStore();

		// Execute the action the hook passes so state updates propagate.
		mockedRunAction.mockImplementation(async (opts: RunOpts) => {
			await opts.action();
		});

		const rendered = render(<Harness currentEventId={EVT_ID} event_slug={EVENT_SLUG} />);

		// Select a user then click invite.
		fireEvent.click(within(rendered.container).getByTestId("select-u1"));
		await waitFor(() => {
			expect(within(rendered.container).getByTestId("invite-input").textContent).toBe(USER_ID_U1);
		});

		fireEvent.click(within(rendered.container).getByTestId("invite-btn"));

		await waitFor(() => {
			expect(mockedRunAction).toHaveBeenCalledWith(
				expect.objectContaining({ actionKey: "invite" }),
			);
			// invite input cleared by hook after action completes
			expect(within(rendered.container).getByTestId("invite-input").textContent).toBe("");
		});
	});

	it("kick button runs runAction with actionKey kick:<userId>", async () => {
		cleanup();
		mockedRunAction.mockReset();
		installStore();

		mockedRunAction.mockImplementation(async (opts: RunOpts) => {
			await opts.action();
		});

		const rendered = render(<Harness currentEventId={EVT_ID} event_slug={EVENT_SLUG} />);

		fireEvent.click(within(rendered.container).getByTestId("kick-u2"));

		await waitFor(() => {
			expect(mockedRunAction).toHaveBeenCalledWith(
				expect.objectContaining({ actionKey: `kick:${USER_ID_U2}` }),
			);
		});
	});
});

describe("useEventParticipantManagement", () => {
	it("initializes with undefined inviteUserIdInput and responds to onInviteUserSelect", async () => {
		mockedRunAction.mockReset();
		installStore();
		const { result } = renderHook(() =>
			useEventParticipantManagement({
				currentEventId: undefined,
				event_slug: undefined,
				fetchEventBySlug: (_slug: string) => Effect.sync(() => undefined),
				setActionState: vi.fn(),
			}),
		);

		expect(result.current.inviteUserIdInput).toBeUndefined();

		result.current.onInviteUserSelect(USER_ID_123);
		await waitFor(() => {
			expect(result.current.inviteUserIdInput).toBe(USER_ID_123);
		});
	});

	it("does not call runAction when currentEventId is undefined", () => {
		mockedRunAction.mockReset();
		installStore();
		const { result } = renderHook(() =>
			useEventParticipantManagement({
				currentEventId: undefined,
				event_slug: undefined,
				fetchEventBySlug: (_slug: string) => Effect.sync(() => undefined),
				setActionState: vi.fn(),
			}),
		);

		result.current.onInviteUserSelect(USER_ID_U1);
		result.current.onInviteClick();
		expect(mockedRunAction).not.toHaveBeenCalled();
	});

	it("does not call runAction when the invite input is blank", () => {
		mockedRunAction.mockReset();
		installStore();
		const { result } = renderHook(() =>
			useEventParticipantManagement({
				currentEventId: EVT_ID,
				event_slug: undefined,
				fetchEventBySlug: (_slug: string) => Effect.sync(() => undefined),
				setActionState: vi.fn(),
			}),
		);

		result.current.onInviteUserSelect(BLANK_INPUT);
		result.current.onInviteClick();
		expect(mockedRunAction).not.toHaveBeenCalled();
	});

	it("calls runAction with actionKey invite and clears inviteUserIdInput when action runs", async () => {
		mockedRunAction.mockReset();
		installStore();
		mockedRunAction.mockImplementation(async (opts: RunOpts) => {
			await opts.action();
		});

		const { result } = renderHook(() =>
			useEventParticipantManagement({
				currentEventId: EVT_ID,
				event_slug: EVENT_SLUG,
				fetchEventBySlug: (_slug: string) => Effect.sync(() => undefined),
				setActionState: vi.fn(),
			}),
		);

		result.current.onInviteUserSelect(INVITED_USER_INPUT);
		await waitFor(() => {
			expect(result.current.inviteUserIdInput).toBe(INVITED_USER_INPUT);
		});

		result.current.onInviteClick();

		await waitFor(() => {
			expect(mockedRunAction).toHaveBeenCalledWith(
				expect.objectContaining({ actionKey: "invite" }),
			);
			// action clears invite input
			expect(result.current.inviteUserIdInput).toBeUndefined();
		});
	});

	it("calls runAction with actionKey kick:<userId> for onKickParticipant", async () => {
		mockedRunAction.mockReset();
		installStore();
		mockedRunAction.mockImplementation(async (opts: RunOpts) => {
			await opts.action();
		});

		const { result } = renderHook(() =>
			useEventParticipantManagement({
				currentEventId: EVT_ID_9,
				event_slug: EVENT_SLUG_X,
				fetchEventBySlug: (_slug: string) => Effect.sync(() => undefined),
				setActionState: vi.fn(),
			}),
		);

		result.current.onKickParticipant(USER_ID_9);

		await waitFor(() => {
			expect(mockedRunAction).toHaveBeenCalledWith(
				expect.objectContaining({ actionKey: `kick:${USER_ID_9}` }),
			);
		});
	});

	it("does not call runAction when onKickParticipant is called with no currentEventId", () => {
		mockedRunAction.mockReset();
		installStore();
		const { result } = renderHook(() =>
			useEventParticipantManagement({
				currentEventId: undefined,
				event_slug: undefined,
				fetchEventBySlug: (_slug: string) => Effect.sync(() => undefined),
				setActionState: vi.fn(),
			}),
		);

		result.current.onKickParticipant(USER_ID_Z);
		expect(mockedRunAction).not.toHaveBeenCalled();
	});
});
