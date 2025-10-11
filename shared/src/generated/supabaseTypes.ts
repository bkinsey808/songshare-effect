export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: "13.0.4";
	};
	public: {
		Tables: {
			song: {
				Row: {
					created_at: string;
					private_notes: string;
					song_id: string;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					private_notes: string;
					song_id?: string;
					updated_at?: string;
					user_id?: string;
				};
				Update: {
					created_at?: string;
					private_notes?: string;
					song_id?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "song_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "user";
						referencedColumns: ["user_id"];
					},
				];
			};
			song_public: {
				Row: {
					created_at: string | null;
					fields: string[];
					key: string | null;
					long_credit: string | null;
					public_notes: string | null;
					scale: string | null;
					short_credit: string | null;
					slide_order: string[];
					slides: Json;
					song_id: string;
					song_name: string;
					song_slug: string;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					created_at?: string | null;
					fields: string[];
					key?: string | null;
					long_credit?: string | null;
					public_notes?: string | null;
					scale?: string | null;
					short_credit?: string | null;
					slide_order: string[];
					slides: Json;
					song_id: string;
					song_name: string;
					song_slug: string;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					created_at?: string | null;
					fields?: string[];
					key?: string | null;
					long_credit?: string | null;
					public_notes?: string | null;
					scale?: string | null;
					short_credit?: string | null;
					slide_order?: string[];
					slides?: Json;
					song_id?: string;
					song_name?: string;
					song_slug?: string;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "song_public_song_id_fkey";
						columns: ["song_id"];
						isOneToOne: true;
						referencedRelation: "song";
						referencedColumns: ["song_id"];
					},
					{
						foreignKeyName: "song_public_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "user";
						referencedColumns: ["user_id"];
					},
				];
			};
			user: {
				Row: {
					created_at: string;
					email: string;
					google_calendar_access: string;
					google_calendar_refresh_token: string | null;
					linked_providers: string[];
					name: string;
					role: string;
					role_expires_at: string | null;
					sub: string | null;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					email: string;
					google_calendar_access?: string;
					google_calendar_refresh_token?: string | null;
					linked_providers?: string[];
					name: string;
					role?: string;
					role_expires_at?: string | null;
					sub?: string | null;
					updated_at?: string;
					user_id?: string;
				};
				Update: {
					created_at?: string;
					email?: string;
					google_calendar_access?: string;
					google_calendar_refresh_token?: string | null;
					linked_providers?: string[];
					name?: string;
					role?: string;
					role_expires_at?: string | null;
					sub?: string | null;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			user_public: {
				Row: {
					user_id: string;
					username: string;
				};
				Insert: {
					user_id: string;
					username: string;
				};
				Update: {
					user_id?: string;
					username?: string;
				};
				Relationships: [
					{
						foreignKeyName: "user_public_userid_fkey";
						columns: ["user_id"];
						isOneToOne: true;
						referencedRelation: "user";
						referencedColumns: ["user_id"];
					},
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
	keyof Database,
	"public"
>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
				DefaultSchema["Views"])
		? (DefaultSchema["Tables"] &
				DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema["Enums"]
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {},
	},
} as const;
