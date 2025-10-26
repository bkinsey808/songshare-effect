export type ValidationError = {
	field: string;
	message: string;
	params?: Record<string, unknown>;
};

export type ValidationResult<T> =
	| {
			success: true;
			data: T;
	  }
	| {
			success: false;
			errors: ValidationError[];
	  };
