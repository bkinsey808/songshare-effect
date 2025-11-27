import { useState } from "react";

import { tw } from "@/react/utils/tw";

type DismissibleAlertProps = Readonly<{
	visible: boolean;
	onDismiss: () => void;
	title?: string | null;
	children?: string | null;
	variant?: "error" | "info" | "success";
	className?: string;
	alertType?: string;
}>;

export default function DismissibleAlert({
	visible,
	onDismiss,
	title,
	children,
	variant: data_variant = "error",
	className = "",
	alertType,
}: DismissibleAlertProps): ReactElement | undefined {
	// Internal closing state so we can play an exit animation before
	// calling onDismiss (parent will then clear state). Keep the element
	// mounted while isClosing is true.
	const [isClosing, setIsClosing] = useState(false);

	// Use data-variant attribute and static tailwind classes so the JIT/purge
	// recognizes all possible styles. This keeps Tailwind aware of the
	// classes while still allowing the variant to be chosen at runtime.
	const base = tw`
		mb-6 rounded-md p-4 text-center transition-all duration-200
		data-[variant=error]:bg-red-600/10 data-[variant=error]:text-red-300
		data-[variant=info]:bg-blue-500/10 data-[variant=info]:text-blue-300
		data-[variant=success]:bg-green-500/10 data-[variant=success]:text-green-300
	`;

	// If not visible and not in the middle of closing, don't render.
	if (!visible && !isClosing) {
		return undefined;
	}

	// Compute animation classes: when visible and not closing -> enter state;
	// when closing -> exit state.
	const animClass = isClosing
		? tw`opacity-0 -translate-y-2`
		: tw`opacity-100 translate-y-0`;

	const ANIMATION_DURATION_MS = 200;

	function handleClick(): void {
		// Start exit animation, then notify parent after animation finishes.
		setIsClosing(true);
		// Match the duration in CSS above (200ms). Use a timeout to call onDismiss
		// after the animation completes.
		window.setTimeout(() => {
			try {
				onDismiss();
			} catch (err) {
				// ignore errors from onDismiss to ensure we always reset local state
				console.error("DismissibleAlert onDismiss error:", err);
			}
			// reset local state in case component remains mounted via props
			setIsClosing(false);
		}, ANIMATION_DURATION_MS);
	}

	return (
		<div
			data-variant={data_variant}
			className={`${base} ${animClass} ${className}`}
			data-testid="dismissible-alert"
			data-alert-type={alertType}
		>
			<div className="mx-auto max-w-3xl">
				{title === undefined ? undefined : (
					<strong className="block" data-testid="alert-title">
						{title}
					</strong>
				)}
				<div className="mt-2">
					<div className="mb-2" data-testid="alert-message">
						{children}
					</div>
					<button
						type="button"
						className="rounded px-3 py-1 text-sm text-white/90"
						onClick={handleClick}
						data-testid="alert-dismiss-button"
					>
						Dismiss
					</button>
				</div>
			</div>
		</div>
	);
}
