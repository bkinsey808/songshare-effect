import { useEffect, useState } from "react";

import useSchedule from "@/react/hooks/useSchedule";

type HeavyComponentParams = Readonly<{
	name: string;
	color: string;
}>;

// File-local constants to avoid magic-number warnings in the demo
const LARGE_ITERATIONS = 1_000_000;
const RENDER_TIME_PRECISION = 2;
const INITIAL_RENDER_TIME = 0;
const INCREMENT = 1;

export default function HeavyComponent({ name, color }: HeavyComponentParams): ReactElement {
	const [renderTime, setRenderTime] = useState<number>(INITIAL_RENDER_TIME);

	// Call hooks at top-level
	const schedule = useSchedule();

	useEffect(() => {
		const start = performance.now();
		// Simulate some heavy computation
		let _result = 0;
		for (let i = 0; i < LARGE_ITERATIONS; i += INCREMENT) {
			_result += Math.random();
		}
		const end = performance.now();

		// Schedule the state update to avoid synchronous setState inside
		// useEffect and to prevent updates after unmount.
		schedule(() => {
			setRenderTime(end - start);
		});
	}, [schedule]);

	return (
		<div className={`rounded-lg border p-6 ${color}`}>
			<h3 className="mb-2 text-xl font-semibold">{name}</h3>
			<p className="mb-4 text-gray-300">
				This component simulates heavy computation and rendering.
			</p>
			<div className="text-sm text-gray-400">
				Render time: {renderTime.toFixed(RENDER_TIME_PRECISION)}ms
			</div>
			<div className="mt-4 space-y-2">
				<div className="h-4 animate-pulse rounded bg-gray-600" />
				<div className="h-4 w-3/4 animate-pulse rounded bg-gray-600" />
				<div className="h-4 w-1/2 animate-pulse rounded bg-gray-600" />
			</div>
		</div>
	);
}
