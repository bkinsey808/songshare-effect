import type { ChangeEvent } from "react";

/**
 * Build a minimal change event for an `<select>` element.
 *
 * Tests often need to simulate an onChange on a <select>. Instead of
 * repeating an unsafe assertion in every spec, this helper isolates the
 * lint-disable. Callers simply import and use it, keeping test files clean.
 */
export default function makeSelectChangeEvent(value: string): ChangeEvent<HTMLSelectElement> {
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	return { target: { value } } as unknown as ChangeEvent<HTMLSelectElement>;
}
