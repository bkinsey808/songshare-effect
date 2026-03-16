-- Add 'image' to the allowed shared_item_type values in share_public
-- This extends the sharing system to support image items

ALTER TABLE public.share_public
    DROP CONSTRAINT IF EXISTS share_public_shared_item_type_check;

ALTER TABLE public.share_public
    ADD CONSTRAINT share_public_shared_item_type_check
    CHECK (shared_item_type = ANY (ARRAY[
        'song'::text,
        'playlist'::text,
        'event'::text,
        'community'::text,
        'user'::text,
        'image'::text
    ]));

COMMENT ON CONSTRAINT share_public_shared_item_type_check ON public.share_public
    IS 'Restrict shared_item_type to known resource types including image';
