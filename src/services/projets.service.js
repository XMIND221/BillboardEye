const { randomUUID } = require("crypto");
const supabase = require("../config/supabase");
const { uploadLogoFromDataUri } = require("./photos.service");

/**
 * URL https inchangée ; data:image/... uploadée automatiquement vers Supabase ;
 * file:// ou texte invalide ignoré (chaîne vide).
 */
const resolveLogoInput = async (raw) => {
  if (raw == null) return "";
  const t = String(raw).trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  if (t.toLowerCase().startsWith("data:image/")) {
    try {
      const url = await uploadLogoFromDataUri(t);
      return url || "";
    } catch {
      return "";
    }
  }
  return "";
};

const formatSupabaseError = (context, error) => {
  const cleanError = new Error(`Erreur Supabase (${context}): ${error.message}`);
  cleanError.code = "SUPABASE_ERROR";
  cleanError.details = error;
  return cleanError;
};

/** Ignore file://, chemins relatifs et autres valeurs non publiques (anciennes données). */
const sanitizeStoredLogoUrl = (raw) => {
  if (raw == null) return "";
  const t = String(raw).trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return "";
};

const normalizeProjet = (row) => {
  return {
    id: row.id,
    nom: row.nom,
    entreprise: row.entreprise,
    zone: row.zone || "",
    date: row.date,
    duree: row.duree || row.duration || "",
    instructions: row.instructions || "",
    legendeVisuelle: row.legende_visuelle || row.legendeVisuelle || "",
    legendeCarte: row.legende_carte || row.legendeCarte || "",
    clientLogoUrl: sanitizeStoredLogoUrl(row.client_logo_url || row.clientLogoUrl),
    entrepriseLogoUrl: sanitizeStoredLogoUrl(row.entreprise_logo_url || row.entrepriseLogoUrl),
    couleurPrincipale: row.couleur_principale || row.couleurPrincipale || "#E11D48",
    titreRapport: row.titre_rapport || row.titreRapport || "",
    assignedAgent: row.assigned_agent || row.assignedAgent || "",
    /** planned | active | completed | archived */
    statut: row.statut || "active",
  };
};

const createProjet = async (data) => {
  const isoDate = data.date ? new Date(data.date).toISOString() : new Date().toISOString();

  const clientLogoResolved = await resolveLogoInput(data.clientLogoUrl || data.clientLogoDataUri);
  const entrepriseLogoResolved = await resolveLogoInput(data.entrepriseLogoUrl || data.entrepriseLogoDataUri);

  const fullPayloadSnakeCase = {
    id: data.id || randomUUID(),
    nom: data.nom,
    entreprise: data.entreprise,
    zone: data.zone || "",
    date: isoDate,
    duree: data.duree || "",
    instructions: data.instructions || "",
    legende_visuelle: data.legendeVisuelle || "",
    legende_carte: data.legendeCarte || "",
    client_logo_url: clientLogoResolved,
    entreprise_logo_url: entrepriseLogoResolved,
    couleur_principale: data.couleurPrincipale || "#2563EB",
    titre_rapport: data.titreRapport || "",
    assigned_agent: data.assignedAgent || "",
    statut: data.statut || "active",
  };

  const fullPayloadCamelCase = {
    id: fullPayloadSnakeCase.id,
    nom: fullPayloadSnakeCase.nom,
    entreprise: fullPayloadSnakeCase.entreprise,
    zone: fullPayloadSnakeCase.zone,
    date: fullPayloadSnakeCase.date,
    duree: fullPayloadSnakeCase.duree,
    instructions: fullPayloadSnakeCase.instructions,
    legendeVisuelle: data.legendeVisuelle || "",
    legendeCarte: data.legendeCarte || "",
    clientLogoUrl: clientLogoResolved,
    entrepriseLogoUrl: entrepriseLogoResolved,
    couleurPrincipale: data.couleurPrincipale || "#2563EB",
    titreRapport: data.titreRapport || "",
    assignedAgent: data.assignedAgent || "",
    statut: data.statut || "active",
  };

  const minimalPayload = {
    id: fullPayloadSnakeCase.id,
    nom: fullPayloadSnakeCase.nom,
    entreprise: fullPayloadSnakeCase.entreprise,
    zone: fullPayloadSnakeCase.zone,
    date: fullPayloadSnakeCase.date,
  };

  const payloadVariants = [fullPayloadSnakeCase, fullPayloadCamelCase, minimalPayload];

  let inserted = null;
  let error = null;

  for (const payload of payloadVariants) {
    ({ data: inserted, error } = await supabase.from("projets").insert(payload).select().single());
    if (!error) {
      break;
    }
  }

  if (error) {
    throw formatSupabaseError("createProjet", error);
  }

  return normalizeProjet(inserted);
};

const getAllProjets = async () => {
  const { data, error } = await supabase.from("projets").select("*").order("date", { ascending: false });

  if (error) {
    throw formatSupabaseError("getAllProjets", error);
  }

  return data.map(normalizeProjet);
};

