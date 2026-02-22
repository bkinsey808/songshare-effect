import { vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

/* Centralized test helpers for constructing DOM events with safe typing.
   These helpers contain the required narrow casts in one place so tests don't
   need to repeat oxlint-disable comments.
*/
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
	// oxlint-disable-next-line @typescript-eslint/no-deprecated -- narrow test helper; FormEvent shape is intentional here
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
		// oxlint-disable-next-line @typescript-eslint/no-deprecated -- narrow deprecation: React.FormEvent used intentionally for helper
	} satisfies React.FormEvent<HTMLFormElement>;

	return { event, preventDefault };
}

export function makeKeyboardEventWithPreventDefault(key: string): {
	event: React.KeyboardEvent;
	preventDefault: ReturnType<typeof vi.fn>;
} {
	const preventDefault = vi.fn();
	const el = document.createElement("div");

	const event = {
		bubbles: false,
		cancelable: false,
		currentTarget: el,
		target: el,
		type: "keydown" as const,
		defaultPrevented: false,
		eventPhase: 0,
		isTrusted: true,
		nativeEvent: new KeyboardEvent("keydown", { key }),
		persist: (): void => undefined,
		preventDefault,
		isDefaultPrevented: (): boolean => false,
		isPropagationStopped: (): boolean => false,
		stopPropagation: (): void => undefined,
		timeStamp: Date.now(),
		key,
	};

	// Confine the narrow cast to this helper so tests can use a properly-typed `React.KeyboardEvent` without repeating an unsafe cast.
	return { event: forceCast<React.KeyboardEvent>(event), preventDefault };
}

/**
 * Build a minimal `MouseEvent` with spies for preventDefault/stopPropagation.
 *
 * @returns well-typed React.MouseEvent<HTMLButtonElement>
 */
export function makeMouseEvent(): React.MouseEvent<HTMLButtonElement> {
	const preventDefault = vi.fn();
	const stopPropagation = vi.fn();
	const button = document.createElement("button");

	const event = {
		bubbles: false,
		cancelable: false,
		currentTarget: button,
		target: button,
		type: "click" as const,
		defaultPrevented: false,
		eventPhase: 0,
		isTrusted: true,
		nativeEvent: new MouseEvent("click"),
		persist: (): void => undefined,
		preventDefault,
		isDefaultPrevented: (): boolean => false,
		isPropagationStopped: (): boolean => false,
		stopPropagation,
		timeStamp: Date.now(),
	};

	// Confine the unsafe cast to this helper; consumer tests can use a
	// properly-typed `React.MouseEvent` without repeating the cast.
	return forceCast<React.MouseEvent<HTMLButtonElement>>(event);
}
