import { cleanup, render, renderHook, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { defaultLanguage } from "@/shared/language/supported-languages";

import useSongFormValues from "./useSongFormValues";

/**
 * Harness for useSongFormValues.
 *
 * @returns A small DOM fragment
 */
function Harness(): ReactElement {
	const formRef = useRef<HTMLFormElement>(forceCast<HTMLFormElement>(undefined));
	const { formValues, setFormValue, setFormValuesState, handleSongNameBlur, resetFormValues } =
		useSongFormValues({
			formRef,
		});

	return (
		<div>
			<span data-testid="song-name">{formValues.song_name}</span>
			<span data-testid="song-slug">{formValues.song_slug}</span>
			<button
				type="button"
				data-testid="set-name"
				onClick={() => {
					setFormValue("song_name", "New Name");
				}}
			>
				Set Name
			</button>
			<button
				type="button"
				data-testid="set-state"
				onClick={() => {
					setFormValuesState((prev) => ({ ...prev, song_name: "From State" }));
				}}
			>
				Set State
			</button>
			<button type="button" data-testid="blur-name" onClick={handleSongNameBlur}>
				Blur Name
			</button>
			<button type="button" data-testid="reset" onClick={resetFormValues}>
				Reset
			</button>
		</div>
	);
}

describe("useSongFormValues — renderHook", () => {
	it("initializes with empty controlled field values and can reset back to them", async () => {
		// Arrange
		cleanup();
		const { result } = renderHook(() => {
			const formRef = useRef<HTMLFormElement>(forceCast<HTMLFormElement>(undefined));
			return useSongFormValues({ formRef });
		});

		// Act — cycle 1: set values
		result.current.setFormValue("song_name", "Temporary Song");
		result.current.setFormValue("song_slug", "temporary-song");

		await waitFor(() => {
			expect(result.current.formValues.song_name).toBe("Temporary Song");
			expect(result.current.formValues.song_slug).toBe("temporary-song");
		});

		// Act — cycle 2: reset
		const emptyFormValues = result.current.resetFormValues();

		// Assert
		await waitFor(() => {
			expect(result.current.formValues).toStrictEqual(emptyFormValues);
			expect(result.current.formValues.lyrics).toStrictEqual([defaultLanguage]);
			expect(result.current.formValues.translations).toStrictEqual([]);
		});
	});

	it("generates a slug on blur when the name is present and the slug is empty", async () => {
		// Arrange
		cleanup();
		const { result } = renderHook(() => {
			const formRef = useRef<HTMLFormElement>(forceCast<HTMLFormElement>(undefined));
			return useSongFormValues({ formRef });
		});

		result.current.setFormValue("song_name", "My Test Song");

		await waitFor(() => {
			expect(result.current.formValues.song_name).toBe("My Test Song");
		});

		// Act
		result.current.handleSongNameBlur();

		// Assert
		await waitFor(() => {
			expect(result.current.formValues.song_slug).toBe("my-test-song");
		});
	});

	it("does not overwrite an existing slug when the name field blurs", async () => {
		// Arrange
		cleanup();
		const { result } = renderHook(() => {
			const formRef = useRef<HTMLFormElement>(forceCast<HTMLFormElement>(undefined));
			return useSongFormValues({ formRef });
		});

		result.current.setFormValue("song_name", "My Test Song");
		result.current.setFormValue("song_slug", "existing-slug");

		await waitFor(() => {
			expect(result.current.formValues.song_slug).toBe("existing-slug");
		});

		// Act
		result.current.handleSongNameBlur();

		// Assert
		await waitFor(() => {
			expect(result.current.formValues.song_slug).toBe("existing-slug");
		});
	});
});

describe("useSongFormValues — Harness", () => {
	it("harness renders and updates state via multiple handlers", async () => {
		// Arrange
		cleanup();

		// Act
		const { getByTestId } = render(<Harness />);

		// Assert — initial
		expect(getByTestId("song-name").textContent).toBe("");

		// Act — set name
		getByTestId("set-name").click();

		// Assert
		await waitFor(() => {
			expect(getByTestId("song-name").textContent).toBe("New Name");
		});

		// Act — blur to generate slug
		getByTestId("blur-name").click();

		// Assert
		await waitFor(() => {
			expect(getByTestId("song-slug").textContent).toBe("new-name");
		});

		// Act — set state directly
		getByTestId("set-state").click();

		// Assert
		await waitFor(() => {
			expect(getByTestId("song-name").textContent).toBe("From State");
		});

		// Act — reset
		getByTestId("reset").click();

		// Assert
		await waitFor(() => {
			expect(getByTestId("song-name").textContent).toBe("");
			expect(getByTestId("song-slug").textContent).toBe("");
		});
	});
});
