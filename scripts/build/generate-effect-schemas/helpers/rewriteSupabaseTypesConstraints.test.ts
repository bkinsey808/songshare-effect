import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import rewriteSupabaseTypesConstraints from "./rewriteSupabaseTypesConstraints";

function createTempFilePath(fileName: string): string {
	const tempDirectory = mkdtempSync(join(tmpdir(), "rewrite-supabase-types-"));
	return join(tempDirectory, fileName);
}

function removeTempDirectoryForFile(filePath: string): void {
	rmSync(dirname(filePath), { force: true, recursive: true });
}

describe("rewriteSupabaseTypesConstraints", () => {
	it("rewrites constrained string columns to literal unions within a matching table block", () => {
		// Arrange
		const filePath = createTempFilePath("supabaseTypes.ts");
		const initialContent = `export type Database = {
  public: {
    Tables: {
      song: {
        Row: {
          song_id: string
          status: string
          title: string
        }
        Insert: {
          song_id?: string
          status?: string
          title?: string
        }
        Update: {
          song_id?: string
          status?: string
          title?: string
        }
      }
    }
  }
};
`;
		const constraintMap = {
			song: {
				status: ["draft", "published", "archived"],
			},
		};

		try {
			writeFileSync(filePath, initialContent, "utf8");

			// Act
			rewriteSupabaseTypesConstraints(filePath, constraintMap);
			const result = readFileSync(filePath, "utf8");

			// Assert
			expect(result).toContain('status: "draft" | "published" | "archived"');
			expect(result).toContain('status?: "draft" | "published" | "archived"');
			expect(result).toContain("title: string");
			expect(result).toContain("title?: string");
		} finally {
			removeTempDirectoryForFile(filePath);
		}
	});

	it("rewrites nullable constrained string columns to literal unions plus null", () => {
		const filePath = createTempFilePath("supabaseTypes.ts");
		const initialContent = `export type Database = {
  public: {
    Tables: {
      song_public: {
        Row: {
          key: string | null
        }
        Insert: {
          key?: string | null
        }
        Update: {
          key?: string | null
        }
      }
    }
  }
};
`;
		const constraintMap = {
			song_public: {
				key: ["C", "C#", "Bb"],
			},
		};

		try {
			writeFileSync(filePath, initialContent, "utf8");

			rewriteSupabaseTypesConstraints(filePath, constraintMap);
			const result = readFileSync(filePath, "utf8");

			expect(result).toContain('key: "C" | "C#" | "Bb" | null');
			expect(result).toContain('key?: "C" | "C#" | "Bb" | null');
		} finally {
			removeTempDirectoryForFile(filePath);
		}
	});

	it("rewrites multiple constrained columns across multiple tables", () => {
		// Arrange
		const filePath = createTempFilePath("supabaseTypes.ts");
		const initialContent = `export type Database = {
  public: {
    Tables: {
      song: {
        Row: {
          status: string
        }
        Insert: {
          status?: string
        }
        Update: {
          status?: string
        }
      }
      community: {
        Row: {
          visibility: string
          format: string
        }
        Insert: {
          visibility?: string
          format?: string
        }
        Update: {
          visibility?: string
          format?: string
        }
      }
    }
  }
};
`;
		const constraintMap = {
			community: {
				format: ["round", "bracket"],
				visibility: ["public", "private"],
			},
			song: {
				status: ["draft", "published"],
			},
		};

		try {
			writeFileSync(filePath, initialContent, "utf8");

			// Act
			rewriteSupabaseTypesConstraints(filePath, constraintMap);
			const result = readFileSync(filePath, "utf8");

			// Assert
			expect(result).toContain('status: "draft" | "published"');
			expect(result).toContain('visibility: "public" | "private"');
			expect(result).toContain('format?: "round" | "bracket"');
		} finally {
			removeTempDirectoryForFile(filePath);
		}
	});

	it("leaves content unchanged when the table or column is not found", () => {
		// Arrange
		const filePath = createTempFilePath("supabaseTypes.ts");
		const initialContent = `export type Database = {
  public: {
    Tables: {
      playlist: {
        Row: {
          visibility: string
        }
        Insert: {
          visibility?: string
        }
        Update: {
          visibility?: string
        }
      }
    }
  }
};
`;
		const constraintMap = {
			song: {
				status: ["draft", "published"],
			},
		};

		try {
			writeFileSync(filePath, initialContent, "utf8");

			// Act
			rewriteSupabaseTypesConstraints(filePath, constraintMap);
			const result = readFileSync(filePath, "utf8");

			// Assert
			expect(result).toBe(initialContent);
		} finally {
			removeTempDirectoryForFile(filePath);
		}
	});
});
