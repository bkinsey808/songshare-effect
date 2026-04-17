import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";

import { defaultLanguage } from "@/shared/language/supported-languages";

import useSongFormValues from "./useSongFormValues";

describe("useSongFormValues", () => {
	it("initializes with empty controlled field values and can reset back to them", async () => {
		cleanup();
		const { result } = renderHook(() => {
			const formRef = useRef<HTMLFormElement | null>(null);
			return useSongFormValues({ formRef });
		});

		result.current.setFormValue("song_name", "Temporary Song");
		result.current.setFormValue("song_slug", "temporary-song");

		await waitFor(() => {
			expect(result.current.formValues.song_name).toBe("Temporary Song");
			expect(result.current.formValues.song_slug).toBe("temporary-song");
		});

		const emptyFormValues = result.current.resetFormValues();

		await waitFor(() => {
			expect(result.current.formValues).toStrictEqual(emptyFormValues);
			expect(result.current.formValues.lyrics).toStrictEqual([defaultLanguage]);
			expect(result.current.formValues.translations).toStrictEqual([]);
		});
	});

	it("generates a slug on blur when the name is present and the slug is empty", async () => {
		cleanup();
		const { result } = renderHook(() => {
			const formRef = useRef<HTMLFormElement | null>(null);
			return useSongFormValues({ formRef });
		});

		result.current.setFormValue("song_name", "My Test Song");

		await waitFor(() => {
			expect(result.current.formValues.song_name).toBe("My Test Song");
		});

		result.current.handleSongNameBlur();

		await waitFor(() => {
			expect(result.current.formValues.song_slug).toBe("my-test-song");
		});
	});

	it("does not overwrite an existing slug when the name field blurs", async () => {
		cleanup();
		const { result } = renderHook(() => {
			const formRef = useRef<HTMLFormElement | null>(null);
			return useSongFormValues({ formRef });
		});

		result.current.setFormValue("song_name", "My Test Song");
		result.current.setFormValue("song_slug", "existing-slug");

		await waitFor(() => {
			expect(result.current.formValues.song_slug).toBe("existing-slug");
		});

		result.current.handleSongNameBlur();

		await waitFor(() => {
			expect(result.current.formValues.song_slug).toBe("existing-slug");
		});
	});
});
