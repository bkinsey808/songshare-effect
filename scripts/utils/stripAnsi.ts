export const ANSI_REGEX = new RegExp(String.raw`\u001B\[[0-9;]*m`, "g");

export function stripAnsi(input: string): string {
	return input.replaceAll(ANSI_REGEX, "");
}
