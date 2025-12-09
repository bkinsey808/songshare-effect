import { Schema } from "effect";

// Small, named sub-schemas so the top-level type resolves accurately.
const slideFieldDataSchema: Schema.Record$<typeof Schema.String, typeof Schema.String> = Schema.Record({
  key: Schema.String,
  value: Schema.String,
});

const slideValueSchema: Schema.Struct<{
  slide_name: typeof Schema.String;
  field_data: typeof slideFieldDataSchema;
}> = Schema.Struct({
  slide_name: Schema.String,
  field_data: slideFieldDataSchema,
});

const slidesSchema: Schema.Record$<typeof Schema.String, typeof slideValueSchema> = Schema.Record({
  key: Schema.String,
  value: slideValueSchema,
});

const fieldsArraySchema: Schema.Array$<typeof Schema.String> = Schema.Array(Schema.String);

export const SongFormSchema: Schema.Struct<{
  song_id: Schema.optional<typeof Schema.String>;
  song_name: typeof Schema.String;
  song_slug: typeof Schema.String;
  short_credit: Schema.optional<typeof Schema.String>;
  long_credit: Schema.optional<typeof Schema.String>;
  private_notes: Schema.optional<typeof Schema.String>;
  public_notes: Schema.optional<typeof Schema.String>;
  fields: typeof fieldsArraySchema;
  slide_order: typeof fieldsArraySchema;
  slides: typeof slidesSchema;
}> = Schema.Struct({
  song_id: Schema.optional(Schema.String),
  song_name: Schema.String,
  song_slug: Schema.String,
  short_credit: Schema.optional(Schema.String),
  long_credit: Schema.optional(Schema.String),
  private_notes: Schema.optional(Schema.String),
  public_notes: Schema.optional(Schema.String),
  fields: Schema.Array(Schema.String),
  slide_order: Schema.Array(Schema.String),
  slides: Schema.Record({
    key: Schema.String,
    value: Schema.Struct({
      slide_name: Schema.String,
      field_data: Schema.Record({
        key: Schema.String,
        value: Schema.String,
      }),
    }),
  }),
});

export type SongFormData = Schema.Schema.Type<typeof SongFormSchema>;

export { SongFormSchema as type };
