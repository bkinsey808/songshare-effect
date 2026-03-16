// ESLint rule that disallows asserting the return value of a mocked function
// directly inside expect().  Patterns like expect(vi.mocked(fn)(...)) or
// expect(mockFn()) where mockFn = vi.fn() assert the mock's own return value,
// not the behavior of the system under test.
//
// Allowed:
//   expect(vi.mocked(fn)).toHaveBeenCalled()    — interaction assertion
//   expect(vi.mocked(fn)).toHaveReturnedWith(x) — interaction assertion
//   expect(result).toBe(x)                      — SUT output assertion
//
// Disallowed:
//   expect(vi.mocked(fn)())                     — calling the mock inside expect
//   expect(vi.fn()())                           — calling a vi.fn() result inside expect
//   expect(vi.spyOn(obj, 'method')())           — calling a spy inside expect
//   const m = vi.fn(); expect(m())              — local mock var called inside expect
//   const m = vi.mocked(x); expect(m())         — typed mock var called inside expect
//   const s = vi.spyOn(obj, m); expect(s())     — spy var called inside expect
//   let m = vi.fn(); m = vi.fn(); expect(m())   — reassigned mock var called inside expect
//   expect(await mockFn())                      — awaiting a mock call inside expect
//   expect(vi.fn().mockReturnValue(x)())        — chained mock config called inside expect
//   expect(mockFn.mockImplementation(fn)())     — chained config on local var
//   expect(mockFn.mock.calls[0][0])             — reading .mock.calls directly instead of toHaveBeenCalledWith
//   expect(mockFn.mock.results[0].value)        — reading .mock.results directly instead of toHaveReturnedWith
//   expect(mockFn.mock.lastCall)                — reading .mock.lastCall instead of toHaveBeenLastCalledWith
//   expect(mockFn.mock.calls.length)            — reading .mock.calls.length instead of toHaveBeenCalledTimes
//   const calls = mockFn.mock.calls; expect(calls.length)       — stored mock internal accessed indirectly
//   const { calls } = mockFn.mock; expect(calls[0][0])          — destructured mock internal
//   const [first] = mockFn.mock.calls; expect(first)            — array-destructured mock internal
//   expect(mockedModule.getData.mock.calls[0])                  — property of mocked object .mock access
//   const m = vi.hoisted(() => vi.fn()); expect(m.mock.calls[0])  — vi.hoisted factory mock not tracked
//   const u = mock.calls[0][0] as URL; expect(u.pathname)         — TS assertion wrapping lost variable tracking
//   expect(typeof mockFn.mock.calls[0][0])                        — typeof wrapping bypasses mock-internal check
import type { TSESTree } from "@typescript-eslint/utils";
import type { RuleModule } from "@typescript-eslint/utils/ts-eslint";

type MessageIds =
	| "viMockedCall"
	| "viFnCall"
	| "viSpyOnCall"
	| "localMockCall"
	| "mockCallsLengthAccess"
	| "mockCallsAccess"
	| "mockResultsAccess"
	| "mockLastCallAccess"
	| "mockInternalStateAccess"
	| "mockDerivedVarAccess";

/**
 * Vitest mock configuration methods that return the mock itself (fluent API).
 * A call chain through any of these still ultimately invokes a mock.
 */
const MOCK_CONFIG_METHODS = new Set([
	"mockReturnValue",
	"mockReturnValueOnce",
	"mockResolvedValue",
	"mockResolvedValueOnce",
	"mockRejectedValue",
	"mockRejectedValueOnce",
	"mockImplementation",
	"mockImplementationOnce",
	"mockReturnThis",
	"mockReset",
	"mockRestore",
	"mockClear",
]);

/**
 * Strips TypeScript type assertion wrappers (`as Type`, `satisfies Type`) from a
 * node, returning the inner expression. Used so that patterns like
 * `mock.mock.calls[0][0] as SomeType` are still recognized as mock internal accesses.
 */
const stripTsAssertions = (node: TSESTree.Node): TSESTree.Node => {
	let current = node;
	while (current.type === "TSAsExpression" || current.type === "TSSatisfiesExpression") {
		current = current.expression;
	}
	return current;
};

/** Check whether node is a call like vi.<method>(...) */
const isViCall = (node: TSESTree.Node | null | undefined, methodName: string): boolean => {
	return (
		node != null &&
		node.type === "CallExpression" &&
		node.callee.type === "MemberExpression" &&
		node.callee.object.type === "Identifier" &&
		node.callee.object.name === "vi" &&
		node.callee.property.type === "Identifier" &&
		node.callee.property.name === methodName
	);
};

