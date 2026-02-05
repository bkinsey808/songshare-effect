/**
 * Convert a simple object to CSS custom properties (prefix keys with `--`).
 *
 * @param vars - Map of simple property names to CSS values
 * @returns An object suitable for `style` with CSS custom properties
 */
export default function cssVars(vars: Readonly<Record<string, string>>): React.CSSProperties {
	const style: Record<string, string> = {};
	for (const [key, value] of Object.entries(vars)) {
		style[`--${key}`] = value;
	}
	return style as React.CSSProperties;
}
