export type ColumnDefinition = {
    name: string;
    type: string;
    nullable: boolean;
    isPrimaryKey?: boolean;
    isForeignKey?: boolean;
    referencedTable?: string;
    isRequiredForInsert?: boolean;
};

export type TableDefinition = {
    name: string;
    columns: ColumnDefinition[];
};
