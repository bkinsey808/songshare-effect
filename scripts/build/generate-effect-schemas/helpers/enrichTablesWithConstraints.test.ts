import { describe, expect, it } from "vitest";

import type { TableDefinition } from "./generate-effect-schemas-types";
import enrichTablesWithConstraints from "./enrichTablesWithConstraints";

const MATCHED_ALLOWED_VALUES = ["draft", "published"] as const;

describe("enrichTablesWithConstraints", () => {
	it("adds allowedValues to columns with matching table and column constraints", () => {
		// Arrange
		const tables: TableDefinition[] = [
			{
				name: "songs",
				columns: [
					{ name: "status", nullable: false, type: "string" },
					{ name: "title", nullable: false, type: "string" },
				],
			},
		];
		const constraintMap = {
			songs: {
				status: MATCHED_ALLOWED_VALUES,
			},
		};

		// Act
		enrichTablesWithConstraints(tables, constraintMap);

		// Assert
		expect(tables).toStrictEqual([
			{
				name: "songs",
				columns: [
					{
						name: "status",
						nullable: false,
						type: "string",
						allowedValues: MATCHED_ALLOWED_VALUES,
					},
					{ name: "title", nullable: false, type: "string" },
				],
			},
		]);
	});

	it("ignores constraints for missing tables, missing columns, and empty value lists", () => {
		// Arrange
		const tables: TableDefinition[] = [
			{
				name: "songs",
				columns: [
					{ name: "status", nullable: false, type: "string" },
					{ name: "title", nullable: false, type: "string" },
				],
			},
			{
				name: "playlists",
				columns: [{ name: "visibility", nullable: false, type: "string" }],
			},
		];
		const constraintMap = {
			songs: {
				missing_column: ["draft"],
				status: [],
			},
			missing_table: {
				visibility: ["public", "private"],
			},
		};

		// Act
		enrichTablesWithConstraints(tables, constraintMap);

		// Assert
		expect(tables).toStrictEqual([
			{
				name: "songs",
				columns: [
					{ name: "status", nullable: false, type: "string" },
					{ name: "title", nullable: false, type: "string" },
				],
			},
			{
				name: "playlists",
				columns: [{ name: "visibility", nullable: false, type: "string" }],
			},
		]);
	});
});
