import React from "react";

export function MicrosoftIcon(
	props: React.SVGProps<SVGSVGElement>,
): ReactElement {
	return (
		<svg
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
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
