export function cssVars(
	vars: Readonly<Record<string, string>>,
): React.CSSProperties {
	const style: Record<string, string> = {};
	for (const [key, value] of Object.entries(vars)) {
		style[`--${key}`] = value;
	}
	return style as React.CSSProperties;
}
