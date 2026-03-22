/**
 * Rôle métier lu depuis Supabase JWT : user.user_metadata.app_role (ou role).
 * Valeurs : gestionnaire | reporting | agent | employe | directeur
 *
 * PROJET_SCOPE_STRICT=true : sans metadata, l'utilisateur est traité comme agent (campagnes assignées uniquement).
 * PROJET_SCOPE_STRICT=false (défaut) : sans metadata, accès liste complète (rétrocompat dev).
 */
const PROJET_SCOPE_STRICT = process.env.PROJET_SCOPE_STRICT === "true";

const getAppRole = (user) => {
  if (!user) return null;
  const meta = user.user_metadata || {};
  const raw = meta.app_role ?? meta.role ?? meta.appRole;
  if (raw == null || raw === "") {
    return PROJET_SCOPE_STRICT ? "agent" : null;
  }
  const s = String(raw).toLowerCase().trim();
  if (s === "gestionnaire" || s === "directeur") return "gestionnaire";
  if (s === "reporting") return "reporting";
  if (s === "agent" || s === "employe" || s === "employee") return "agent";
  return null;
};

const canSeeAllProjets = (role) => role === "gestionnaire" || role === "reporting";

const canCreateProjet = (role) => role === "gestionnaire";

const agentCanAccessProjet = (projet, email) => {
  if (!projet || !email) return false;
  const e = String(email).trim().toLowerCase();
  const assigned = String(projet.assignedAgent || "").trim().toLowerCase();
  if (!assigned) return true;
  return assigned === e;
};

/**
 * @param {import('@supabase/supabase-js').User|null} user
 * @param {Array} projets
 */
const filterProjetsForUser = (user, projets) => {
  if (!user || !Array.isArray(projets)) return projets || [];
  const role = getAppRole(user);
  if (role === null) return projets;
  if (canSeeAllProjets(role)) return projets;
  return projets.filter((p) => agentCanAccessProjet(p, user.email));
};

module.exports = {
  getAppRole,
  canSeeAllProjets,
  canCreateProjet,
  agentCanAccessProjet,
  filterProjetsForUser,
  PROJET_SCOPE_STRICT,
};
