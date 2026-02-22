import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Slide } from "../song-form-types";

import SlidesGridRow from "./SlidesGridRow";

const GRID_WIDTH = 42;
const BASE_COL_SPAN = 1; // matches SLIDE_NAME_COL_COUNT in component

// mocks for third-party hooks used in SlidesGridRow
// @ts-expect-error - vitest helper types are slightly off
vi.mock<unknown>("@dnd-kit/sortable", () => ({
	useSortable: vi.fn(() => ({
		attributes: {},
		listeners: {},
		setNodeRef: vi.fn(),
		transform: undefined,
		transition: "",
		isDragging: false,
	})),
}));

// @ts-expect-error - vitest helper types are slightly off
vi.mock<unknown>("@dnd-kit/utilities", () => ({
	CSS: { Transform: { toString: (): string => "" } },
}));

// helper for narrowing delete props while keeping lint comments out of tests
// we avoid non-null assertions by throwing when undefined
function assumeDeleteProps(val: DeleteRowProps | undefined): DeleteRowProps {
	if (!val) {
		throw new Error("expected delete props");
	}
	return val;
}

// stubs for child components that capture props
// we only need the type once

// helper to call the optional setter without triggering unsafe-any errors
function callSetConfirm(props: SortableGridCellsProps | undefined, value: boolean): void {
	if (props && typeof props.setConfirmingDelete === "function") {
		// cast necessary because index signature makes prop type unknown
		(props.setConfirmingDelete as (confirm: boolean) => void)(value);
	}
}

type SortableGridCellsProps = {
	setConfirmingDelete?: (confirm: boolean) => void;
	[key: string]: unknown;
};

let latestGridCellsProps: SortableGridCellsProps | undefined = undefined;

// capture delete row props during render

type DeleteRowProps = {
	colSpan: number;
	isFaded: boolean;
	onCancel: () => void;
	onConfirm: () => void;
};
let latestDeleteProps: DeleteRowProps | undefined = undefined;

// @ts-expect-error - vitest helper types are slightly off
vi.mock<unknown>("./SortableGridCells", () => ({
	__esModule: true,
	default: (props: SortableGridCellsProps): unknown => {
		// capture props for assertions
		latestGridCellsProps = props;
		return <div />;
	},
}));

// @ts-expect-error - vitest helper types are slightly off
vi.mock<unknown>("./DeleteConfirmationRow", () => ({
	__esModule: true,
	default: (props: DeleteRowProps): unknown => {
		latestDeleteProps = props;
		return <div />;
	},
}));

// mocks are hoisted by Vitest, so we can import normally

type Props = React.ComponentProps<typeof SlidesGridRow>;

function makeProps(overrides: Partial<Props> = {}): Props {
	// test fixture only needs name; cast through unknown to avoid any
	const baseSlide: Slide = { slide_name: "Test slide", field_data: {} };

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
		getColumnWidth: vi.fn(() => GRID_WIDTH),
		globalIsDragging: false,
		isDuplicateRow: false,
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

		expect(latestGridCellsProps).toBeDefined();
		// we checked props presence above so we can index safely
		expect(latestGridCellsProps?.["slideId"]).toBe(props.slideId);
		expect(latestDeleteProps).toBeUndefined();
	});

	it("logs an error if fields prop is not an array", () => {
		vi.restoreAllMocks();
		latestGridCellsProps = undefined;
		latestDeleteProps = undefined;

		// override fields with wrong type to trigger error path
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

		// trigger confirm flow via the mocked SortableGridCells
		expect(latestGridCellsProps).toBeDefined();
		// invoke setter; waitFor will handle the re-render
		callSetConfirm(latestGridCellsProps, true);
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
