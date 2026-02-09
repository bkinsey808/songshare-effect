import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

import tw from "@/react/lib/utils/tw";

type ButtonVariant =
	| "primary"
	| "secondary"
	| "danger"
	| "outlinePrimary"
	| "outlineSecondary"
	| "outlineDanger";
type ButtonSize = "default" | "compact";

const base = tw`rounded font-medium transition disabled:opacity-50`;

// Use data-size attribute and data-[size=...] classes so you can
// override or add size styles outside React (e.g. in CSS).
const sizeDefault = tw`
	data-[size=default]:px-6 data-[size=default]:py-3
`;

const sizeCompact = tw`
	data-[size=compact]:px-3 data-[size=compact]:py-1.5
`;

const sizeClasses = [sizeDefault, sizeCompact].join(" ");

// Use data-variant attribute and data-[variant=...] classes so you can
// override or add variant styles outside React (e.g. in CSS).
const variantPrimary = tw`
	data-[variant=primary]:bg-blue-600 data-[variant=primary]:text-white data-[variant=primary]:hover:bg-blue-700
`;

const variantSecondary = tw`
	data-[variant=secondary]:bg-gray-600 data-[variant=secondary]:text-white data-[variant=secondary]:hover:bg-gray-700
`;

const variantDanger = tw`
	data-[variant=danger]:bg-red-600 data-[variant=danger]:text-white data-[variant=danger]:hover:bg-red-700
`;

const variantOutlinePrimary = tw`
	data-[variant=outlinePrimary]:border data-[variant=outlinePrimary]:border-blue-600 data-[variant=outlinePrimary]:bg-transparent data-[variant=outlinePrimary]:text-white data-[variant=outlinePrimary]:hover:bg-blue-700/10
`;

const variantOutlineSecondary = tw`
	data-[variant=outlineSecondary]:border data-[variant=outlineSecondary]:border-gray-500 data-[variant=outlineSecondary]:bg-transparent data-[variant=outlineSecondary]:text-gray-300 data-[variant=outlineSecondary]:hover:bg-gray-700
`;

const variantOutlineDanger = tw`
	data-[variant=outlineDanger]:border data-[variant=outlineDanger]:border-red-600 data-[variant=outlineDanger]:bg-transparent data-[variant=outlineDanger]:text-red-400 data-[variant=outlineDanger]:hover:bg-red-900/30
`;

const variantClasses = [
	variantPrimary,
	variantSecondary,
	variantDanger,
	variantOutlinePrimary,
	variantOutlineSecondary,
	variantOutlineDanger,
].join(" ");

type ButtonType = NonNullable<ButtonHTMLAttributes<HTMLButtonElement>["type"]>;

type ButtonProps = Readonly<{
	variant: ButtonVariant;
	size?: ButtonSize;
	children: ReactNode;
	/** Icon shown to the left of the label. Uses a column layout so the icon does not wrap; long text wraps in the right column. */
	icon?: ReactNode;
	disabled?: boolean;
	type?: ButtonType;
	onClick?: () => void;
	"data-testid"?: string;
	className?: string;
}>;

/**
 * Reusable button component with variant and size options, optional icon,
 * and consistent styling across the app.
 *
 * @param variant - Visual variant of the button (primary, secondary, danger, outlines)
 * @param size - Visual size ('default' or 'compact')
 * @param children - Label or content for the button
 * @param icon - Optional icon shown to the left of the label
 * @param disabled - When true, the button is disabled
 * @param type - Native button `type` attribute
 * @param onClick - Click handler
 * @param data-testid - Optional test id attribute used in tests
 * @param className - Optional extra class names to apply
 * @returns A styled button React element
 */
export default function Button({
	variant,
	size = "default",
	children,
	icon,
	disabled = false,
	type = "button",
	onClick,
	"data-testid": dataTestId,
	className = "",
}: ButtonProps): ReactElement {
	const layoutClass = icon === undefined ? "" : " inline-flex items-start gap-2 text-left";
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			data-variant={variant}
			data-size={size}
			className={`${base} ${sizeClasses} ${variantClasses}${layoutClass} ${className}`.trim()}
			data-testid={dataTestId}
		>
			{icon === undefined ? (
				children
			) : (
				<>
					<span className="shrink-0 mt-[calc(0.5lh-0.5em)]" aria-hidden>
						{icon}
					</span>
					<span className="min-w-0 flex-1">{children}</span>
				</>
			)}
		</button>
	);
}
