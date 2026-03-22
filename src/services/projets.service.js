const { randomUUID } = require("crypto");
const supabase = require("../config/supabase");

const formatSupabaseError = (context, error) => {
  const cleanError = new Error(`Erreur Supabase (${context}): ${error.message}`);
  cleanError.code = "SUPABASE_ERROR";
  cleanError.details = error;
  return cleanError;
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
    clientLogoUrl: row.client_logo_url || row.clientLogoUrl || "",
    entrepriseLogoUrl: row.entreprise_logo_url || row.entrepriseLogoUrl || "",
    couleurPrincipale: row.couleur_principale || row.couleurPrincipale || "#E11D48",
    titreRapport: row.titre_rapport || row.titreRapport || "",
    assignedAgent: row.assigned_agent || row.assignedAgent || "",
    /** planned | active | completed | archived */
    statut: row.statut || "active",
  };
};

const createProjet = async (data) => {
  const isoDate = data.date ? new Date(data.date).toISOString() : new Date().toISOString();

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
    client_logo_url: data.clientLogoUrl || "",
    entreprise_logo_url: data.entrepriseLogoUrl || "",
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
    clientLogoUrl: data.clientLogoUrl || "",
    entrepriseLogoUrl: data.entrepriseLogoUrl || "",
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

module.exports = {
  createProjet,
  getAllProjets,
  getProjetById,
};
