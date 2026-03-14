/**
 * Tests for the `no-assert-mocked-return` ESLint rule.
 *
 * Covers all message IDs the rule can emit:
 *   - `viFnCall`              calling vi.fn()() inside expect()
 *   - `viMockedCall`          calling vi.mocked(fn)() inside expect()
 *   - `viSpyOnCall`           calling vi.spyOn()() inside expect()
 *   - `localMockCall`         calling a tracked mock variable inside expect()
 *   - `mockCallsAccess`       reading .mock.calls[…] inside expect()
 *   - `mockResultsAccess`     reading .mock.results[…] inside expect()
 *   - `mockLastCallAccess`    reading .mock.lastCall inside expect()
 *   - `mockCallsLengthAccess` reading .mock.calls.length inside expect()
 *   - `mockInternalStateAccess` reading other .mock.* internals inside expect()
 *   - `mockDerivedVarAccess`  asserting a variable extracted from mock call records
 *
 * Also verifies the delta-comparison exemption:
 *   expect(mock.calls.length).toBeGreaterThan(variableBaseline) — allowed
 */
import { type JSRuleDefinition, RuleTester } from 'eslint';

import rule from './no-assert-mocked-return';
 
// The rule is purely AST-based; the default espree parser handles all test cases
// (no TypeScript-specific syntax needed in the code strings).
const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
    },
});
 
