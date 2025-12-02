import { useState } from "react";

const INITIAL_COUNT = 0;
const INCREMENT = 1;

type InteractiveComponentParams = Readonly<{
	title: string;
}>;

export default function InteractiveComponent({ title }: InteractiveComponentParams): ReactElement {
	const [inputValue, setInputValue] = useState("");
	const [count, setCount] = useState(INITIAL_COUNT);

	return (
		<div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-6">
			<h3 className="mb-4 text-xl font-semibold text-purple-300">{title}</h3>
			<div className="space-y-4">
				<div>
					<label
						htmlFor={`input-${title}`}
						className="mb-2 block text-sm font-medium text-gray-300"
					>
						Text Input (preserved when hidden):
					</label>
					<input
						id={`input-${title}`}
						type="text"
						value={inputValue}
						onChange={(ev) => {
							setInputValue(ev.target.value);
						}}
						placeholder="Type something..."
						className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
					/>
				</div>
				<div>
					<div className="mb-2 block text-sm font-medium text-gray-300">Counter: {count}</div>
					<button
						type="button"
						onClick={() => {
							setCount((cnt) => cnt + INCREMENT);
						}}
						className="rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
					>
						Increment
					</button>
				</div>
			</div>
		</div>
	);
}
