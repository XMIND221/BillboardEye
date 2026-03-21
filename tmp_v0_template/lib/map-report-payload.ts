export function formatReportDate(date: unknown): string {
  if (!date) return "Non renseignée"
  const d = new Date(date as string)
  if (Number.isNaN(d.getTime())) return String(date)
  return d.toLocaleDateString("fr-FR")
}

export function formatTime(raw: unknown): string {
  if (!raw) return "--:--"
  const d = new Date(raw as string)
  if (Number.isNaN(d.getTime())) return "--:--"
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

function formatGps(lat: unknown, lng: unknown): string {
  if (lat == null || lng == null) return "N/A"
  return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`
}

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='100%25' height='100%25'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14' font-family='sans-serif'%3EPhoto indisponible%3C/text%3E%3C/svg%3E"

type ApiReport = {
  projet?: Record<string, unknown>
  panneaux?: Array<Record<string, unknown>>
  summary?: { total?: number }
}

export function mapApiReportToCampaign(report: ApiReport) {
  const projet = report.projet || {}
  const panneaux = report.panneaux || []

  const zones = panneaux.map((p, index) => {
    const photos = (p.photos || {}) as Record<string, { url?: string; createdAt?: string } | undefined>
    const faceA = photos.faceA?.url || PLACEHOLDER
    const faceB = photos.faceB?.url || PLACEHOLDER
    const loc = (p.localisation || {}) as Record<string, unknown>
    return {
      id: String(p.id || `zone-${index}`),
      name: String(loc.adresse || `Zone ${index + 1}`),
      faceAImage: faceA,
      faceBImage: faceB,
      gpsCoordinates: formatGps(loc.latitude, loc.longitude),
      timestamp: formatTime(photos.faceA?.createdAt || photos.faceB?.createdAt),
    }
  })

  const firstPhoto =
    zones.find((z) => z.faceAImage !== PLACEHOLDER)?.faceAImage ||
    zones.find((z) => z.faceBImage !== PLACEHOLDER)?.faceBImage ||
    PLACEHOLDER

  return {
    campaignName: String(projet.titreRapport || projet.nom || "Rapport campagne"),
    date: formatReportDate(projet.date),
    clientLine: projet.entreprise ? `Client : ${projet.entreprise}` : undefined,
    summary: {
      zonesCount: panneaux.length,
      billboardsCount: Number(report.summary?.total ?? panneaux.length),
      duration: String(projet.duree || "N/R"),
    },
    zones,
    visualImageUrl: firstPhoto,
    visualCaption: "Une visibilité maximale dans les zones à fort trafic.",
  }
}
