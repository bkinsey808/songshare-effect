import { act, cleanup, fireEvent, render, renderHook, within } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import searchTagsRequest from "@/react/tag-library/searchTagsRequest";

import useTagInput from "./useTagInput";

vi.mock("@/react/tag-library/searchTagsRequest");

const DEBOUNCE_DELAY_MS = 250;

function makeChangeEvent(value: string): React.ChangeEvent<HTMLInputElement> {
	return forceCast<React.ChangeEvent<HTMLInputElement>>({ target: { value } });
}

function makeKeyDownEvent(key: string): React.KeyboardEvent<HTMLInputElement> {
	return forceCast<React.KeyboardEvent<HTMLInputElement>>({ key, preventDefault: vi.fn() });
}

/**
 * Harness for useTagInput — "Documentation by Harness".
 *
 * Shows how useTagInput integrates into a tag input component:
 * - Typing triggers debounced autocomplete
 * - Enter/blur add the current input value as a tag
 * - Escape closes suggestions
 * - Suggestion click adds a tag
 * - Badge remove button removes a tag
 */
function Harness(props: {
	value: readonly string[];
	onChange: (tags: string[]) => void;
}): ReactElement {
	const {
		addTag,
		handleBlur,
		handleInputChange,
		handleKeyDown,
		inputValue,
		isOpen,
		removeTag,
		suggestions,
	} = useTagInput(props.value, props.onChange);

	return (
		<div>
			<input
				data-testid="input"
				value={inputValue}
				onChange={handleInputChange}
				onKeyDown={handleKeyDown}
				onBlur={handleBlur}
			/>
			<div data-testid="input-value">{inputValue}</div>
			<div data-testid="is-open">{String(isOpen)}</div>
			<ul data-testid="suggestions">
				{suggestions.map((slug) => (
					<li key={slug}>
						<button
							type="button"
							data-testid={`suggestion-${slug}`}
							onClick={() => {
								addTag(slug);
							}}
						>
							{slug}
						</button>
					</li>
				))}
			</ul>
			<ul data-testid="tags">
				{props.value.map((slug) => (
					<li key={slug}>
						<span data-testid={`tag-${slug}`}>{slug}</span>
						<button
							type="button"
							data-testid={`remove-${slug}`}
							onClick={() => {
								removeTag(slug);
							}}
						>
							Remove
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}

describe("useTagInput — Harness", () => {
	it("typing triggers debounced autocomplete and opens suggestions", async () => {
		cleanup();
		vi.resetAllMocks();
		vi.useFakeTimers();
		vi.mocked(searchTagsRequest).mockReturnValue(Effect.succeed(["indie-rock", "jazz"]));
		const onChange = vi.fn();

		const { container } = render(<Harness value={[]} onChange={onChange} />);

		fireEvent.change(within(container).getByTestId("input"), {
			target: { value: "ind" },
		});

		expect(forceCast<HTMLElement>(within(container).getByTestId("is-open")).textContent).toBe(
			"false",
		);

		await act(async () => {
			vi.advanceTimersByTime(DEBOUNCE_DELAY_MS);
			await Promise.resolve();
		});

		expect(forceCast<HTMLElement>(within(container).getByTestId("is-open")).textContent).toBe(
			"true",
		);
		expect(within(container).getByTestId("suggestion-indie-rock")).toBeDefined();
		vi.useRealTimers();
	});

	it("clicking a suggestion calls onChange with the new tag", async () => {
		cleanup();
		vi.resetAllMocks();
		vi.useFakeTimers();
		vi.mocked(searchTagsRequest).mockReturnValue(Effect.succeed(["indie-rock"]));
		const onChange = vi.fn();

		const { container } = render(<Harness value={[]} onChange={onChange} />);

		fireEvent.change(within(container).getByTestId("input"), {
			target: { value: "ind" },
		});
		await act(async () => {
			vi.advanceTimersByTime(DEBOUNCE_DELAY_MS);
			await Promise.resolve();
		});

		fireEvent.click(within(container).getByTestId("suggestion-indie-rock"));

		expect(onChange).toHaveBeenCalledWith(["indie-rock"]);
		vi.useRealTimers();
	});

	it("clicking remove calls onChange without that tag", () => {
		cleanup();
		vi.resetAllMocks();
		const onChange = vi.fn();

		const { container } = render(<Harness value={["indie-rock", "jazz"]} onChange={onChange} />);

		fireEvent.click(within(container).getByTestId("remove-indie-rock"));

		expect(onChange).toHaveBeenCalledWith(["jazz"]);
	});

	it("empty query clears suggestions immediately", () => {
		cleanup();
		vi.resetAllMocks();
		vi.useFakeTimers();
		const onChange = vi.fn();

		const { container } = render(<Harness value={[]} onChange={onChange} />);

		fireEvent.change(within(container).getByTestId("input"), {
			target: { value: "" },
		});

		expect(forceCast<HTMLElement>(within(container).getByTestId("is-open")).textContent).toBe(
			"false",
		);
		expect(searchTagsRequest).not.toHaveBeenCalled();
		vi.useRealTimers();
	});
});

describe("useTagInput — renderHook", () => {
	it("starts with empty inputValue, no suggestions, closed", () => {
		vi.resetAllMocks();
		const { result } = renderHook(() => useTagInput([], vi.fn()));

		expect(result.current.inputValue).toBe("");
		expect(result.current.suggestions).toStrictEqual([]);
		expect(result.current.isOpen).toBe(false);
	});

	it("addTag normalizes and adds slug, resets inputValue", () => {
		vi.resetAllMocks();
		const onChange = vi.fn();
		const { result } = renderHook(() => useTagInput([], onChange));

		act(() => {
			result.current.addTag("  Indie-Rock  ");
		});

		expect(onChange).toHaveBeenCalledWith(["indie-rock"]);
	});

	it("addTag no-ops for empty slug", () => {
		vi.resetAllMocks();
		const onChange = vi.fn();
		const { result } = renderHook(() => useTagInput([], onChange));

		act(() => {
			result.current.addTag("   ");
		});

		expect(onChange).not.toHaveBeenCalled();
	});

	it("addTag no-ops for duplicate slug", () => {
		vi.resetAllMocks();
		const onChange = vi.fn();
		const { result } = renderHook(() => useTagInput(["jazz"], onChange));

		act(() => {
			result.current.addTag("jazz");
		});

		expect(onChange).not.toHaveBeenCalled();
	});

	it("removeTag calls onChange without the slug", () => {
		vi.resetAllMocks();
		const onChange = vi.fn();
		const { result } = renderHook(() => useTagInput(["jazz", "indie-rock"], onChange));

		act(() => {
			result.current.removeTag("jazz");
		});

		expect(onChange).toHaveBeenCalledWith(["indie-rock"]);
	});

	it("handleKeyDown Enter adds the current inputValue", () => {
		vi.resetAllMocks();
		const onChange = vi.fn();
		const { result } = renderHook(() => useTagInput([], onChange));

		act(() => {
			result.current.handleInputChange(makeChangeEvent("blues"));
		});
		act(() => {
			result.current.handleKeyDown(makeKeyDownEvent("Enter"));
		});

		expect(onChange).toHaveBeenCalledWith(["blues"]);
	});

	it("handleKeyDown Escape closes suggestions without adding", async () => {
		vi.resetAllMocks();
		vi.useFakeTimers();
		vi.mocked(searchTagsRequest).mockReturnValue(Effect.succeed(["blues"]));
		const onChange = vi.fn();
		const { result } = renderHook(() => useTagInput([], onChange));

		act(() => {
			result.current.handleInputChange(makeChangeEvent("blu"));
		});
		await act(async () => {
			vi.advanceTimersByTime(DEBOUNCE_DELAY_MS);
			await Promise.resolve();
		});
		expect(result.current.isOpen).toBe(true);

		act(() => {
			result.current.handleKeyDown(makeKeyDownEvent("Escape"));
		});

		expect(result.current.isOpen).toBe(false);
		expect(onChange).not.toHaveBeenCalled();
		vi.useRealTimers();
	});

	it("handleBlur adds the current inputValue", () => {
		vi.resetAllMocks();
		const onChange = vi.fn();
		const { result } = renderHook(() => useTagInput([], onChange));

		act(() => {
			result.current.handleInputChange(makeChangeEvent("world-music"));
		});
		act(() => {
			result.current.handleBlur();
		});

		expect(onChange).toHaveBeenCalledWith(["world-music"]);
	});

	it("suggestions already in value are filtered out", async () => {
		vi.resetAllMocks();
		vi.useFakeTimers();
		vi.mocked(searchTagsRequest).mockReturnValue(Effect.succeed(["jazz", "blues"]));
		const { result } = renderHook(() => useTagInput(["jazz"], vi.fn()));

		act(() => {
			result.current.handleInputChange(makeChangeEvent("j"));
		});
		await act(async () => {
			vi.advanceTimersByTime(DEBOUNCE_DELAY_MS);
			await Promise.resolve();
		});
		expect(result.current.suggestions).toStrictEqual(["blues"]);

		vi.useRealTimers();
	});

	it("clears debounce timer on unmount", () => {
		vi.resetAllMocks();
		vi.useFakeTimers();
		vi.mocked(searchTagsRequest).mockReturnValue(Effect.succeed([]));
		const { result, unmount } = renderHook(() => useTagInput([], vi.fn()));

		act(() => {
			result.current.handleInputChange(makeChangeEvent("foo"));
		});
		unmount();
		act(() => {
			vi.advanceTimersByTime(DEBOUNCE_DELAY_MS);
		});

		expect(searchTagsRequest).not.toHaveBeenCalled();
		vi.useRealTimers();
	});
});
