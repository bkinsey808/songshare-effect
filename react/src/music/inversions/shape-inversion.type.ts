import type { SciInversion } from "@/react/music/inversions/computeSciInversions";

type ShapeInversion = Readonly<{
	inversion: SciInversion;
	sourceShapeCode: string;
	sourceShapeName: string;
	displayToken: string;
}>;

/** Ordinal and source shape info for a direct-result shape that is also a known inversion. */
type DirectShapeOrdinal = Readonly<{
	ordinalLabel: string;
	sourceShapeName: string;
}>;

export type { DirectShapeOrdinal, ShapeInversion };
