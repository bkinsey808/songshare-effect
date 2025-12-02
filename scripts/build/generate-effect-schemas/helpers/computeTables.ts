import { warn as sWarn } from "@/scripts/utils/scriptLogger";
import type { ColumnDefinition, TableDefinition } from "./generate-effect-schemas-types";
import mapToMappedType from "./mapToMappedType";

/**
 * Compute table definitions from Supabase-generated types file contents.
 */
export default function computeTables(file: string): TableDefinition[] {
  const tableRegex = /(\w+):\s*{\s*Row:\s*{([^}]+)}\s*Insert:\s*{([^}]+)}/gs;

  const tables: TableDefinition[] = [];
  const NO_COLUMNS = 0;

  

  for (const match of file.matchAll(tableRegex)) {
    // match[0] is the full match, groups start at index 1
    const [, tableName, rowContent, insertContent] = match as RegExpMatchArray;

    if (
      typeof tableName === "string" &&
      tableName !== "" &&
      tableName !== "Tables" &&
      typeof rowContent === "string" &&
      rowContent !== "" &&
      typeof insertContent === "string" &&
      insertContent !== ""
    ) {
      sWarn(`📋 Processing table: ${tableName}`);

      // required insert fields
      const insertRequiredFields = new Set<string>();
      for (const im of insertContent.matchAll(/(\w+)(\?)?:\s*([^;\n]+)/g)) {
        const [, rawName, optional] = im as RegExpMatchArray;
        const field = rawName?.trim();
        const isOptional = optional === "?";
        if (typeof field === "string" && field !== "" && !isOptional) {
          insertRequiredFields.add(field);
        }
      }

      const columns: ColumnDefinition[] = [];
      for (const fm of rowContent.matchAll(/(\w+):\s*([^;\n]+)/g)) {
        const [, rawFieldName, rawFieldType] = fm as RegExpMatchArray;
        const fieldName = rawFieldName?.trim();
        const fieldType = rawFieldType?.trim();

        if (
          typeof fieldName !== "string" ||
          fieldName === "" ||
          typeof fieldType !== "string" ||
          fieldType === ""
        ) {
          // skip invalid rows
        } else {
          const isNullable = fieldType.includes("| null");
          const cleanType = fieldType.replace(/\s*\|\s*null\s*$/, "").trim();
          const mappedType = mapToMappedType(cleanType, fieldName);

          columns.push({
            name: fieldName,
            type: mappedType,
            nullable: isNullable,
            isPrimaryKey: fieldName === "id",
            isForeignKey: fieldName.endsWith("_id") && fieldName !== "id",
            isRequiredForInsert: insertRequiredFields.has(fieldName),
          });
        }
      }

      if (columns.length > NO_COLUMNS) {
        tables.push({ name: tableName, columns });
      }
    }
  }

  return tables;
}
