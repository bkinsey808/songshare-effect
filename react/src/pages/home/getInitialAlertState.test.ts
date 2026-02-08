import { describe, expect, it, vi } from "vitest";

import { DELETE_SUCCESS, SIGN_OUT_SUCCESS } from "@/react/pages/home/alert-keys";
import {
	displayedKey,
	justDeletedAccountKey,
	justSignedOutKey,
	typeKey,
} from "@/shared/sessionStorageKeys";

import getInitialAlertState from "./getInitialAlertState";

describe("getInitialAlertState", () => {
	// When the `displayed` sentinel is present with a valid stored `type`, the
	// initial alert should reflect that stored type (prevents re-showing alerts).
	it("returns stored alert when displayed sentinel present with valid type", () => {
		vi.resetAllMocks();
		sessionStorage.clear();
		sessionStorage.setItem(displayedKey, "1");
		sessionStorage.setItem(typeKey, DELETE_SUCCESS);

		const res = getInitialAlertState();

		expect(res).toStrictEqual({ visible: true, type: "deleteSuccess" });
	});

	// If the sentinel exists but the stored `type` is missing or empty, treat it
	// as "no alert" to avoid showing malformed or empty alerts.
	it("returns no alert when displayed sentinel present but type missing or empty", () => {
		vi.resetAllMocks();
		sessionStorage.clear();
		sessionStorage.setItem(displayedKey, "1");
		// No type set -> should treat as no alert

		const res = getInitialAlertState();

		expect(res).toStrictEqual({ visible: false });

		// Also ensure explicit empty string behaves the same
		sessionStorage.setItem(typeKey, "");
		expect(getInitialAlertState()).toStrictEqual({ visible: false });
	});

	// When `justDeletedAccount` transient flag is set, the alert should show
	// `deleteSuccess`. The function should persist the sentinel/type and remove
	// the transient flags so the alert is not re-shown on subsequent renders.
	it("shows deleteSuccess when justDeletedAccount flag is set and persists sentinel and type, cleaning transients", () => {
		vi.resetAllMocks();
		sessionStorage.clear();
		sessionStorage.setItem(justDeletedAccountKey, "1");

		const res = getInitialAlertState();

		expect(res).toStrictEqual({ visible: true, type: "deleteSuccess" });
		expect(sessionStorage.getItem(displayedKey)).toBe("1");
		expect(sessionStorage.getItem(typeKey)).toBe(DELETE_SUCCESS);
		expect(sessionStorage.getItem(justDeletedAccountKey)).toBeNull();
		expect(sessionStorage.getItem(justSignedOutKey)).toBeNull();
	});

	// If multiple transients exist, ordering determines precedence. This test
	// asserts `signOutSuccess` (later check) overrides `deleteSuccess`.
	it("gives signOutSuccess precedence when both transient flags are set", () => {
		vi.resetAllMocks();
		sessionStorage.clear();
		sessionStorage.setItem(justDeletedAccountKey, "1");
		sessionStorage.setItem(justSignedOutKey, "1");

		const res = getInitialAlertState();

		expect(res).toStrictEqual({ visible: true, type: SIGN_OUT_SUCCESS });
		expect(sessionStorage.getItem(displayedKey)).toBe("1");
		expect(sessionStorage.getItem(typeKey)).toBe(SIGN_OUT_SUCCESS);
		expect(sessionStorage.getItem(justDeletedAccountKey)).toBeNull();
		expect(sessionStorage.getItem(justSignedOutKey)).toBeNull();
	});

	it("swallows storage errors and returns no alert", () => {
		vi.resetAllMocks();
		const original = globalThis.sessionStorage;
		// Simulate an environment (e.g., strict privacy mode) where `sessionStorage`
		// is unavailable or throws. We make `getItem` throw to ensure the function
		// swallows the error, logs it, and still returns no alert.
		const map = new Map<string, string>();
		const fakeStorage = {
			getItem: () => {
				throw new Error("storage unavailable");
			},
			setItem: (keyName: string, value: string): void => {
				map.set(String(keyName), String(value));
			},
			removeItem: (keyName: string): void => {
				map.delete(String(keyName));
			},
			clear: (): void => {
				map.clear();
			},
			key: (_idx: number): string | undefined => undefined,
			length: 0,
		};

		// Define the property on the global instead of casting to `any` / asserting a narrower type
		Object.defineProperty(globalThis, "sessionStorage", {
			value: fakeStorage,
			configurable: true,
		});

		type LogEntry = { msg: string; err: unknown };
		const logged: LogEntry[] = [];
		const errorSpy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
			const [msg, err] = args;
			logged.push({ msg: String(msg), err });
		});

		const res = getInitialAlertState();

		expect(res).toStrictEqual({ visible: false });

		const MIN_EXPECTED_LOG_ENTRIES = 1;
		expect(logged.length).toBeGreaterThanOrEqual(MIN_EXPECTED_LOG_ENTRIES);

		const [first] = logged;
		expect(first).toBeDefined();
		const msg = first?.msg;
		const err = first?.err;
		expect(String(msg)).toContain("getInitialAlertState");
		expect(err).toBeInstanceOf(Error);

		// Restore
		errorSpy.mockRestore();
		Object.defineProperty(globalThis, "sessionStorage", {
			value: original,
			configurable: true,
		});
	});
});
