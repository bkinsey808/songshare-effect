import type { ReactElement } from "react";

import type { AlertType } from "@/react/pages/home/AlertState.type";

import tw from "@/react/lib/utils/tw";

import useDismissibleAlert from "./useDismissibleAlert";

type DismissibleAlertProps = Readonly<{
	visible: boolean;
	onDismiss: () => void;
	title?: string | null;
	children?: string | null;
	variant?: "error" | "info" | "success";
	className?: string;
	alertType?: AlertType | undefined;
}>;

const base = tw`mb-6 rounded-md p-4 text-center transition-all duration-200`;

// Use data-variant attribute and data-[variant=...] classes so you can
// override or add variant styles outside React (e.g. in CSS).
const variantError = tw`
	data-[variant=error]:bg-red-600/10 data-[variant=error]:text-red-300
`;
const variantInfo = tw`
	data-[variant=info]:bg-blue-500/10 data-[variant=info]:text-blue-300
`;
const variantSuccess = tw`
	data-[variant=success]:bg-green-500/10 data-[variant=success]:text-green-300
`;
const variantClasses = [variantError, variantInfo, variantSuccess].join(" ");

/**
 * A dismissible alert that shows a message and plays a short exit animation
 * before notifying the parent via `onDismiss`.
 *
 * @param visible - Whether the alert is currently visible
 * @param onDismiss - Callback invoked after the exit animation completes
 * @param title - Optional bold title for the alert
 * @param children - Optional alert message text or node
 * @param variant - Visual variant: 'error' | 'info' | 'success'
 * @param className - Optional additional CSS classes
 * @param alertType - Optional test identifier for the alert type
 * @returns A React element when visible (or during exit) or `undefined` when hidden
 */
export default function DismissibleAlert({
	visible,
	onDismiss,
	title,
	children,
	variant = "error",
	className = "",
	alertType,
}: DismissibleAlertProps): ReactElement | undefined {
	// Hook manages closing state and animation timing.
	const { isClosing, animClass, handleDismiss } = useDismissibleAlert(onDismiss);

	// If not visible and not in the middle of closing, don't render.
	if (!visible && !isClosing) {
		return undefined;
	}

	return (
		<div
			data-variant={variant}
			className={`${base} ${variantClasses} ${animClass} ${className}`}
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
						onClick={handleDismiss}
						data-testid="alert-dismiss-button"
					>
						Dismiss
					</button>
				</div>
			</div>
		</div>
	);
}
