import { vi } from "vitest";

// helper module for defaultCompare tests
// we keep the namespace import here because the tests need to spy on the
// default export. This file is _not_ a test, so we're permitted to disable
// import/no-namespace if necessary.
// oxlint-disable-next-line import/no-namespace
import * as stringFieldModule from "@/shared/utils/getStringField";

import defaultCompare from "./defaultCompare";

// create a spy on the actual helper used by defaultCompare
export const getStringFieldSpy = vi.spyOn(stringFieldModule, "default");

// helper for tests that need a `null` value. placing it in a non-test
// file lets us safely disable rules here instead of inside every test.
export function makeNull(): null {
	// oxlint-disable-next-line unicorn/no-null
	return null;
}

// re-export the comparison function so tests never import it directly
export { defaultCompare };
