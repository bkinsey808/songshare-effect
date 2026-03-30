import type { TFunction } from "i18next";
import { vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

/**
 * Returns a minimal TFunction stub for testing getEventSubmitLabel.
 * Uses forceCast to satisfy no-unsafe-type-assertion.
 *
 * @returns A minimal translation function stub.
 */
function makeT(): TFunction {
	return forceCast<TFunction>(vi.fn((_key: string, fallback: string) => fallback));
}

export default makeT;
