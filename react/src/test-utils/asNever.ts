export default function asNever(value: unknown): never {
	/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- test-only narrow cast for malformed module input */
	return value as never;
}
