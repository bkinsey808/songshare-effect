import { act } from "react";

const DEFAULT_TICKS = 5;

/**
 * Waits for pending promises and state updates to settle by cycling the event loop.
 *
 * Use this when you need to wait for effects or async operations to complete in tests.
 * This helper isolates the `no-await-in-loop` disable comment away from test files.
 */
export default async function waitForAsync(ticks = DEFAULT_TICKS): Promise<void> {
	/* eslint-disable no-await-in-loop */
	for (let i = 0; i < ticks; i++) {
		await act(async () => {
			await Promise.resolve();
		});
	}
	/* eslint-enable no-await-in-loop */
}
