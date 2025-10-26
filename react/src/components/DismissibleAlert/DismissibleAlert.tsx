import type { ReactNode } from "react";

type Props = {
	readonly visible: boolean;
	readonly onDismiss: () => void;
	readonly title?: ReactNode;
	readonly children?: ReactNode;
	readonly variant?: "error" | "info" | "success";
	readonly className?: string;
};

export function DismissibleAlert({
	visible,
	onDismiss,
	title,
	children,
	variant = "error",
	className = "",
}: Readonly<Props>): ReactElement | undefined {
	if (!visible) {
		return undefined;
	}

	const base = "mb-6 rounded-md p-4 text-center";
	const variantClasses: Record<"error" | "info" | "success", string> = {
		error: "bg-red-600/10 text-red-300",
		info: "bg-blue-500/10 text-blue-300",
		success: "bg-green-500/10 text-green-300",
	};

	const variantClass =
		variantClasses[variant as "error" | "info" | "success"] ??
		variantClasses.error;

	return (
		<div className={`${base} ${variantClass} ${className}`}>
			<div className="mx-auto max-w-3xl">
				{title === undefined ? undefined : (
					<strong className="block">{title}</strong>
				)}
				<div className="mt-2">
					<div className="mb-2">{children}</div>
					<button
						type="button"
						className="rounded px-3 py-1 text-sm text-white/90"
						onClick={onDismiss}
					>
						Dismiss
					</button>
				</div>
			</div>
		</div>
	);
}

export default DismissibleAlert;
