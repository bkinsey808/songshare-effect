import { Link } from "react-router-dom";

function Navigation(): ReactElement {
	const navItems = [
		{ path: "/", label: "Home", icon: "🏠" },
		{ path: "/songs", label: "Songs", icon: "🎵" },
		{ path: "/upload", label: "Upload", icon: "📤" },
		{ path: "/suspense-use", label: "Suspense + Use", icon: "🔄" },
		{ path: "/user-subscription", label: "User Subscription", icon: "👥" },
		{ path: "/about", label: "About", icon: "ℹ️" },
	];

	return (
		<nav className="mb-10 flex flex-wrap justify-center gap-5 rounded-xl bg-gray-800 p-5">
			{navItems.map((item) => (
				<Link
					key={item.path}
					to={item.path}
					className="hover:border-primary-500 flex cursor-pointer items-center gap-2 rounded-lg border-2 border-gray-600 bg-transparent px-5 py-3 text-base font-medium text-white transition-all duration-200 hover:bg-gray-700"
				>
					<span>{item.icon}</span>
					<span>{item.label}</span>
				</Link>
			))}
		</nav>
	);
}

export default Navigation;
