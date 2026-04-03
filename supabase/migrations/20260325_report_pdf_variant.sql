-- Modèle de rapport PDF par campagne (Handlebars : default | a | b | c)
ALTER TABLE projets ADD COLUMN IF NOT EXISTS report_pdf_variant text NOT NULL DEFAULT 'default';

COMMENT ON COLUMN projets.report_pdf_variant IS 'Template PDF: default (historique), a (editorial), b (corporate), c (premium)';
