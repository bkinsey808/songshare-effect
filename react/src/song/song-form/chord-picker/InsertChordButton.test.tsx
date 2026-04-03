import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import InsertChordButton from "./InsertChordButton";

const ONE_CALL = 1;

describe("insertChordButton", () => {
	it("opens the chord picker when clicked", () => {
		const onOpenChordPicker = vi.fn();

		render(<InsertChordButton isEditingChord={false} onOpenChordPicker={onOpenChordPicker} />);

		fireEvent.click(screen.getByTestId("insert-chord-button"));

		expect(onOpenChordPicker).toHaveBeenCalledTimes(ONE_CALL);
	});

	it("shows edit label when editing an existing chord", () => {
		render(<InsertChordButton isEditingChord onOpenChordPicker={vi.fn()} />);

		expect(screen.getByRole("button", { name: "Edit Chord" })).toBeTruthy();
	});
});
