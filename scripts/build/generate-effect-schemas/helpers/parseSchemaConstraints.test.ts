import { describe, expect, it } from "vitest";

import parseSchemaConstraints from "./parseSchemaConstraints";

describe("parseSchemaConstraints", () => {
	it("extracts enum-like check constraints for multiple tables", () => {
		// Arrange
		const schemaSql = `
CREATE TABLE public.community (
    community_id uuid NOT NULL,
    visibility text NOT NULL,
    CONSTRAINT community_visibility_check CHECK ((visibility = ANY (ARRAY['public'::text, 'private'::text])))
);

CREATE TABLE public.song (
    song_id uuid NOT NULL,
    status text NOT NULL,
    CONSTRAINT song_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);
`;

		// Act
		const result = parseSchemaConstraints(schemaSql);

		// Assert
		expect(result).toStrictEqual({
			community: {
				visibility: ["public", "private"],
			},
			song: {
				status: ["draft", "published", "archived"],
			},
		});
	});

	it("supports quoted table names", () => {
		// Arrange
		const schemaSql = `
CREATE TABLE public."user" (
    user_id uuid NOT NULL,
    role text NOT NULL,
    CONSTRAINT user_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text])))
);
`;

		// Act
		const result = parseSchemaConstraints(schemaSql);

		// Assert
		expect(result).toStrictEqual({
			user: {
				role: ["admin", "member"],
			},
		});
	});

	it("extracts nullable enum-like checks that allow null or ANY array values", () => {
		const schemaSql = `
CREATE TABLE public.song_public (
    song_id uuid NOT NULL,
    key text,
    CONSTRAINT song_public_key_allowed_values CHECK (((key IS NULL) OR (key = ANY (ARRAY['C'::text, 'C#'::text, 'Bb'::text]))))
);
`;

		const result = parseSchemaConstraints(schemaSql);

		expect(result).toStrictEqual({
			song_public: {
				key: ["C", "C#", "Bb"],
			},
		});
	});

	it("ignores tables without matching array check constraints", () => {
		// Arrange
		const schemaSql = `
CREATE TABLE public.audit_log (
    audit_log_id uuid NOT NULL,
    actor text NOT NULL
);

CREATE TABLE public.playlist (
    playlist_id uuid NOT NULL,
    visibility text NOT NULL,
    CONSTRAINT playlist_visibility_check CHECK ((visibility <> 'deleted'::text))
);
`;

		// Act
		const result = parseSchemaConstraints(schemaSql);

		// Assert
		expect(result).toStrictEqual({});
	});

	it("ignores matching constraints when no string literals are present", () => {
		// Arrange
		const schemaSql = `
CREATE TABLE public.vote (
    vote_id uuid NOT NULL,
    weight integer NOT NULL,
    CONSTRAINT vote_weight_check CHECK ((weight = ANY (ARRAY[])))
);
`;

		// Act
		const result = parseSchemaConstraints(schemaSql);

		// Assert
		expect(result).toStrictEqual({});
	});
});
