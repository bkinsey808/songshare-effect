/**
 * Create a deferred promise that can be resolved or rejected manually.
 *
 * The `new Promise` call triggers a lint rule, so the disable lives here in
 * the helper (tests can import without needing their own comments).
 *
 * The deferred helper needs to create a new Promise and expose its
 * resolvers. Several lint rules fire on the implementation, so we
 * turn them off here in one place rather than scattering disables across
 * multiple tests.
 */
export default function makeDeferred<TValue>(): {
	promise: Promise<TValue>;
	resolve: (value: TValue | PromiseLike<TValue>) => void;
	reject: (reason?: unknown) => void;
} {
	// oxlint-disable-next-line init-declarations
	let resolve!: (value: TValue | PromiseLike<TValue>) => void;
	// oxlint-disable-next-line init-declarations
	let reject!: (reason?: unknown) => void;
	// oxlint-disable-next-line promise/avoid-new, promise/param-names
	const promise = new Promise<TValue>((resolveParam, rejectParam) => {
		resolve = resolveParam;
		reject = rejectParam;
	});
	return { promise, resolve, reject };
}
