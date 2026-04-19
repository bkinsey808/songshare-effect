import { type Interface } from "node:readline/promises";

/**
 * Narrow an arbitrary value to the readline `Interface` shape used in tests.
 *
 * The unsafe cast stays localized here so individual tests do not need their
 * own inline disable comments.
 *
 * @param value - Candidate object that should behave like a readline interface.
 * @returns The value cast to `Interface`.
 */
function asInterface(value: unknown): Interface {
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-return -- test-only narrow cast
	return value as Interface;
}

/**
 * Create a fake readline interface that resolves or throws for prompting tests.
 *
 * @param answer - Simulated prompt result or throw mode.
 * @returns A fake readline `Interface` with `question` and `close`.
 */
export default function makeFakeRl(answer: "n" | "yes" | "throw"): Interface {
	if (answer === "throw") {
		return asInterface({
			question: async (): Promise<string> => {
				await Promise.resolve();
				throw new Error("prompt fail");
			},
			close: (): void => undefined,
		});
	}

	return asInterface({
		question: async (): Promise<string> => {
			await Promise.resolve();
			return answer === "yes" ? "yes" : "n";
		},
		close: (): void => undefined,
	});
}
