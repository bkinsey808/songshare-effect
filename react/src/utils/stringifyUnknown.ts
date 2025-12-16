export default function stringifyUnknown(value?: unknown): string {
  if (value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Error) {
    return value.message;
  }
  try {
    return JSON.stringify(value as unknown);
  } catch {
    // Avoid base-to-string default representation for objects; return a safe fallback
    return "[unserializable]";
  }
}