const getProjetById = async (id) => {
  const { data, error } = await supabase.from("projets").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw formatSupabaseError("getProjetById", error);
  }

  if (!data) {
    return null;
  }

  return normalizeProjet(data);
};

const updateProjet = async (id, data) => {
  const existing = await getProjetById(id);
  if (!existing) return null;

  const isoDate = data.date != null ? new Date(data.date).toISOString() : existing.date;

  let clientLogoUrl = existing.clientLogoUrl;
  if (data.clientLogoDataUri != null || (data.clientLogoUrl !== undefined && data.clientLogoUrl !== "")) {
    clientLogoUrl = await resolveLogoInput(data.clientLogoUrl ?? data.clientLogoDataUri ?? "");
  } else if (data.clientLogoUrl === "") {
    clientLogoUrl = "";
  }

  let entrepriseLogoUrl = existing.entrepriseLogoUrl;
  if (data.entrepriseLogoDataUri != null || (data.entrepriseLogoUrl !== undefined && data.entrepriseLogoUrl !== "")) {
    entrepriseLogoUrl = await resolveLogoInput(data.entrepriseLogoUrl ?? data.entrepriseLogoDataUri ?? "");
  } else if (data.entrepriseLogoUrl === "") {
    entrepriseLogoUrl = "";
  }

  const patchSnake = {
    nom: data.nom != null ? data.nom : existing.nom,
    entreprise: data.entreprise != null ? data.entreprise : existing.entreprise,
    zone: data.zone !== undefined ? data.zone || "" : existing.zone || "",
    date: isoDate,
    duree: data.duree !== undefined ? data.duree || "" : existing.duree || "",
    instructions: data.instructions !== undefined ? data.instructions || "" : existing.instructions || "",
    legende_visuelle: data.legendeVisuelle !== undefined ? data.legendeVisuelle || "" : existing.legendeVisuelle || "",
    legende_carte: data.legendeCarte !== undefined ? data.legendeCarte || "" : existing.legendeCarte || "",
    client_logo_url: clientLogoUrl,
    entreprise_logo_url: entrepriseLogoUrl,
    couleur_principale: data.couleurPrincipale != null ? data.couleurPrincipale : existing.couleurPrincipale || "#E11D48",
    titre_rapport: data.titreRapport !== undefined ? data.titreRapport || "" : existing.titreRapport || "",
    assigned_agent: data.assignedAgent !== undefined ? data.assignedAgent || "" : existing.assignedAgent || "",
    statut: data.statut != null ? data.statut : existing.statut || "active",
  };

  const { data: updated, error } = await supabase.from("projets").update(patchSnake).eq("id", id).select().single();

  if (error) {
    throw formatSupabaseError("updateProjet", error);
  }

  return normalizeProjet(updated);
};

const deleteProjet = async (id) => {
  const { error } = await supabase.from("projets").delete().eq("id", id);
  if (error) {
    throw formatSupabaseError("deleteProjet", error);
  }
  return true;
};

const { getPanneauxByProjetId, createPanneau } = require("./panneaux.service");

/**
 * Duplique une campagne et recrée les panneaux liés (nouveaux IDs, statut pending).
 */
const duplicateProjet = async (sourceId) => {
  const source = await getProjetById(sourceId);
  if (!source) return null;

  const baseName = String(source.nom || "Campagne").trim();
  const newProjet = await createProjet({
    nom: `${baseName} (copie)`,
    entreprise: source.entreprise,
    zone: source.zone || "",
    duree: source.duree || "",
    instructions: source.instructions || "",
    legendeVisuelle: source.legendeVisuelle || "",
    legendeCarte: source.legendeCarte || "",
    clientLogoUrl: source.clientLogoUrl || undefined,
    entrepriseLogoUrl: source.entrepriseLogoUrl || undefined,
    couleurPrincipale: source.couleurPrincipale || "#E11D48",
    titreRapport: source.titreRapport ? `${String(source.titreRapport).trim()} (copie)` : `${baseName} (copie)`,
    assignedAgent: source.assignedAgent || "",
    statut: "active",
  });

  const panels = await getPanneauxByProjetId(sourceId);
  for (const pan of panels) {
    const lat = pan.localisation?.latitude;
    const lng = pan.localisation?.longitude;
    if (lat == null || lng == null) continue;
    const la = Number(lat);
    const lo = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(lo)) continue;
    try {
      await createPanneau({
        entreprise: pan.entreprise,
        nomZone: pan.nomZone,
        latitude: la,
        longitude: lo,
        adresse: pan.localisation?.adresse,
        nombreFaces: pan.nombreFaces ?? 1,
        statut: "pending",
        projetId: newProjet.id,
      });
    } catch (e) {
      console.warn("[duplicateProjet] panneau ignoré:", e?.message || e);
    }
  }

  return newProjet;
};

module.exports = {
  createProjet,
  getAllProjets,
  getProjetById,
  updateProjet,
  deleteProjet,
  duplicateProjet,
};
