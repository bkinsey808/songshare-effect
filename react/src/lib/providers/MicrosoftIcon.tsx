type IconProps = Readonly<{
	className?: string;
	width?: string;
	height?: string;
}>;

/**
 * Render the Microsoft brand icon.
 *
 * @param className - Optional CSS class name.
 * @param width - Optional width override.
 * @param height - Optional height override.
 * @returns React element rendering the Microsoft icon.
 */
export default function MicrosoftIcon({ className, width, height }: IconProps): ReactElement {
	return (
		<svg
			width={width ?? "20"}
			height={height ?? "20"}
			viewBox="0 0 24 24"
			fill="none"
			className={className}
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect x="1" y="1" width="10" height="10" fill="#F35325" />
			<rect x="13" y="1" width="10" height="10" fill="#81BC06" />
			<rect x="1" y="13" width="10" height="10" fill="#05A6F0" />
			<rect x="13" y="13" width="10" height="10" fill="#FFBA08" />
		</svg>
	);
}
