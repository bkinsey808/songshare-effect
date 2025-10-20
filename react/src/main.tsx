import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/react/App";
// Removed unused imports after moving hide style logic to React
import "@/react/i18n";
import "@/react/index.css";

// The root will be unhidden by React after hydration and auth checks (see HydratedLayout)

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
