type IconProps = Readonly<{
	className?: string;
	width?: string;
	height?: string;
}>;

/**
 * Microsoft brand icon (four-color square tiles)
 *
 * @param props - Icon properties (optional width, height, className)
 * @returns React element rendering the Microsoft icon
 */
export default function MicrosoftIcon(props: IconProps): ReactElement {
	return (
		<svg
			width={props.width ?? "20"}
			height={props.height ?? "20"}
			viewBox="0 0 24 24"
			fill="none"
			className={props.className}
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect x="1" y="1" width="10" height="10" fill="#F35325" />
			<rect x="13" y="1" width="10" height="10" fill="#81BC06" />
			<rect x="1" y="13" width="10" height="10" fill="#05A6F0" />
			<rect x="13" y="13" width="10" height="10" fill="#FFBA08" />
		</svg>
	);
}
