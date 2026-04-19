/** Language code to display name resolver using Intl.DisplayNames. */
const langDisplayNames: Intl.DisplayNames | undefined = (() => {
	try {
		return new Intl.DisplayNames(["en"], { type: "language" });
	} catch {
		return undefined;
	}
})();

/**
 * Return a human-readable label for a slide field key.
 *
 * @param field - Field key ("lyrics", "script", or a BCP 47 language code)
 * @returns Display label for the field
 */
export default function getFieldLabel(field: string): string {
	if (field === "lyrics") {
		return "Lyrics";
	}
	if (field === "script") {
		return "Script";
	}
	try {
		return langDisplayNames?.of(field) ?? field;
	} catch {
		return field;
	}
}
