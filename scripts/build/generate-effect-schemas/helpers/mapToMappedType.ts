/**
 * Map a cleaned Supabase field type and field name to the simplified mapped type
 * used by the schema generator.
 */
export default function mapToMappedType(cleanType: string, fieldNameLocal: string): string {
  if (cleanType.endsWith("[]")) {
    return cleanType;
  }
  if (cleanType.includes("number")) {
    return "number";
  }
  if (cleanType.includes("boolean")) {
    return "boolean";
  }
  if (cleanType.includes("Date")) {
    return "Date";
  }
  if (cleanType.includes("Json")) {
    return "Json";
  }
  if (fieldNameLocal.includes("id") && cleanType === "string") {
    return "uuid";
  }
  return "string";
}
