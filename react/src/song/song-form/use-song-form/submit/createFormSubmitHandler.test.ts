import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import makeNull from "@/shared/test-utils/makeNull.test-util";

import createFormSubmitHandler from "./createFormSubmitHandler";

const SONG_ID = "song-123";
const FIELDS = ["field-a", "field-b"];
const SLIDE_ORDER = ["slide-1", "slide-2"];
const SLIDES = { "slide-1": { slide_name: "Slide 1", field_data: {} } };

describe("createFormSubmitHandler", () => {
	it("returns early when formElement is null", async () => {
		const handleSubmit = vi.fn(() => Effect.void);
		const onSubmit = vi.fn();
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

		const handler = createFormSubmitHandler({
			songId: SONG_ID,
			fields: FIELDS,
			slideOrder: SLIDE_ORDER,
			slides: SLIDES,
			getTags: () => undefined,
			handleSubmit,
			onSubmit,
		});

		await handler(makeNull());

		expect(handleSubmit).not.toHaveBeenCalled();
		expect(errorSpy).toHaveBeenCalledWith("❌ Form element not found");
		errorSpy.mockRestore();
	});

	it("collects FormData and controlled state and calls handleSubmit", async () => {
		let capturedFormData: Record<string, unknown> | undefined = undefined;
		const handleSubmit = vi.fn((formData: Record<string, unknown>) =>
			Effect.sync(() => {
				capturedFormData = formData;
			}),
		);
		const onSubmit = vi.fn();

		const form = document.createElement("form");
		form.innerHTML = `
			<input name="song_name" value="My Song" />
			<input name="song_slug" value="my-slug" />
		`;
		document.body.append(form);

		const handler = createFormSubmitHandler({
			songId: SONG_ID,
			fields: FIELDS,
			slideOrder: SLIDE_ORDER,
			slides: SLIDES,
			getTags: () => ["rock", "pop"],
			handleSubmit,
			onSubmit,
		});

		await handler(form);

		expect(capturedFormData).toBeDefined();
		const data = forceCast<Record<string, unknown>>(capturedFormData);
		expect(data).toStrictEqual({
			song_name: "My Song",
			song_slug: "my-slug",
			song_id: SONG_ID,
			fields: [...FIELDS],
			slide_order: [...SLIDE_ORDER],
			slides: SLIDES,
			tags: ["rock", "pop"],
		});

		form.remove();
	});

	it("does not add song_id when songId is empty", async () => {
		let capturedFormData: Record<string, unknown> | undefined = undefined;
		const handleSubmit = vi.fn((formData: Record<string, unknown>) =>
			Effect.sync(() => {
				capturedFormData = formData;
			}),
		);

		const form = document.createElement("form");
		document.body.append(form);

		const handler = createFormSubmitHandler({
			songId: "",
			fields: FIELDS,
			slideOrder: SLIDE_ORDER,
			slides: SLIDES,
			getTags: () => undefined,
			handleSubmit,
			onSubmit: vi.fn(),
		});

		await handler(form);

		expect(capturedFormData).toBeDefined();
		const data = forceCast<Record<string, unknown>>(capturedFormData);
		expect(Object.hasOwn(data, "song_id")).toBe(false);

		form.remove();
	});

	it("reads tags at submit time from getTags", async () => {
		let capturedFormData: Record<string, unknown> | undefined = undefined;
		const handleSubmit = vi.fn((formData: Record<string, unknown>) =>
			Effect.sync(() => {
				capturedFormData = formData;
			}),
		);
		let currentTags: readonly string[] = ["initial"];

		const form = document.createElement("form");
		document.body.append(form);

		const handler = createFormSubmitHandler({
			songId: SONG_ID,
			fields: FIELDS,
			slideOrder: SLIDE_ORDER,
			slides: SLIDES,
			getTags: () => currentTags,
			handleSubmit,
			onSubmit: vi.fn(),
		});

		currentTags = ["latest-tag"];
		await handler(form);

		expect(forceCast<Record<string, unknown>>(capturedFormData)["tags"]).toStrictEqual([
			"latest-tag",
		]);

		form.remove();
	});
});
