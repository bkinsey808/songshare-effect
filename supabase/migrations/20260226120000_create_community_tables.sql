-- Create community private table
CREATE TABLE public.community (
    community_id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    private_notes text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (community_id),
    CONSTRAINT community_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public."user"(user_id) ON DELETE CASCADE
);

COMMENT ON TABLE public.community IS 'Private community data - only accessible by the community owner';

-- Create community public table
CREATE TABLE public.community_public (
    community_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text DEFAULT ''::text,
    is_public boolean DEFAULT false NOT NULL,
    public_notes text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (community_id),
    CONSTRAINT community_public_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.community(community_id) ON DELETE CASCADE,
    CONSTRAINT community_slug_unique UNIQUE (slug),
    CONSTRAINT community_name_format CHECK (((length(name) >= 2) AND (length(name) <= 100) AND (name = btrim(name)) AND (POSITION(('  '::text) IN (name)) = 0))),
    CONSTRAINT community_slug_format CHECK (((slug ~ '^[a-z0-9-]+$'::text) AND (slug !~ '^-'::text) AND (slug !~ '-$'::text) AND (POSITION(('--'::text) IN (slug)) = 0)))
);

COMMENT ON TABLE public.community_public IS 'Public community data. Readable by anyone, writable by owner/admin.';

-- Create community membership table
CREATE TABLE public.community_user (
    community_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'joined'::text NOT NULL,
    PRIMARY KEY (community_id, user_id),
    CONSTRAINT community_user_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.community(community_id) ON DELETE CASCADE,
    CONSTRAINT community_user_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE,
    CONSTRAINT community_user_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'community_admin'::text, 'member'::text]))),
    CONSTRAINT community_user_status_check CHECK ((status = ANY (ARRAY['invited'::text, 'joined'::text, 'left'::text, 'kicked'::text])))
);

COMMENT ON TABLE public.community_user IS 'Community members and roles.';

-- Create community events many-to-many relationship
CREATE TABLE public.community_event (
    community_id uuid NOT NULL,
    event_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (community_id, event_id),
    CONSTRAINT community_event_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.community(community_id) ON DELETE CASCADE,
    CONSTRAINT community_event_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(event_id) ON DELETE CASCADE
);

COMMENT ON TABLE public.community_event IS 'Many-to-many relationship between communities and events.';

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.community FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.community_public FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.community ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_event ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- community
CREATE POLICY "Allow read for matching owner_id" ON public.community FOR SELECT TO authenticated USING ((owner_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));

-- community_public
CREATE POLICY "Allow read access to community_public for everyone" ON public.community_public FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow owner to update own community_public" ON public.community_public FOR UPDATE USING ((owner_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid)) WITH CHECK ((owner_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));
CREATE POLICY "Allow admins to update community_public" ON public.community_public FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1 FROM public.community_user WHERE ((community_user.community_id = community_public.community_id) AND (community_user.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid) AND (community_user.role = 'community_admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1 FROM public.community_user WHERE ((community_user.community_id = community_public.community_id) AND (community_user.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid) AND (community_user.role = 'community_admin'::text)))));

-- community_user
CREATE POLICY "Users can access their own community entries" ON public.community_user FOR SELECT TO authenticated USING ((user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid));
CREATE POLICY "Admins can access all entries for their communities" ON public.community_user FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1 FROM public.community_user cu WHERE ((cu.community_id = community_user.community_id) AND (cu.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid) AND (cu.role = ANY (ARRAY['owner'::text, 'community_admin'::text]))))));

-- community_event
CREATE POLICY "Anyone can see community events" ON public.community_event FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage community events" ON public.community_event FOR ALL TO authenticated USING ((EXISTS ( SELECT 1 FROM public.community_user cu WHERE ((cu.community_id = community_event.community_id) AND (cu.user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid) AND (cu.role = ANY (ARRAY['owner'::text, 'community_admin'::text]))))));

-- Realtime
ALTER TABLE public.community_public REPLICA IDENTITY FULL;
ALTER TABLE public.community_user REPLICA IDENTITY FULL;
