/**
 * Escape a value for safe inclusion inside a Postgres single-quoted literal.
 *
 * Behavior:
 *  - Backslashes are escaped first ("\\" -> "\\\\").
 *  - Single quotes are doubled ("'" -> "''") which is the Postgres quoted-literal escape.
 *
 * Escaping backslashes first prevents inputs like "\\'" from bypassing sanitization
 * (if quotes were escaped first, a backslash could then escape the quote).
 *
 * The function accepts any input (uses String(value)) and returns a string that
 * is safe to embed inside a Postgres single-quoted literal (note: the caller
 * is still responsible for wrapping the result in single quotes when needed).
 *
 * @param value - Any value (will be coerced to string) that should be
 *   made safe to include inside a Postgres single-quoted literal.
 * @returns The escaped string where backslashes are doubled and
 *   single-quotes are replaced by two single-quotes (Postgres literal escaping).
 *
 * @example
 * escapeForPostgresLiteral("O'Reilly") // -> "O''Reilly"
 */
export default function escapeForPostgresLiteral(value: unknown): string {
	return String(value).replace(/\\/g, "\\\\").replace(/'/g, "''");
}
