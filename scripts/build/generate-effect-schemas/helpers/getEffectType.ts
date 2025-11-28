import { safeGet } from "@/shared/utils/safe";

import { type ColumnDefinition } from "./generate-effect-schemas-types";

const typeMapping: Record<string, string> = {
	string: "Schema.String",
	text: "Schema.String",
	varchar: "Schema.String",
	char: "Schema.String",
	uuid: "Schema.UUID",
	number: "Schema.Number",
	integer: "Schema.Number",
	bigint: "Schema.BigInt",
	smallint: "Schema.Number",
	decimal: "Schema.Number",
	numeric: "Schema.Number",
	real: "Schema.Number",
	"double precision": "Schema.Number",
	boolean: "Schema.Boolean",
	Date: "Schema.DateFromSelf",
	timestamp: "Schema.DateFromSelf",
	timestamptz: "Schema.DateFromSelf",
	date: "Schema.DateFromSelf",
	time: "Schema.String",
	json: "Schema.Unknown",
	jsonb: "Schema.Unknown",
	Json: "Schema.Unknown",
	bytea: "Schema.Uint8Array",
};

export function getEffectType(column: Readonly<ColumnDefinition>): string {
	let effectType = typeMapping[column.type];
	if (effectType === undefined) {
		if (column.type.endsWith("[]")) {
			const elemType = column.type.replace(/\[\]$/, "");
			const mappedElem = safeGet(typeMapping, elemType) ?? "Schema.String";
			effectType = `Schema.Array(${mappedElem})`;
		} else {
			effectType = "Schema.String";
		}
	}

	if (column.name === "tags" && column.type === "Json") {
		effectType = "Schema.Array(Schema.String)";
	}

	if (column.name === "email") {
		effectType = "EmailSchema";
	} else if (column.name.includes("url")) {
		effectType = "Schema.NonEmptyString";
	} else if (column.name === "duration" || column.name === "position") {
		effectType = "Schema.Positive";
	} else if (column.name === "play_count") {
		effectType = "Schema.NonNegative";
	} else if (!column.nullable && effectType === "Schema.String") {
		effectType = "Schema.NonEmptyString";
	}

	return effectType;
}
