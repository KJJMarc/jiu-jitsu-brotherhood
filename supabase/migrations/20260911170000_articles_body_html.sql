-- Additive TipTap HTML body for articles CMS.
-- Keeps body_paragraphs for legacy/public fallback; does not rewrite content.

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS body_html text NULL;

COMMENT ON COLUMN public.articles.body_html IS
  'Optional TipTap HTML body for admin editing; null falls back to body_paragraphs.';

-- Backfill simple paragraph HTML from existing plain-text paragraphs.
UPDATE public.articles
SET body_html = (
  SELECT string_agg(
    '<p>' || replace(replace(replace(p, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</p>',
    ''
    ORDER BY ordinality
  )
  FROM unnest(body_paragraphs) WITH ORDINALITY AS u(p, ordinality)
)
WHERE body_html IS NULL
  AND body_paragraphs IS NOT NULL
  AND cardinality(body_paragraphs) > 0;
