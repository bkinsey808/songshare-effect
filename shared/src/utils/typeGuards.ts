export const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null;
};

export const isString = (value: unknown): value is string => {
	return typeof value === "string";
};

export const isStringArray = (value: unknown): value is string[] => {
	return Array.isArray(value) && value.every((v) => typeof v === "string");
};
