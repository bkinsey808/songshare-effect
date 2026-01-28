import { type Interface } from "node:readline/promises";

/**
 * Test helper to create a fake readline.Interface for prompting tests.
 *
 * This helper centralizes the narrow, documented type assertions so individual
 * tests do not need to repeat eslint-disable comments. The unsafe assertions are
 * intentionally localized here because the runtime shape is simple and tests
 * only need the `question` and `close` methods.
 */
// Helper: narrow an arbitrary object to the `Interface` test shape. Keep the
// unsafe cast localized here and documented so individual tests don't need
// their own eslint-disable comments.
function asInterface(value: unknown): Interface {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-return -- test-only narrow cast
	return value as Interface;
}

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
