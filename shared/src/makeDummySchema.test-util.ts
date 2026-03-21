import { Schema } from "effect";

/**
 * Create a dummy schema that represents a record with key 'id' and value '123'.
 *
 * @param i18nMessageKey - The i18n message key to associate with the schema
 * @returns A dummy schema for testing
 */
export default function makeDummySchema(i18nMessageKey: string): Schema.Schema<{ readonly id: string }> {
	return Schema.Struct({
		id: Schema.String,
	}).pipe(
		Schema.annotations({
			[i18nMessageKey]: { message: "dummy" },
		}),
	);
}
