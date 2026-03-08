CREATE TABLE public.community_song (
    community_id uuid NOT NULL,
    song_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (community_id, song_id),
    CONSTRAINT community_song_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.community(community_id) ON DELETE CASCADE,
    CONSTRAINT community_song_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.song(song_id) ON DELETE CASCADE
);

COMMENT ON TABLE public.community_song IS 'Songs associated with a community.';

CREATE TABLE public.community_playlist (
    community_id uuid NOT NULL,
    playlist_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (community_id, playlist_id),
    CONSTRAINT community_playlist_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.community(community_id) ON DELETE CASCADE,
    CONSTRAINT community_playlist_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlist(playlist_id) ON DELETE CASCADE
);

COMMENT ON TABLE public.community_playlist IS 'Playlists associated with a community.';

CREATE TABLE public.community_share_request (
    request_id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    community_id uuid NOT NULL,
    sender_user_id uuid NOT NULL,
    shared_item_type text NOT NULL CHECK (shared_item_type = ANY (ARRAY['song'::text, 'playlist'::text])),
    shared_item_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])),
    message text DEFAULT ''::text,
    reviewed_by_user_id uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT community_share_request_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.community(community_id) ON DELETE CASCADE,
    CONSTRAINT community_share_request_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE,
    CONSTRAINT community_share_request_reviewed_by_user_id_fkey FOREIGN KEY (reviewed_by_user_id) REFERENCES public."user"(user_id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX community_share_request_pending_unique_idx
    ON public.community_share_request (community_id, sender_user_id, shared_item_type, shared_item_id)
    WHERE status = 'pending';

CREATE INDEX community_share_request_community_id_idx
    ON public.community_share_request (community_id, status, created_at DESC);

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.community_share_request
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.community_song ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_playlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_share_request ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can see community songs" ON public.community_song
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can see community playlists" ON public.community_playlist
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Members can read community share requests they sent or manage" ON public.community_share_request
    FOR SELECT TO authenticated
    USING (
        sender_user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
        OR EXISTS (
            SELECT 1
            FROM public.community_user cu
            WHERE cu.community_id = community_share_request.community_id
              AND cu.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid
              AND cu.role = ANY (ARRAY['owner'::text, 'community_admin'::text])
        )
    );

CREATE POLICY "Deny direct community song mutations" ON public.community_song
    TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny direct community playlist mutations" ON public.community_playlist
    TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny direct community share request mutations" ON public.community_share_request
    TO authenticated, anon USING (false) WITH CHECK (false);
