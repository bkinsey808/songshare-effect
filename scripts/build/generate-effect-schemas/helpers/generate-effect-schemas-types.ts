export type ColumnDefinition = {
	name: string;
	type: string;
	nullable: boolean;
	isPrimaryKey?: boolean;
	isForeignKey?: boolean;
	referencedTable?: string;
	isRequiredForInsert?: boolean;
	/** Allowed literal values from a database CHECK (col = ANY (ARRAY[...])) constraint. */
	allowedValues?: readonly string[];
};

export type TableDefinition = {
	name: string;
	columns: ColumnDefinition[];
};
