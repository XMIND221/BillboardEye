/**
 * Messages API affichables — évite d’exposer des URLs techniques en production.
 */

function isNetworkLikeError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return (
    message.includes("network request failed") ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("econnrefused") ||
    message.includes("aborted")
  );
}

/**
 * @param {unknown} error
 * @returns {string}
 */
export function mapUserFacingApiMessage(error) {
  if (isNetworkLikeError(error)) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      return "Impossible de contacter le serveur. Vérifiez l’URL API (tunnel / réseau).";
    }
    return "Impossible de contacter le serveur. Vérifiez votre connexion internet.";
  }

  const raw = String(error?.message || error || "").trim();
  if (!raw) return "Une erreur est survenue. Réessayez dans un instant.";

  if (raw.includes("503") || raw.toLowerCase().includes("indisponible")) {
    return "Le serveur est momentanément indisponible. Réessayez plus tard.";
  }

  if (raw.toLowerCase().includes("unauthorized") || raw.includes("401")) {
    return "Session expirée ou non autorisée. Reconnectez-vous.";
  }

  // Ne pas renvoyer de longues traces techniques
  if (raw.length > 280) {
    return "Réponse serveur inattendue. Réessayez ou contactez le support.";
  }

  return raw;
}
