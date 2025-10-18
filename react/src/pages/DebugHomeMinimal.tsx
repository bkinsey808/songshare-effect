import React from "react";

import { traceHook } from "@/react/hooks/hookTracer";

const DebugHomeMinimal = (): React.ReactElement => {
	traceHook("DebugHomeMinimal:render");

	return (
		<div className="m-8 rounded bg-gray-800 p-6 text-white">
			<h1 className="text-2xl font-bold">Debug Home (minimal)</h1>
			<p>This page is used temporarily to isolate hook-order issues.</p>
		</div>
	);
};

export default DebugHomeMinimal;
