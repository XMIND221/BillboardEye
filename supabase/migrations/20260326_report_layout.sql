ALTER TABLE projets
ADD COLUMN IF NOT EXISTS report_layout jsonb NOT NULL DEFAULT '{"sections":[]}'::jsonb;

COMMENT ON COLUMN projets.report_layout IS 'Layout de l''editeur visuel (visibilite/suppression des sections).';
