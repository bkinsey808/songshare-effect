import { vi } from "vitest";

/* Centralized test helpers for constructing DOM events with safe typing.
   These helpers contain the required narrow casts in one place so tests don't
   need to repeat eslint-disable comments.
*/

// Keep the unsafe assertions confined to this test-only helper file.

export function makeChangeEvent(value: string): React.ChangeEvent<HTMLInputElement> {
	// Construct a minimal, fully-typed event object to avoid unsafe assertions.
	// Use a real input element so `currentTarget` has the right DOM type.
	const input = document.createElement("input");
	input.value = value;

	const event = {
		bubbles: false,
		cancelable: false,
		currentTarget: input,
		target: input,
		type: "change" as const,
		defaultPrevented: false,
		eventPhase: 0,
		isTrusted: true,
		nativeEvent: new Event("input"),
		persist: (): void => undefined,
		preventDefault: (): void => undefined,
		isDefaultPrevented: (): boolean => false,
		isPropagationStopped: (): boolean => false,
		stopPropagation: (): void => undefined,
		timeStamp: Date.now(),
	} satisfies React.ChangeEvent<HTMLInputElement>;

	return event;
}

export function makeFormEventWithPreventDefault(): {
	event: React.FormEvent<HTMLFormElement>;
	preventDefault: ReturnType<typeof vi.fn>;
} {
	const preventDefault = vi.fn();
	// Build a minimal FormEvent-like object that satisfies the `React.FormEvent` shape
	const form = document.createElement("form");

	const event = {
		bubbles: false,
		cancelable: false,
		currentTarget: form,
		target: form,
		type: "submit" as const,
		defaultPrevented: false,
		eventPhase: 0,
		isTrusted: true,
		nativeEvent: new Event("submit"),
		persist: (): void => undefined,
		preventDefault,
		isDefaultPrevented: (): boolean => false,
		isPropagationStopped: (): boolean => false,
		stopPropagation: (): void => undefined,
		timeStamp: Date.now(),
	} satisfies React.FormEvent<HTMLFormElement>;

	return { event, preventDefault };
}
