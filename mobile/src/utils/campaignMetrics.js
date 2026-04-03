import { getProjetReport } from "../services/api";

/**
 * Enrichit chaque campagne avec total / completed / progress / status (rapport projet).
 * Appels en parallèle (pas de N+1 séquentiel).
 * @param {Array<{ id: string, [k: string]: unknown }>} campaigns
 */
const METRICS_TTL_MS = 2 * 60 * 1000;
const MAX_CONCURRENT_REQUESTS = 4;
const metricsCache = new Map();

function computeMetrics(report) {
  const total = report?.summary?.total ?? 0;
  const completed = report?.summary?.completed ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  let status = "Vide";
  if (total > 0) status = completed >= total ? "Terminée" : "En cours";
  return { total, completed, progress, status };
}

function getFallbackMetrics() {
  return { total: 0, completed: 0, progress: 0, status: "—" };
}

function getCachedMetrics(campaignId) {
  if (!campaignId) return null;
  const entry = metricsCache.get(campaignId);
  if (!entry) return null;
  const isFresh = Date.now() - entry.updatedAt <= METRICS_TTL_MS;
  return isFresh ? entry.metrics : null;
}

function getLastKnownMetrics(campaignId) {
  if (!campaignId) return null;
  return metricsCache.get(campaignId)?.metrics || null;
}

function applyMetrics(campaign, metrics) {
  return { ...campaign, ...(metrics || getFallbackMetrics()) };
}

function attachCachedMetrics(campaigns) {
  return (campaigns || []).map((campaign) => {
    const cached = getCachedMetrics(campaign.id) || getLastKnownMetrics(campaign.id);
    return applyMetrics(campaign, cached);
  });
}

async function fetchAndCacheCampaignMetrics(campaignId) {
  try {
    const report = await getProjetReport(campaignId);
    const metrics = computeMetrics(report);
    metricsCache.set(campaignId, { metrics, updatedAt: Date.now() });
    return metrics;
  } catch (_e) {
    const fallback = getFallbackMetrics();
    metricsCache.set(campaignId, { metrics: fallback, updatedAt: Date.now() });
    return fallback;
  }
}

async function runWithConcurrency(items, worker, concurrency = MAX_CONCURRENT_REQUESTS) {
  const queue = Array.isArray(items) ? items : [];
  if (!queue.length) return;

  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (index < queue.length) {
      const current = queue[index];
      index += 1;
      // eslint-disable-next-line no-await-in-loop
      await worker(current);
    }
  });

  await Promise.all(workers);
}

export async function warmReportMetricsCache(campaigns) {
  const missingOrStaleIds = (campaigns || [])
    .map((c) => c?.id)
    .filter(Boolean)
    .filter((id) => !getCachedMetrics(id));

  await runWithConcurrency(missingOrStaleIds, fetchAndCacheCampaignMetrics);
}

export function attachCachedReportMetricsToCampaigns(campaigns) {
  return attachCachedMetrics(campaigns);
}

export async function attachReportMetricsToCampaigns(campaigns) {
  if (!campaigns?.length) return [];
  const seeded = attachCachedMetrics(campaigns);
  await warmReportMetricsCache(campaigns);
  return attachCachedMetrics(seeded);
}
