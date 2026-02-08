import type { AlertType as _AlertType } from "./alert-keys";

export type AlertType = _AlertType;

export type AlertState = {
	visible: boolean;
	type?: AlertType;
};
