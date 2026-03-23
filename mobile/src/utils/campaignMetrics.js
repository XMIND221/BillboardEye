import { getProjetReport } from "../services/api";

/**
 * Enrichit chaque campagne avec total / completed / progress / status (rapport projet).
 * Appels en parallèle (pas de N+1 séquentiel).
 * @param {Array<{ id: string, [k: string]: unknown }>} campaigns
 */
export async function attachReportMetricsToCampaigns(campaigns) {
  if (!campaigns?.length) return [];

  const rows = await Promise.all(
    campaigns.map(async (campaign) => {
      try {
        const report = await getProjetReport(campaign.id);
        const total = report?.summary?.total ?? 0;
        const completed = report?.summary?.completed ?? 0;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        let status = "Vide";
        if (total > 0) {
          status = completed >= total ? "Terminée" : "En cours";
        }
        return { ...campaign, total, completed, progress, status };
      } catch (_e) {
        return { ...campaign, total: 0, completed: 0, progress: 0, status: "—" };
      }
    }),
  );

  return rows;
}
