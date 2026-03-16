-- Create image tables following the established public/private/library pattern
-- image: private metadata (owner only)
-- image_public: public metadata (all authenticated users)
-- image_library: user's bookmarked images
--
-- 🔐 SECURITY MODEL
-- =================
-- - image: Only owner can read; INSERT/UPDATE/DELETE via API only
-- - image_public: Any authenticated user can read; INSERT/UPDATE/DELETE via API only
-- - image_library: Users can only access their own entries; INSERT/UPDATE/DELETE via API only

-- ============================================================================
-- TABLE: image (private metadata)
-- ============================================================================

CREATE TABLE public.image (
    image_id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    private_notes text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.image
    ADD CONSTRAINT image_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

CREATE INDEX image_user_id_idx ON public.image USING btree (user_id);

ALTER TABLE public.image ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for matching user_id" ON public.image
    FOR SELECT TO authenticated
    USING (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

CREATE POLICY "Deny all mutations on image" ON public.image
    TO authenticated, anon USING (false) WITH CHECK (false);

COMMENT ON TABLE public.image IS 'Private image data - only accessible by the image owner';
COMMENT ON COLUMN public.image.image_id IS 'Unique identifier for the image';
COMMENT ON COLUMN public.image.user_id IS 'The user who owns this image';
COMMENT ON COLUMN public.image.private_notes IS 'Private notes visible only to the owner';

-- ============================================================================
-- TABLE: image_public (public metadata + R2 reference)
-- ============================================================================

CREATE TABLE public.image_public (
    image_id uuid NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    image_name text NOT NULL DEFAULT '',
    image_slug text NOT NULL DEFAULT '',
    description text NOT NULL DEFAULT '',
    alt_text text NOT NULL DEFAULT '',
    r2_key text NOT NULL,
    content_type text NOT NULL DEFAULT 'image/jpeg',
    file_size integer NOT NULL DEFAULT 0,
    width integer,
    height integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.image_public
    ADD CONSTRAINT image_public_image_id_fkey
    FOREIGN KEY (image_id) REFERENCES public.image(image_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.image_public
    ADD CONSTRAINT image_public_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.image_public
    ADD CONSTRAINT image_public_image_slug_key UNIQUE (image_slug);

CREATE INDEX image_public_user_id_idx ON public.image_public USING btree (user_id);
CREATE INDEX image_public_image_slug_idx ON public.image_public USING btree (image_slug);

ALTER TABLE ONLY public.image_public REPLICA IDENTITY FULL;

ALTER TABLE public.image_public ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON public.image_public
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Deny all mutations on image_public" ON public.image_public
    TO authenticated, anon USING (false) WITH CHECK (false);

COMMENT ON TABLE public.image_public IS 'Public image metadata - readable by all authenticated users';
COMMENT ON COLUMN public.image_public.r2_key IS 'Cloudflare R2 storage key for the image file';
COMMENT ON COLUMN public.image_public.content_type IS 'MIME type of the image (e.g. image/jpeg, image/png)';
COMMENT ON COLUMN public.image_public.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.image_public.width IS 'Image width in pixels (optional)';
COMMENT ON COLUMN public.image_public.height IS 'Image height in pixels (optional)';

-- ============================================================================
-- TABLE: image_library (user bookmarks)
-- ============================================================================

CREATE TABLE public.image_library (
    user_id uuid NOT NULL,
    image_id uuid NOT NULL,
    image_owner_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id, image_id)
);

ALTER TABLE ONLY public.image_library
    ADD CONSTRAINT image_library_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.image_library
    ADD CONSTRAINT image_library_image_id_fkey
    FOREIGN KEY (image_id) REFERENCES public.image_public(image_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.image_library
    ADD CONSTRAINT image_library_image_owner_id_fkey
    FOREIGN KEY (image_owner_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

CREATE INDEX image_library_user_id_idx ON public.image_library USING btree (user_id);
CREATE INDEX image_library_image_id_idx ON public.image_library USING btree (image_id);

ALTER TABLE ONLY public.image_library REPLICA IDENTITY FULL;

ALTER TABLE public.image_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for matching user_id" ON public.image_library
    FOR SELECT TO authenticated
    USING (user_id = ((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text))::uuid);

CREATE POLICY "Deny all mutations on image_library" ON public.image_library
    TO authenticated, anon USING (false) WITH CHECK (false);

COMMENT ON TABLE public.image_library IS 'User image bookmarks / collection';
COMMENT ON COLUMN public.image_library.image_owner_id IS 'Owner of the image (denormalized for efficient queries)';
