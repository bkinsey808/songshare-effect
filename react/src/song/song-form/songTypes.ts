// src/features/song-form/types.ts
export type Slide = Readonly<{
	slide_name: string;
	field_data: Readonly<Record<string, string>>;
}>;