type RootKind = "vi.fn" | "vi.mocked" | "vi.spyOn" | "localMock";

/**
 * Walks the callee of a CallExpression to find whether the ultimately-invoked
 * function is a Vitest mock. Handles direct vi calls (vi.fn(), vi.mocked(),
 * vi.spyOn()), local mock variables, and chains through mock config methods
 * like vi.fn().mockReturnValue(x) or mockVar.mockImplementation(fn).
 *
 * Returns the kind of mock root found, or null if not a mock.
 */
const getMockRootKind = (callee: TSESTree.Node, viMockVars: Set<string>): RootKind | null => {
	// Direct vi calls
	if (isViCall(callee, "fn")) {
		return "vi.fn";
	}
	if (isViCall(callee, "mocked")) {
		return "vi.mocked";
	}
	if (isViCall(callee, "spyOn")) {
		return "vi.spyOn";
	}

	// Local mock variable used directly as callee
	if (callee.type === "Identifier" && viMockVars.has(callee.name)) {
		return "localMock";
	}

	// Chained mock config method: <expr>.mockReturnValue(...) etc.
	// The callee itself is a CallExpression whose own callee is a MemberExpression
	// using a known config method. Recurse on the object to reach the root.
	if (
		callee.type === "CallExpression" &&
		callee.callee.type === "MemberExpression" &&
		callee.callee.property.type === "Identifier" &&
		MOCK_CONFIG_METHODS.has(callee.callee.property.name)
	) {
		return getMockRootKind(callee.callee.object, viMockVars);
	}

	return null;
};

/**
 * Returns true if a node (an expression value, not a callee) is a Vitest mock
 * object — i.e., the result of vi.fn(), vi.mocked(), vi.spyOn(), or any chain
 * of mock config methods applied to one of those (e.g. vi.fn().mockReturnValue(x)).
 * Used when tracking variable initializers so that chained declarations like
 *   const m = vi.fn().mockResolvedValue('x')
 * are correctly added to the set of known mock variables.
 */
const isViMockExpression = (
	node: TSESTree.Node | null | undefined,
	viMockVars: Set<string>,
): boolean => {
	if (node == null || node.type !== "CallExpression") {
		return false;
	}

	// Direct vi.fn() / vi.mocked() / vi.mock() / vi.spyOn()
	if (
		isViCall(node, "fn") ||
		isViCall(node, "mocked") ||
		isViCall(node, "mock") ||
		isViCall(node, "spyOn")
	) {
		return true;
	}

	// vi.hoisted(() => vi.fn()) — the hoisted factory evaluates at collection time;
	// if its arrow-function body is itself a mock expression, the result is a mock.
	if (isViCall(node, "hoisted")) {
		const factory = node.arguments[0];
		if (
			factory != null &&
			factory.type === "ArrowFunctionExpression" &&
			factory.body.type !== "BlockStatement"
		) {
			return isViMockExpression(factory.body, viMockVars);
		}
	}

	// Chained mock config: expr.mockReturnValue(x) etc. — still a mock object
	if (
		node.callee.type === "MemberExpression" &&
		node.callee.property.type === "Identifier" &&
		MOCK_CONFIG_METHODS.has(node.callee.property.name)
	) {
		return isViMockExpression(node.callee.object, viMockVars);
	}

	return false;
};

/**
 * Returns true if `node` is an expression that originates from a Vitest mock —
 * a tracked local mock variable, an inline vi.fn()/vi.mocked()/vi.spyOn() call,
 * or a property access chained off any of those (e.g. mockedModule.getData).
 * Used to fix gap 3: `expect(mockedModule.getData.mock.calls[0])`.
 */
const isMockObject = (node: TSESTree.Node, viMockVars: Set<string>): boolean => {
	// Unwrap TS type assertions: (mockFn as SomeFn).mock.calls
	const unwrapped = stripTsAssertions(node);
	if (unwrapped !== node) {
		return isMockObject(unwrapped, viMockVars);
	}
	if (node.type === "Identifier") {
		return viMockVars.has(node.name);
	}
	if (isViCall(node, "fn") || isViCall(node, "mocked") || isViCall(node, "spyOn")) {
		return true;
	}
	// Recurse: mockedModule.getData is a property of a mock object
	if (node.type === "MemberExpression") {
		return isMockObject(node.object, viMockVars);
	}
	return false;
};

