import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ImageLibraryEntry } from "@/react/image-library/image-library-types";
import forceCast from "@/react/lib/test-utils/forceCast";
import type { Slide } from "@/react/song/song-form/song-form-types";

import DeleteConfirmationRow, { type DeleteConfirmationRowProps } from "./DeleteConfirmationRow";
import SlidesGridRow from "./SlidesGridRow";
import SortableGridCells, {
	type SortableGridRowInnerProps,
} from "./sortable-grid-cells/SortableGridCells";

const BASE_COL_SPAN = 2; // matches FIXED_COLUMN_COUNT in component

vi.mock("@dnd-kit/sortable");
vi.mock("@dnd-kit/utilities");
vi.mock("./sortable-grid-cells/SortableGridCells");
vi.mock("./DeleteConfirmationRow");

vi.mocked(useSortable).mockReturnValue(
	forceCast<ReturnType<typeof useSortable>>({
		attributes: {},
		listeners: {},
		setNodeRef: vi.fn(),
		transform: undefined,
		transition: "",
		isDragging: false,
	}),
);

vi.spyOn(CSS.Transform, "toString").mockReturnValue("");

type SortableGridCellsProps = SortableGridRowInnerProps;
type DeleteRowProps = DeleteConfirmationRowProps;

let latestGridCellsProps: SortableGridCellsProps | undefined = undefined;
let latestDeleteProps: DeleteRowProps | undefined = undefined;

vi.mocked(SortableGridCells).mockImplementation((props) => {
	latestGridCellsProps = props;
	return <div />;
});

vi.mocked(DeleteConfirmationRow).mockImplementation((props) => {
	latestDeleteProps = props;
	return <div />;
});

/**
 * Assert that delete props are present and return them.
 *
 * @param val - Possibly undefined delete props captured from mocks
 * @returns The validated delete props
 */
function assumeDeleteProps(val: DeleteRowProps | undefined): DeleteRowProps {
	if (!val) {
		throw new Error("expected delete props");
	}
	return val;
}

/**
 * Assert that grid cell props are present and return them.
 *
 * @param val - Possibly undefined grid cell props captured from mocks
 * @returns The validated grid cell props
 */
function assumeGridCellsProps(val: SortableGridCellsProps | undefined): SortableGridCellsProps {
	if (!val) {
		throw new Error("expected grid cell props");
	}
	return val;
}

type Props = React.ComponentProps<typeof SlidesGridRow>;

/**
 * Build a full `SlidesGridRow` props object with sensible defaults for tests.
 *
 * @param overrides - Partial props to override the defaults
 * @returns Props suitable for rendering `SlidesGridRow` in tests
 */
function makeProps(overrides: Partial<Props> = {}): Props {
	const baseSlide: Slide = { slide_name: "Test slide", field_data: {} };
	const imageLibraryEntryList: readonly ImageLibraryEntry[] = [];

	const defaultProps: Props = {
		slideId: "slide-1",
		slide: baseSlide,
		fields: ["foo", "bar"],
		editSlideName: vi.fn(),
		editFieldValue: vi.fn(),
		safeGetField: vi.fn(() => ""),
		setSlideOrder: vi.fn(),
		slideOrder: ["slide-1"],
		duplicateSlide: vi.fn(),
		deleteSlide: vi.fn(),
		slides: { "slide-1": baseSlide },
		idx: 0,
		globalIsDragging: false,
		isDuplicateRow: false,
		backgroundPickerSlideId: undefined,
		isImageLibraryLoading: false,
		imageLibraryEntryList,
		toggleBackgroundPicker: vi.fn(),
		selectSlideBackgroundImage: vi.fn(),
		clearSlideBackgroundImage: vi.fn(),
		songChords: [],
		lyricsLanguages: ["en"],
		scriptLanguages: [],
	};

	return { ...defaultProps, ...overrides };
}

describe("slidesGridRow", () => {
	it("renders SortableGridCells when not confirming deletion", () => {
		vi.restoreAllMocks();
		latestGridCellsProps = undefined;
		latestDeleteProps = undefined;

		const props = makeProps();
		// React complains about <tr> in <div>; ignore it
		render(<SlidesGridRow {...props} />);

		const gridCellsProps = assumeGridCellsProps(latestGridCellsProps);
		expect(gridCellsProps.slideId).toBe(props.slideId);
		expect(latestDeleteProps).toBeUndefined();
	});

	it("logs an error if fields prop is not an array", () => {
		vi.restoreAllMocks();
		latestGridCellsProps = undefined;
		latestDeleteProps = undefined;

		// @ts-expect-error passing invalid type intentionally
		const props = makeProps({ fields: undefined });
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
			/* noop */
		});

		render(<SlidesGridRow {...props} />);

		expect(consoleSpy).toHaveBeenCalledWith(
			"SortableGridRow: unexpected fields value (expected array)",
			{ fields: props.fields },
		);

		consoleSpy.mockRestore();
	});

	it("passes correct props to DeleteConfirmationRow when confirming", async () => {
		vi.restoreAllMocks();
		latestGridCellsProps = undefined;
		latestDeleteProps = undefined;

		const props = makeProps({ slideOrder: ["slide-1"], globalIsDragging: true });

		render(<SlidesGridRow {...props} />);

		const gridCellsProps = assumeGridCellsProps(latestGridCellsProps);
		gridCellsProps.setConfirmingDelete(true);
		const expectedColSpan = BASE_COL_SPAN + props.fields.length;
		await waitFor(() => {
			expect(latestDeleteProps).toBeDefined();
		});
		const deleteProps = assumeDeleteProps(latestDeleteProps);
		expect(deleteProps.colSpan).toBe(expectedColSpan);
		expect(deleteProps.isFaded).toBe(true);

		deleteProps.onCancel();
		deleteProps.onConfirm();

		expect(props.setSlideOrder).toHaveBeenCalledWith([]);
		expect(props.deleteSlide).toHaveBeenCalledWith(props.slideId);
	});
});
