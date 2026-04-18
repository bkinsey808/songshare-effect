export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      community: {
        Row: {
          community_id: string
          created_at: string
          owner_id: string
          private_notes: string
          updated_at: string
        }
        Insert: {
          community_id?: string
          created_at?: string
          owner_id: string
          private_notes?: string
          updated_at?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          owner_id?: string
          private_notes?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_event: {
        Row: {
          community_id: string
          created_at: string
          event_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          event_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_event_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community"
            referencedColumns: ["community_id"]
          },
          {
            foreignKeyName: "community_event_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["event_id"]
          },
        ]
      }
      community_library: {
        Row: {
          community_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_library_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community"
            referencedColumns: ["community_id"]
          },
          {
            foreignKeyName: "community_library_community_public_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community_public"
            referencedColumns: ["community_id"]
          },
          {
            foreignKeyName: "community_library_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_playlist: {
        Row: {
          community_id: string
          created_at: string
          playlist_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          playlist_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          playlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_playlist_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community"
            referencedColumns: ["community_id"]
          },
          {
            foreignKeyName: "community_playlist_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlist"
            referencedColumns: ["playlist_id"]
          },
        ]
      }
      community_public: {
        Row: {
          active_event_id: string | null
          community_id: string
          community_name: string
          community_slug: string
          created_at: string | null
          description: string | null
          is_public: boolean
          owner_id: string
          public_notes: string | null
          updated_at: string | null
        }
        Insert: {
          active_event_id?: string | null
          community_id: string
          community_name: string
          community_slug: string
          created_at?: string | null
          description?: string | null
          is_public?: boolean
          owner_id: string
          public_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          active_event_id?: string | null
          community_id?: string
          community_name?: string
          community_slug?: string
          created_at?: string | null
          description?: string | null
          is_public?: boolean
          owner_id?: string
          public_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_public_active_event_id_fkey"
            columns: ["active_event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "community_public_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: true
            referencedRelation: "community"
            referencedColumns: ["community_id"]
          },
        ]
      }
      community_share_request: {
        Row: {
          community_id: string
          created_at: string
          message: string | null
          request_id: string
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          sender_user_id: string
          shared_item_id: string
          shared_item_type: "song" | "playlist"
          status: "pending" | "accepted" | "rejected"
          updated_at: string
        }
        Insert: {
          community_id: string
          created_at?: string
          message?: string | null
          request_id?: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          sender_user_id: string
          shared_item_id: string
          shared_item_type: "song" | "playlist"
          status?: "pending" | "accepted" | "rejected"
          updated_at?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          message?: string | null
          request_id?: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          sender_user_id?: string
          shared_item_id?: string
          shared_item_type?: "song" | "playlist"
          status?: "pending" | "accepted" | "rejected"
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_share_request_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community"
            referencedColumns: ["community_id"]
          },
          {
            foreignKeyName: "community_share_request_reviewed_by_user_id_fkey"
            columns: ["reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_share_request_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_song: {
        Row: {
          community_id: string
          created_at: string
          song_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          song_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_song_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community"
            referencedColumns: ["community_id"]
          },
          {
            foreignKeyName: "community_song_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song"
            referencedColumns: ["song_id"]
          },
        ]
      }
      community_tag: {
        Row: {
          community_id: string
          created_at: string
          tag_slug: string
        }
        Insert: {
          community_id: string
          created_at?: string
          tag_slug: string
        }
        Update: {
          community_id?: string
          created_at?: string
          tag_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_tag_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community_public"
            referencedColumns: ["community_id"]
          },
          {
            foreignKeyName: "community_tag_tag_slug_fkey"
            columns: ["tag_slug"]
            isOneToOne: false
            referencedRelation: "tag"
            referencedColumns: ["tag_slug"]
          },
        ]
      }
      community_user: {
        Row: {
          community_id: string
          joined_at: string
          role: "owner" | "community_admin" | "member"
          status: "invited" | "joined" | "left" | "kicked"
          user_id: string
        }
        Insert: {
          community_id: string
          joined_at?: string
          role: "owner" | "community_admin" | "member"
          status?: "invited" | "joined" | "left" | "kicked"
          user_id: string
        }
        Update: {
          community_id?: string
          joined_at?: string
          role?: "owner" | "community_admin" | "member"
          status?: "invited" | "joined" | "left" | "kicked"
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_user_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community"
            referencedColumns: ["community_id"]
          },
          {
            foreignKeyName: "community_user_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event: {
        Row: {
          created_at: string
          event_id: string
          owner_id: string
          private_notes: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id?: string
          owner_id: string
          private_notes?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          owner_id?: string
          private_notes?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event_library: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_library_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_library_event_public_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_public"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_library_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event_public: {
        Row: {
          active_playlist_id: string | null
          active_slide_position: number | null
          active_song_id: string | null
          created_at: string | null
          event_date: string | null
          event_description: string | null
          event_id: string
          event_name: string
          event_slug: string
          is_public: boolean
          owner_id: string
          public_notes: string | null
          updated_at: string | null
        }
        Insert: {
          active_playlist_id?: string | null
          active_slide_position?: number | null
          active_song_id?: string | null
          created_at?: string | null
          event_date?: string | null
          event_description?: string | null
          event_id: string
          event_name: string
          event_slug: string
          is_public?: boolean
          owner_id: string
          public_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          active_playlist_id?: string | null
          active_slide_position?: number | null
          active_song_id?: string | null
          created_at?: string | null
          event_date?: string | null
          event_description?: string | null
          event_id?: string
          event_name?: string
          event_slug?: string
          is_public?: boolean
          owner_id?: string
          public_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_public_active_playlist_id_fkey"
            columns: ["active_playlist_id"]
            isOneToOne: false
            referencedRelation: "playlist"
            referencedColumns: ["playlist_id"]
          },
          {
            foreignKeyName: "event_public_active_song_id_fkey"
            columns: ["active_song_id"]
            isOneToOne: false
            referencedRelation: "song"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "event_public_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_public_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_public"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event_tag: {
        Row: {
          created_at: string
          event_id: string
          tag_slug: string
        }
        Insert: {
          created_at?: string
          event_id: string
          tag_slug: string
        }
        Update: {
          created_at?: string
          event_id?: string
          tag_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tag_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_public"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_tag_tag_slug_fkey"
            columns: ["tag_slug"]
            isOneToOne: false
            referencedRelation: "tag"
            referencedColumns: ["tag_slug"]
          },
        ]
      }
      event_user: {
        Row: {
          event_id: string
          joined_at: string
          role: "owner" | "event_admin" | "event_playlist_admin" | "participant"
          status: "invited" | "joined" | "left" | "kicked"
          user_id: string
        }
        Insert: {
          event_id: string
          joined_at?: string
          role: "owner" | "event_admin" | "event_playlist_admin" | "participant"
          status?: "invited" | "joined" | "left" | "kicked"
          user_id: string
        }
        Update: {
          event_id?: string
          joined_at?: string
          role?: "owner" | "event_admin" | "event_playlist_admin" | "participant"
          status?: "invited" | "joined" | "left" | "kicked"
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_user_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_user_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      image: {
        Row: {
          created_at: string
          image_id: string
          private_notes: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          image_id?: string
          private_notes?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          image_id?: string
          private_notes?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      image_library: {
        Row: {
          created_at: string
          image_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          image_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          image_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_library_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "image_public"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "image_library_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      image_public: {
        Row: {
          alt_text: string
          content_type: string
          created_at: string
          description: string
          file_size: number
          focal_point_x: number
          focal_point_y: number
          height: number | null
          image_id: string
          image_name: string
          image_slug: string
          r2_key: string
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          alt_text?: string
          content_type?: string
          created_at?: string
          description?: string
          file_size?: number
          focal_point_x?: number
          focal_point_y?: number
          height?: number | null
          image_id: string
          image_name?: string
          image_slug?: string
          r2_key: string
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          alt_text?: string
          content_type?: string
          created_at?: string
          description?: string
          file_size?: number
          focal_point_x?: number
          focal_point_y?: number
          height?: number | null
          image_id?: string
          image_name?: string
          image_slug?: string
          r2_key?: string
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "image_public_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: true
            referencedRelation: "image"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "image_public_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      image_tag: {
        Row: {
          created_at: string
          image_id: string
          tag_slug: string
        }
        Insert: {
          created_at?: string
          image_id: string
          tag_slug: string
        }
        Update: {
          created_at?: string
          image_id?: string
          tag_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_tag_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "image_public"
            referencedColumns: ["image_id"]
          },
          {
            foreignKeyName: "image_tag_tag_slug_fkey"
            columns: ["tag_slug"]
            isOneToOne: false
            referencedRelation: "tag"
            referencedColumns: ["tag_slug"]
          },
        ]
      }
      playlist: {
        Row: {
          created_at: string
          playlist_id: string
          private_notes: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          playlist_id?: string
          private_notes?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          playlist_id?: string
          private_notes?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      playlist_library: {
        Row: {
          created_at: string
          playlist_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          playlist_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          playlist_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_library_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlist"
            referencedColumns: ["playlist_id"]
          },
          {
            foreignKeyName: "playlist_library_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      playlist_public: {
        Row: {
          created_at: string | null
          playlist_id: string
          playlist_name: string
          playlist_slug: string
          public_notes: string | null
          song_order: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          playlist_id: string
          playlist_name: string
          playlist_slug: string
          public_notes?: string | null
          song_order?: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          playlist_id?: string
          playlist_name?: string
          playlist_slug?: string
          public_notes?: string | null
          song_order?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_public_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: true
            referencedRelation: "playlist"
            referencedColumns: ["playlist_id"]
          },
          {
            foreignKeyName: "playlist_public_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      playlist_tag: {
        Row: {
          created_at: string
          playlist_id: string
          tag_slug: string
        }
        Insert: {
          created_at?: string
          playlist_id: string
          tag_slug: string
        }
        Update: {
          created_at?: string
          playlist_id?: string
          tag_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tag_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlist_public"
            referencedColumns: ["playlist_id"]
          },
          {
            foreignKeyName: "playlist_tag_tag_slug_fkey"
            columns: ["tag_slug"]
            isOneToOne: false
            referencedRelation: "tag"
            referencedColumns: ["tag_slug"]
          },
        ]
      }
      share: {
        Row: {
          created_at: string
          private_notes: string
          sender_user_id: string
          share_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          private_notes?: string
          sender_user_id: string
          share_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          private_notes?: string
          sender_user_id?: string
          share_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      share_library: {
        Row: {
          created_at: string
          share_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          share_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          share_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_library_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "share"
            referencedColumns: ["share_id"]
          },
          {
            foreignKeyName: "share_library_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      share_public: {
        Row: {
          created_at: string | null
          message: string | null
          recipient_user_id: string
          sender_user_id: string
          share_id: string
          shared_item_id: string
          shared_item_name: string
          shared_item_type: "song" | "playlist" | "event" | "community" | "user" | "image"
          status: "pending" | "accepted" | "rejected"
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          message?: string | null
          recipient_user_id: string
          sender_user_id: string
          share_id: string
          shared_item_id: string
          shared_item_name: string
          shared_item_type: "song" | "playlist" | "event" | "community" | "user" | "image"
          status?: "pending" | "accepted" | "rejected"
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          message?: string | null
          recipient_user_id?: string
          sender_user_id?: string
          share_id?: string
          shared_item_id?: string
          shared_item_name?: string
          shared_item_type?: "song" | "playlist" | "event" | "community" | "user" | "image"
          status?: "pending" | "accepted" | "rejected"
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_public_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "user_public"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "share_public_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "user_public"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "share_public_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: true
            referencedRelation: "share"
            referencedColumns: ["share_id"]
          },
        ]
      }
      song: {
        Row: {
          created_at: string
          private_notes: string
          song_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          private_notes: string
          song_id?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          private_notes?: string
          song_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      song_library: {
        Row: {
          created_at: string
          song_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          song_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          song_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_library_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "song_library_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      song_public: {
        Row: {
          chords: string[]
          created_at: string | null
          key: "C" | "C#" | "Db" | "D" | "D#" | "Eb" | "E" | "F" | "F#" | "Gb" | "G" | "G#" | "Ab" | "A" | "A#" | "Bb" | "B" | null
          long_credit: string | null
          lyrics: string[]
          public_notes: string | null
          scale: string | null
          script: string[]
          short_credit: string | null
          slide_order: string[]
          slides: Json
          song_id: string
          song_name: string
          song_slug: string
          translations: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chords?: string[]
          created_at?: string | null
          key?: "C" | "C#" | "Db" | "D" | "D#" | "Eb" | "E" | "F" | "F#" | "Gb" | "G" | "G#" | "Ab" | "A" | "A#" | "Bb" | "B" | null
          long_credit?: string | null
          lyrics?: string[]
          public_notes?: string | null
          scale?: string | null
          script?: string[]
          short_credit?: string | null
          slide_order: string[]
          slides: Json
          song_id: string
          song_name: string
          song_slug: string
          translations?: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chords?: string[]
          created_at?: string | null
          key?: "C" | "C#" | "Db" | "D" | "D#" | "Eb" | "E" | "F" | "F#" | "Gb" | "G" | "G#" | "Ab" | "A" | "A#" | "Bb" | "B" | null
          long_credit?: string | null
          lyrics?: string[]
          public_notes?: string | null
          scale?: string | null
          script?: string[]
          short_credit?: string | null
          slide_order?: string[]
          slides?: Json
          song_id?: string
          song_name?: string
          song_slug?: string
          translations?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_public_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: true
            referencedRelation: "song"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "song_public_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      song_tag: {
        Row: {
          created_at: string
          song_id: string
          tag_slug: string
        }
        Insert: {
          created_at?: string
          song_id: string
          tag_slug: string
        }
        Update: {
          created_at?: string
          song_id?: string
          tag_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_tag_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song_public"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "song_tag_tag_slug_fkey"
            columns: ["tag_slug"]
            isOneToOne: false
            referencedRelation: "tag"
            referencedColumns: ["tag_slug"]
          },
        ]
      }
      tag: {
        Row: {
          created_at: string
          tag_slug: string
        }
        Insert: {
          created_at?: string
          tag_slug: string
        }
        Update: {
          created_at?: string
          tag_slug?: string
        }
        Relationships: []
      }
      tag_library: {
        Row: {
          created_at: string
          tag_slug: string
          user_id: string
        }
        Insert: {
          created_at?: string
          tag_slug: string
          user_id: string
        }
        Update: {
          created_at?: string
          tag_slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_library_tag_slug_fkey"
            columns: ["tag_slug"]
            isOneToOne: false
            referencedRelation: "tag"
            referencedColumns: ["tag_slug"]
          },
          {
            foreignKeyName: "tag_library_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user: {
        Row: {
          chord_display_category: "letters" | "scale_degree"
          chord_letter_display: "standard" | "german"
          chord_scale_degree_display: "roman" | "solfege" | "sargam"
          created_at: string
          email: string
          google_calendar_access: string
          google_calendar_refresh_token: string | null
          linked_providers: string[] | null
          name: string
          role: "free" | "patron" | "admin"
          role_expires_at: string | null
          slide_number_preference: "show" | "hide"
          slide_orientation_preference: "landscape" | "portrait" | "system"
          sub: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chord_display_category?: "letters" | "scale_degree"
          chord_letter_display?: "standard" | "german"
          chord_scale_degree_display?: "roman" | "solfege" | "sargam"
          created_at?: string
          email: string
          google_calendar_access?: string
          google_calendar_refresh_token?: string | null
          linked_providers?: string[] | null
          name: string
          role?: "free" | "patron" | "admin"
          role_expires_at?: string | null
          slide_number_preference?: "show" | "hide"
          slide_orientation_preference?: "landscape" | "portrait" | "system"
          sub?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          chord_display_category?: "letters" | "scale_degree"
          chord_letter_display?: "standard" | "german"
          chord_scale_degree_display?: "roman" | "solfege" | "sargam"
          created_at?: string
          email?: string
          google_calendar_access?: string
          google_calendar_refresh_token?: string | null
          linked_providers?: string[] | null
          name?: string
          role?: "free" | "patron" | "admin"
          role_expires_at?: string | null
          slide_number_preference?: "show" | "hide"
          slide_orientation_preference?: "landscape" | "portrait" | "system"
          sub?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_library: {
        Row: {
          created_at: string
          followed_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          followed_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          followed_user_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_library_followed_user_id_fkey"
            columns: ["followed_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_library_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_public: {
        Row: {
          user_id: string
          username: string
        }
        Insert: {
          user_id: string
          username: string
        }
        Update: {
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_public_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_public_userid_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_all_valid_bcp47: { Args: { codes: string[] }; Returns: boolean }
      array_has_no_duplicates: { Args: { arr: string[] }; Returns: boolean }
      debug_jwt: {
        Args: never
        Returns: {
          jwt_text: string
          user_id_text: string
          user_text: string
        }[]
      }
      is_community_admin: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: boolean
      }
      is_community_owner: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: boolean
      }
      is_valid_bcp47: { Args: { code: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