/**
 * The specific `.mock.*` sub-property being accessed, used to pick the most
 * helpful error message.
 */
type MockInternalProperty =
	| "calls.length"
	| "calls"
	| "results"
	| "lastCall"
	| "instances"
	| "other";

/**
 * Returns the specific .mock.* property being accessed (walked from the outside
 * of the expression in), or null if the node is not a mock internal access.
 *
 * Walks the member-expression chain from outermost to innermost, collecting
 * named (non-computed) property names. Once the `.mock` sentinel is found and
 * the object is confirmed to be a Vitest mock, the innermost named property
 * (the one directly after `.mock`) determines the returned kind:
 *
 *   mockFn.mock.calls.length  → 'calls.length'
 *   mockFn.mock.calls[0][0]   → 'calls'
 *   mockFn.mock.results[0].v  → 'results'
 *   mockFn.mock.lastCall       → 'lastCall'
 *   mockFn.mock.instances      → 'instances'
 *   mockFn.mock                → 'other'
 */
const getMockInternalProperty = (
	node: TSESTree.Node,
	viMockVars: Set<string>,
): MockInternalProperty | null => {
	let current: TSESTree.Node = stripTsAssertions(node);
	// Named (non-computed) property names seen so far, outermost first.
	const namedProps: string[] = [];
	while (current.type === "MemberExpression") {
		if (current.property.type === "Identifier" && current.property.name === "mock") {
			if (!isMockObject(current.object, viMockVars)) {
				return null;
			}
			// The innermost named prop is the one directly after `.mock`.
			const directProp = namedProps.at(-1);
			const outerProp = namedProps.at(-2);
			if (directProp === "calls") {
				return outerProp === "length" ? "calls.length" : "calls";
			}
			if (directProp === "results") {
				return "results";
			}
			if (directProp === "lastCall") {
				return "lastCall";
			}
			if (directProp === "instances") {
				return "instances";
			}
			return "other";
		}
		// Only collect named (non-computed) property names. Reset when we cross
		// a computed boundary (e.g. [0], [1]) — names seen before the index
		// are on array elements, not on the .mock.* chain directly.
		if (current.computed) {
			namedProps.length = 0;
		} else if (current.property.type === "Identifier") {
			namedProps.push(current.property.name);
		}
		current = current.object;
	}
	return null;
};

/**
 * Returns true if `node` is a member-expression chain that drills into a mock's
 * internal `.mock` property — e.g. mockFn.mock.calls[0][0],
 * mockFn.mock.results[0].value, mockFn.mock.lastCall, mockFn.mock.calls.length,
 * or mockedModule.getData.mock.calls[0] (property of a mocked object).
 *
 * The correct approach is to use Vitest's dedicated matchers:
 * toHaveBeenCalledWith, toHaveBeenCalledTimes, toHaveReturnedWith,
 * toHaveBeenLastCalledWith, etc.
 */
const isMockInternalAccess = (node: TSESTree.Node, viMockVars: Set<string>): boolean => {
	return getMockInternalProperty(node, viMockVars) !== null;
};

/**
 * Returns true if `node` is (or recursively descends via member/subscript
 * accesses from) a variable in `mockInternalVars` — i.e. a variable that was
 * assigned or destructured from a mock's `.mock.*` property.
 *
 * Catches gaps 1 & 2:
 *   const calls = mockFn.mock.calls;  expect(calls[0][0])
 *   const { results } = mockFn.mock;  expect(results[0].value)
 *   const [firstCall] = mockFn.mock.calls;  expect(firstCall)
 */
const isMockInternalVarAccess = (node: TSESTree.Node, mockInternalVars: Set<string>): boolean => {
	// Unwrap TS type assertions: (storedCalls as Something)[0]
	if (node.type === "TSAsExpression" || node.type === "TSSatisfiesExpression") {
		return isMockInternalVarAccess(node.expression, mockInternalVars);
	}
	if (node.type === "Identifier") {
		return mockInternalVars.has(node.name);
	}
	if (node.type === "MemberExpression") {
		return isMockInternalVarAccess(node.object, mockInternalVars);
	}
	return false;
};

