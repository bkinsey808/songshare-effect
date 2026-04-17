import translationLanguagesData from "./translation-languages.json";

/** A single entry from the canonical translation language list. */
type LanguageEntry = Readonly<{
	tag: string;
	name: string;
	nativeName: string;
	keywords: readonly string[];
}>;

type RankedLanguageEntry = Readonly<{
	entry: LanguageEntry;
	rank: number;
}>;

/** Full list of supported translation languages, sourced from `translation-languages.json`. */
const translationLanguages: readonly LanguageEntry[] = translationLanguagesData as LanguageEntry[];

const NO_MATCH = 0;
const NATIVE_OR_KEYWORD_MATCH = 1;
const NAME_CONTAINS_MATCH = 2;
const KEYWORD_PREFIX_MATCH = 3;
const NAME_PREFIX_MATCH = 4;
const EXACT_TAG_MATCH = 5;
const FIRST_RESULT_INDEX = 0;
const MAX_RESULTS = 8;

/**
 * Score a language entry against a lower-cased search query.
 * Higher scores sort first.
 *
 * @param entry - Language entry to score
 * @param query - Lower-cased trimmed search string
 * @returns Numeric rank; 0 means no match
 */
function getRank(entry: LanguageEntry, query: string): number {
	const name = entry.name.toLowerCase();
	const native = entry.nativeName.toLowerCase();
	if (entry.tag === query) {
		return EXACT_TAG_MATCH;
	}
	if (name.startsWith(query)) {
		return NAME_PREFIX_MATCH;
	}
	if (entry.keywords.some((keyword) => keyword.startsWith(query))) {
		return KEYWORD_PREFIX_MATCH;
	}
	if (name.includes(query)) {
		return NAME_CONTAINS_MATCH;
	}
	if (native.includes(query) || entry.keywords.some((keyword) => keyword.includes(query))) {
		return NATIVE_OR_KEYWORD_MATCH;
	}
	return NO_MATCH;
}

/**
 * Sort ranked language entries by descending rank without mutating the input array.
 *
 * @param rankedEntries - Ranked entries to order
 * @returns New ranked array sorted from best to worst match
 */
function sortRankedEntries(
	rankedEntries: readonly RankedLanguageEntry[],
): readonly RankedLanguageEntry[] {
	const sortedEntries: RankedLanguageEntry[] = [];
	for (const rankedEntry of rankedEntries) {
		const insertAt = sortedEntries.findIndex(
			(existingEntry) => rankedEntry.rank > existingEntry.rank,
		);
		if (insertAt === NO_MATCH) {
			sortedEntries.push(rankedEntry);
		} else {
			sortedEntries.splice(insertAt, NO_MATCH, rankedEntry);
		}
	}
	return sortedEntries;
}

/**
 * Search the translation language list by name, native name, BCP 47 tag, or keyword.
 * Returns at most 8 results ranked by relevance.
 *
 * @param query - Raw search string (case-insensitive)
 * @param excludedCodes - BCP 47 codes to omit from results
 * @returns Ranked, filtered list of matching language entries
 */
function searchLanguages(
	query: string,
	excludedCodes: readonly string[] = [],
): readonly LanguageEntry[] {
	const normalizedQuery = query.toLowerCase().trim();
	if (normalizedQuery === "") {
		return [];
	}

	const rankedEntries = translationLanguages
		.filter((entry) => !excludedCodes.includes(entry.tag))
		.map((entry) => ({ entry, rank: getRank(entry, normalizedQuery) }))
		.filter(({ rank }) => rank > NO_MATCH);
	const sortedEntries = sortRankedEntries(rankedEntries);

	return sortedEntries.slice(FIRST_RESULT_INDEX, MAX_RESULTS).map(({ entry }) => entry);
}

/**
 * Look up a language entry by its BCP 47 tag.
 *
 * @param tag - BCP 47 language code (e.g. "sa-Latn")
 * @returns Matching entry, or undefined if not found
 */
function findLanguageByTag(tag: string): LanguageEntry | undefined {
	return translationLanguages.find((entry) => entry.tag === tag);
}

export { findLanguageByTag, searchLanguages, translationLanguages };
export type { LanguageEntry };