// @typescript-eslint/utils RuleModule uses the ESLint 8 API; ESLint 9's RuleTester
// expects a RuleDefinition from @eslint/core. The runtime shape is compatible — the
// cast bridges the two type systems without affecting behaviour.
ruleTester.run('no-assert-mocked-return', rule as unknown as JSRuleDefinition, {
    valid: [
        // Passing the mock itself — correct interaction assertions
        {
            name: 'expect(mock).toHaveBeenCalled() — mock passed directly, not called',
            code: `const m = vi.fn(); expect(m).toHaveBeenCalled();`,
        },
        {
            name: 'expect(mock).toHaveBeenCalledWith() — correct interaction assertion',
            code: `const m = vi.fn(); expect(m).toHaveBeenCalledWith('arg');`,
        },
        {
            name: 'expect(mock).toHaveBeenCalledTimes() — correct count assertion',
            code: `const m = vi.fn(); expect(m).toHaveBeenCalledTimes(2);`,
        },
        {
            name: 'expect(mock).toHaveReturnedWith() — correct return assertion',
            code: `const m = vi.fn(); expect(m).toHaveReturnedWith('value');`,
        },
        {
            name: 'expect(mock).toHaveBeenLastCalledWith() — correct last-call assertion',
            code: `const m = vi.fn(); expect(m).toHaveBeenLastCalledWith('arg');`,
        },
        {
            name: 'expect(mock).not.toHaveBeenCalled() — negated interaction assertion',
            code: `const m = vi.fn(); expect(m).not.toHaveBeenCalled();`,
        },
        {
            name: 'expect(result) where result is not from a mock',
            code: `function realFn() { return 42; } const result = realFn(); expect(result).toBe(42);`,
        },
        {
            name: 'expect() on unrelated function call',
            code: `function realFn() { return true; } expect(realFn());`,
        },
        {
            name: 'vi.mocked() passed directly — not called',
            code: `const m = vi.mocked(someFn); expect(m).toHaveBeenCalledWith('x');`,
        },
        {
            name: 'vi.spyOn() passed directly — not called',
            code: `const obj = { m: () => {} }; const s = vi.spyOn(obj, 'm'); expect(s).toHaveBeenCalled();`,
        },
 
        // Delta comparison exemption
        {
            name: 'expect(mock.calls.length).toBeGreaterThan(variableBaseline) — delta comparison, allowed',
            code: `const m = vi.fn(); const prev = m.mock.calls.length; m(); expect(m.mock.calls.length).toBeGreaterThan(prev);`,
        },
        {
            name: 'expect(mock.calls.length).toBeGreaterThanOrEqual(variableBaseline) — allowed',
            code: `const m = vi.fn(); const prev = m.mock.calls.length; m(); expect(m.mock.calls.length).toBeGreaterThanOrEqual(prev);`,
        },
        {
            name: 'expect(mock.calls.length).toBeLessThan(variableBaseline) — allowed',
            code: `const m = vi.fn(); const limit = m.mock.calls.length; expect(m.mock.calls.length).toBeLessThan(limit);`,
        },
        {
            name: 'expect(mock.calls.length).toBeLessThanOrEqual(variableBaseline) — allowed',
            code: `const m = vi.fn(); const limit = m.mock.calls.length; expect(m.mock.calls.length).toBeLessThanOrEqual(limit);`,
        },
        {
            // calls.length is NOT added to mockInternalVars, so the stored variable is
            // treated as a plain number and won't trigger mockDerivedVarAccess
            name: 'stored calls.length used in delta comparison — allowed',
            code: `const m = vi.fn(); const n = m.mock.calls.length; m(); expect(n).toBeGreaterThan(0);`,
        },
    ],
 
    invalid: [
        // --- viFnCall ---
        {
            name: 'expect(vi.fn()()) — calling vi.fn() result inside expect',
            code: `expect(vi.fn()());`,
            errors: [{ messageId: 'viFnCall' }],
        },
        {
            name: 'expect(vi.fn().mockReturnValue("x")()) — chained mock config called inside expect',
            code: `expect(vi.fn().mockReturnValue('x')());`,
            errors: [{ messageId: 'viFnCall' }],
        },
 
        // --- viMockedCall ---
        {
            name: 'expect(vi.mocked(fn)()) — calling vi.mocked() result inside expect',
            code: `expect(vi.mocked(fn)());`,
            errors: [{ messageId: 'viMockedCall' }],
        },
 
        // --- viSpyOnCall ---
        {
            name: 'expect(vi.spyOn(obj, "m")()) — calling vi.spyOn() result inside expect',
            code: `const obj = { m: () => {} }; expect(vi.spyOn(obj, 'm')());`,
            errors: [{ messageId: 'viSpyOnCall' }],
        },
 
        // --- localMockCall ---
        {
            name: 'const m = vi.fn(); expect(m()) — local mock variable called inside expect',
            code: `const m = vi.fn(); expect(m());`,
            errors: [{ messageId: 'localMockCall' }],
        },
        {
            name: 'const m = vi.mocked(fn); expect(m()) — typed mock variable called inside expect',
            code: `const m = vi.mocked(fn); expect(m());`,
            errors: [{ messageId: 'localMockCall' }],
        },
        {
            name: 'const s = vi.spyOn(obj, "m"); expect(s()) — spy variable called inside expect',
            code: `const obj = { m: () => {} }; const s = vi.spyOn(obj, 'm'); expect(s());`,
            errors: [{ messageId: 'localMockCall' }],
        },
        {
            name: 'reassigned mock variable: let m = vi.fn(); m = vi.fn(); expect(m())',
            code: `let m = vi.fn(); m = vi.fn(); expect(m());`,
            errors: [{ messageId: 'localMockCall' }],
        },
        {
            name: 'expect(await m()) — awaiting a mock call inside expect',
            code: `const m = vi.fn(); async function test() { expect(await m()); }`,
            errors: [{ messageId: 'localMockCall' }],
        },
        {
            name: 'chained mock config on local variable called inside expect',
            code: `const m = vi.fn(); expect(m.mockReturnValue('x')());`,
            errors: [{ messageId: 'localMockCall' }],
        },
        {
            name: 'vi.hoisted factory mock called inside expect',
            code: `const m = vi.hoisted(() => vi.fn()); expect(m());`,
            errors: [{ messageId: 'localMockCall' }],
        },
 
        // --- mockCallsAccess ---
        {
            name: 'expect(m.mock.calls[0][0]) — reading .mock.calls directly inside expect',
            code: `const m = vi.fn(); expect(m.mock.calls[0][0]);`,
            errors: [{ messageId: 'mockCallsAccess' }],
        },
        {
            name: 'expect(m.mock.calls[0]) — reading first call record inside expect',
            code: `const m = vi.fn(); expect(m.mock.calls[0]);`,
            errors: [{ messageId: 'mockCallsAccess' }],
        },
        {
            name: 'property of mocked object .mock.calls access',
            code: `const m = vi.mocked(svc); expect(m.getData.mock.calls[0]);`,
            errors: [{ messageId: 'mockCallsAccess' }],
        },
        {
            name: 'expect(typeof mockFn.mock.calls[0][0]) — typeof unwrapping',
            code: `const m = vi.fn(); expect(typeof m.mock.calls[0][0]);`,
            errors: [{ messageId: 'mockCallsAccess' }],
        },
        {
            name: 'vi.hoisted mock .mock.calls access',
            code: `const m = vi.hoisted(() => vi.fn()); expect(m.mock.calls[0]);`,
            errors: [{ messageId: 'mockCallsAccess' }],
        },
 
        // --- mockResultsAccess ---
        {
            name: 'expect(m.mock.results[0].value) — reading .mock.results inside expect',
            code: `const m = vi.fn(); expect(m.mock.results[0].value);`,
            errors: [{ messageId: 'mockResultsAccess' }],
        },
        {
            name: 'expect(m.mock.results[0]) — reading first result record inside expect',
            code: `const m = vi.fn(); expect(m.mock.results[0]);`,
            errors: [{ messageId: 'mockResultsAccess' }],
        },
 
        // --- mockLastCallAccess ---
        {
            name: 'expect(m.mock.lastCall) — reading .mock.lastCall inside expect',
            code: `const m = vi.fn(); expect(m.mock.lastCall);`,
            errors: [{ messageId: 'mockLastCallAccess' }],
        },
 
        // --- mockCallsLengthAccess ---
        {
            name: 'expect(m.mock.calls.length) — reading .mock.calls.length inside expect (standalone)',
            code: `const m = vi.fn(); expect(m.mock.calls.length);`,
            errors: [{ messageId: 'mockCallsLengthAccess' }],
        },
        {
            name: 'expect(m.mock.calls.length).toBeGreaterThan(0) — literal comparator, not a delta',
            code: `const m = vi.fn(); m(); expect(m.mock.calls.length).toBeGreaterThan(0);`,
            errors: [{ messageId: 'mockCallsLengthAccess' }],
        },
        {
            name: 'expect(m.mock.calls.length).toBe(1) — toBe with literal',
            code: `const m = vi.fn(); m(); expect(m.mock.calls.length).toBe(1);`,
            errors: [{ messageId: 'mockCallsLengthAccess' }],
        },
 
        // --- mockInternalStateAccess ---
        {
            name: 'expect(m.mock.instances) — reading .mock.instances inside expect',
            code: `const m = vi.fn(); expect(m.mock.instances);`,
            errors: [{ messageId: 'mockInternalStateAccess' }],
        },
 
        // --- mockDerivedVarAccess (stored mock internals) ---
        {
            name: 'const calls = m.mock.calls; expect(calls[0]) — one-hop stored assignment',
            code: `const m = vi.fn(); const calls = m.mock.calls; expect(calls[0]);`,
            errors: [{ messageId: 'mockDerivedVarAccess' }],
        },
        {
            name: 'const calls = m.mock.calls; expect(calls.length) — stored calls length',
            code: `const m = vi.fn(); const calls = m.mock.calls; expect(calls.length);`,
            errors: [{ messageId: 'mockDerivedVarAccess' }],
        },
        {
            name: 'const { calls } = m.mock; expect(calls[0]) — object-destructured mock internal',
            code: `const m = vi.fn(); const { calls } = m.mock; expect(calls[0]);`,
            errors: [{ messageId: 'mockDerivedVarAccess' }],
        },
        {
            name: 'const [first] = m.mock.calls; expect(first) — array-destructured mock internal',
            code: `const m = vi.fn(); const [first] = m.mock.calls; expect(first);`,
            errors: [{ messageId: 'mockDerivedVarAccess' }],
        },
        {
            name: 'const { results } = m.mock; expect(results[0].value) — destructured results',
            code: `const m = vi.fn(); const { results } = m.mock; expect(results[0].value);`,
            errors: [{ messageId: 'mockDerivedVarAccess' }],
        },
        {
            // Note: the TS-specific path (TSAsExpression / TSSatisfiesExpression stripping inside
            // trackMockInternalVar) is exercised in production when the rule lints .ts/.tsx files
            // via @typescript-eslint/parser. Testing it here would require the TS parser, which is
            // not available with the default espree. The JS-equivalent below covers the same
            // variable-tracking logic through a nested member access.
            name: 'const val = m.mock.results[0].value; expect(val.nested) — deeply stored result property',
            code: `const m = vi.fn(); const val = m.mock.results[0].value; expect(val.nested);`,
            errors: [{ messageId: 'mockDerivedVarAccess' }],
        },
    ],
});
 
 