const rule: RuleModule<MessageIds> = {
	defaultOptions: [],
	meta: {
		type: "problem",
		docs: {
			description:
				"disallow asserting the return value of a mocked function directly inside expect()",
		},
		schema: [],
		messages: {
			viMockedCall:
				"Avoid calling a mocked function inside expect(). This asserts the mock's own return value, not the SUT's behavior. Assert the SUT's output or use .toHaveBeenCalledWith() / .toHaveReturnedWith() instead.",
			viFnCall:
				"Avoid calling vi.fn() directly inside expect(). This asserts the mock's own return value, not the SUT's behavior.",
			viSpyOnCall:
				"Avoid calling vi.spyOn() directly inside expect(). This asserts the spy's own return value, not the SUT's behavior. Assert the SUT's output or use .toHaveBeenCalledWith() / .toHaveReturnedWith() instead.",
			localMockCall:
				"Avoid calling a vi.fn()/vi.mocked()/vi.spyOn() variable directly inside expect(). This asserts the mock's own return value, not the SUT's behavior. Assert the SUT's output or use .toHaveBeenCalledWith() / .toHaveReturnedWith() instead.",
			mockCallsLengthAccess:
				"Avoid reading .mock.calls.length inside expect(). Use expect(mock).toHaveBeenCalledTimes(n) to assert an exact call count, or expect(mock).toHaveBeenCalled() / expect(mock).not.toHaveBeenCalled() to check whether it was called at all.",
			mockCallsAccess:
				"Avoid reading .mock.calls inside expect(). Use expect(mock).toHaveBeenCalledWith(...args) to assert call arguments, expect(mock).toHaveBeenNthCalledWith(n, ...args) for a specific call, or expect(mock).toHaveBeenLastCalledWith(...args) for the most recent call. For complex argument shapes use expect.objectContaining().",
			mockResultsAccess:
				"Avoid reading .mock.results inside expect(). Use expect(mock).toHaveReturnedWith(value) to assert a return value, or expect(mock).toHaveNthReturnedWith(n, value) to assert the return value of a specific call.",
			mockLastCallAccess:
				"Avoid reading .mock.lastCall inside expect(). Use expect(mock).toHaveBeenLastCalledWith(...args) instead.",
			mockInternalStateAccess:
				"Avoid reading mock internals (.mock.calls, .mock.results, .mock.lastCall, etc.) inside expect(). Use Vitest matchers: toHaveBeenCalledWith(), toHaveBeenCalledTimes(), toHaveReturnedWith(), toHaveBeenLastCalledWith().",
			mockDerivedVarAccess:
				"Avoid asserting a value that was extracted from a mock call by position (e.g. mock.calls[0][0]). Instead, use expect(mock).toHaveBeenCalledWith(expect.objectContaining({ property: value })) to assert the argument shape directly without indexing into call records.",
		},
	},

	create(context) {
		/** Variable names initialized or reassigned to vi.fn(), vi.mocked(), or vi.spyOn() */
		const viMockVars = new Set<string>();

		/**
		 * Variable names assigned or destructured from a mock's .mock.* internals.
		 * E.g. `const calls = mockFn.mock.calls` or `const { calls } = mockFn.mock`.
		 */
		const mockInternalVars = new Set<string>();

		/** Register an identifier as a mock variable if the value is a vi mock call (including chained config). */
		const trackViMockVar = (id: TSESTree.Node, init: TSESTree.Node | null | undefined): void => {
			if (id.type === "Identifier" && isViMockExpression(init, viMockVars)) {
				viMockVars.add(id.name);
			}
		};

		/**
		 * Track variables assigned or destructured from mock .mock.* internals.
		 * Handles simple assignment, object destructuring, and array destructuring:
		 *   const calls = mockFn.mock.calls
		 *   const { calls, results } = mockFn.mock
		 *   const [first] = mockFn.mock.calls
		 */
		const trackMockInternalVar = (
			id: TSESTree.Node,
			init: TSESTree.Node | null | undefined,
		): void => {
			// Strip TS assertions first so `mock.calls[0][0] as Type` is still recognized
			const stripped = init != null ? stripTsAssertions(init) : init;
			if (stripped == null || !isMockInternalAccess(stripped, viMockVars)) {
				return;
			}
			// mock.calls.length yields a plain number, not a mock-internal structure.
			// Tracking it causes false positives when storing a count for a delta
			// comparison (e.g. const prev = mock.calls.length; expect(prev).toBeLessThan(current)).
			if (getMockInternalProperty(stripped, viMockVars) === "calls.length") {
				return;
			}
			if (id.type === "Identifier") {
				mockInternalVars.add(id.name);
			}
			if (id.type === "ObjectPattern") {
				for (const prop of id.properties) {
					if (prop.type === "Property") {
						const val = prop.value;
						if (val.type === "Identifier") {
							mockInternalVars.add(val.name);
						}
					}
				}
			}
			if (id.type === "ArrayPattern") {
				for (const element of id.elements) {
					if (element != null && element.type === "Identifier") {
						mockInternalVars.add(element.name);
					}
				}
			}
		};

		return {
			// Track: const foo = vi.fn() / vi.mocked(x) / vi.spyOn(obj, m)
			VariableDeclarator(node: TSESTree.VariableDeclarator): void {
				trackViMockVar(node.id, node.init);
				trackMockInternalVar(node.id, node.init);
			},

			// Track reassignments: foo = vi.fn() / vi.mocked(x) / vi.spyOn(obj, m)
			AssignmentExpression(node: TSESTree.AssignmentExpression): void {
				trackViMockVar(node.left, node.right);
				trackMockInternalVar(node.left, node.right);
			},

			CallExpression(node: TSESTree.CallExpression): void {
				// Only care about expect(...)
				if (node.callee.type !== "Identifier" || node.callee.name !== "expect") {
					return;
				}

				let arg: TSESTree.Node | undefined = node.arguments[0];
				if (arg == null) {
					return;
				}

				// Unwrap await: expect(await mockFn()) → inspect the inner call
				if (arg.type === "AwaitExpression") {
					arg = arg.argument;
				}

				// Unwrap typeof: expect(typeof mockFn.mock.calls[0][0])
				if (arg.type === "UnaryExpression" && arg.operator === "typeof") {
					arg = arg.argument;
				}

				// Unwrap TS type casts: expect(expr as Type) / expect(expr satisfies Type)
				arg = stripTsAssertions(arg);

				// Check for mock internal state access — direct, stored, or destructured.
				const mockProp = getMockInternalProperty(arg, viMockVars);
				if (mockProp !== null || isMockInternalVarAccess(arg, mockInternalVars)) {
					// Special case: expect(mock.calls.length).toBeGreaterThan(someVar)
					// is a delta comparison — there is no Vitest-idiomatic equivalent
					// for "called more times than before" when the baseline is unknown.
					// Allow it only when the matcher argument is a variable (not a literal);
					// literal args (e.g. 0) still have Vitest equivalents.
					if (mockProp === "calls.length") {
						const DELTA_MATCHERS = new Set([
							"toBeGreaterThan",
							"toBeGreaterThanOrEqual",
							"toBeLessThan",
							"toBeLessThanOrEqual",
						]);
						const parentMember = node.parent;
						const outerCall = parentMember?.parent;
						if (
							parentMember?.type === "MemberExpression" &&
							parentMember.object === node &&
							!parentMember.computed &&
							parentMember.property.type === "Identifier" &&
							DELTA_MATCHERS.has(parentMember.property.name) &&
							outerCall?.type === "CallExpression" &&
							outerCall.arguments.length > 0 &&
							outerCall.arguments[0].type === "Identifier"
						) {
							return;
						}
					}
					const propMessageId: Record<MockInternalProperty, MessageIds> = {
						"calls.length": "mockCallsLengthAccess",
						calls: "mockCallsAccess",
						results: "mockResultsAccess",
						lastCall: "mockLastCallAccess",
						instances: "mockInternalStateAccess",
						other: "mockInternalStateAccess",
					};
					context.report({
						node: arg,
						messageId: mockProp !== null ? propMessageId[mockProp] : "mockDerivedVarAccess",
					});
					return;
				}

				// Arg must be a call expression for remaining patterns
				if (arg.type !== "CallExpression") {
					return;
				}

				const rootKind = getMockRootKind(arg.callee, viMockVars);
				if (rootKind == null) {
					return;
				}

				const messageIdMap: Record<RootKind, MessageIds> = {
					"vi.fn": "viFnCall",
					"vi.spyOn": "viSpyOnCall",
					"vi.mocked": "viMockedCall",
					localMock: "localMockCall",
				};

				context.report({
					node: arg,
					messageId: messageIdMap[rootKind],
				});
			},
		};
	},
};

export default rule;
