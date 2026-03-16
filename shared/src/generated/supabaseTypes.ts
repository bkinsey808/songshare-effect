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
          created_at: string | null
          description: string | null
          is_public: boolean
          name: string
          owner_id: string
          public_notes: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          active_event_id?: string | null
          community_id: string
          created_at?: string | null
          description?: string | null
          is_public?: boolean
          name: string
          owner_id: string
          public_notes?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          active_event_id?: string | null
          community_id?: string
          created_at?: string | null
          description?: string | null
          is_public?: boolean
          name?: string
          owner_id?: string
          public_notes?: string | null
          slug?: string
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
          shared_item_type: string
          status: string
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
          shared_item_type: string
          status?: string
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
          shared_item_type?: string
          status?: string
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
      community_user: {
        Row: {
          community_id: string
          joined_at: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          community_id: string
          joined_at?: string
          role: string
          status?: string
          user_id: string
        }
        Update: {
          community_id?: string
          joined_at?: string
          role?: string
          status?: string
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
          event_owner_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          event_owner_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          event_owner_id?: string
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
            foreignKeyName: "event_library_event_owner_id_fkey"
            columns: ["event_owner_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
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
      event_user: {
        Row: {
          event_id: string
          joined_at: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          event_id: string
          joined_at?: string
          role: string
          status?: string
          user_id: string
        }
        Update: {
          event_id?: string
          joined_at?: string
          role?: string
          status?: string
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
          image_owner_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          image_id: string
          image_owner_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          image_id?: string
          image_owner_id?: string
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
            foreignKeyName: "image_library_image_owner_id_fkey"
            columns: ["image_owner_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
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
          playlist_owner_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          playlist_id: string
          playlist_owner_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          playlist_id?: string
          playlist_owner_id?: string
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
            foreignKeyName: "playlist_library_playlist_owner_id_fkey"
            columns: ["playlist_owner_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
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
          shared_item_type: string
          status: string
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
          shared_item_type: string
          status?: string
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
          shared_item_type?: string
          status?: string
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
          song_owner_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          song_id: string
          song_owner_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          song_id?: string
          song_owner_id?: string
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
            foreignKeyName: "song_library_song_owner_id_fkey"
            columns: ["song_owner_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
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
          created_at: string | null
          fields: string[]
          key: string | null
          long_credit: string | null
          public_notes: string | null
          scale: string | null
          short_credit: string | null
          slide_order: string[]
          slides: Json
          song_id: string
          song_name: string
          song_slug: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          fields: string[]
          key?: string | null
          long_credit?: string | null
          public_notes?: string | null
          scale?: string | null
          short_credit?: string | null
          slide_order: string[]
          slides: Json
          song_id: string
          song_name: string
          song_slug: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          fields?: string[]
          key?: string | null
          long_credit?: string | null
          public_notes?: string | null
          scale?: string | null
          short_credit?: string | null
          slide_order?: string[]
          slides?: Json
          song_id?: string
          song_name?: string
          song_slug?: string
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
      user: {
        Row: {
          created_at: string
          email: string
          google_calendar_access: string
          google_calendar_refresh_token: string | null
          linked_providers: string[] | null
          name: string
          role: string
          role_expires_at: string | null
          sub: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          google_calendar_access?: string
          google_calendar_refresh_token?: string | null
          linked_providers?: string[] | null
          name: string
          role?: string
          role_expires_at?: string | null
          sub?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          email?: string
          google_calendar_access?: string
          google_calendar_refresh_token?: string | null
          linked_providers?: string[] | null
          name?: string
          role?: string
          role_expires_at?: string | null
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
