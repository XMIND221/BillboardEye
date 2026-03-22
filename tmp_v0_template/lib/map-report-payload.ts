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

export type MapLegendItem = {
  num: number
  numPadded: string
  name: string
  /** @deprecated utiliser pinUsesRealGps */
  onMap?: boolean
  /** true = coordonnées réelles ; false = position indicative (sans GPS) */
  pinUsesRealGps?: boolean
}

type ApiReport = {
  projet?: Record<string, unknown>
  panneaux?: Array<Record<string, unknown>>
  summary?: { total?: number }
  /** Renseigné par l’API à la création de session PDF (carte Mapbox + légende) */
  __renderExtras?: {
    mapImageUrl?: string
    mapCaption?: string
    mapLegend?: MapLegendItem[]
    coverClientLogoDataUri?: string
    coverEntrepriseLogoDataUri?: string
    coverHasCampaignLogos?: boolean
  }
}

const DEFAULT_VISUAL_CAPTION =
  "Une visibilité maximale dans les zones à fort trafic."
const DEFAULT_MAP_CAPTION = "Distribution géographique des panneaux"

export function mapApiReportToCampaign(report: ApiReport) {
  const projet = report.projet || {}
  const panneaux = report.panneaux || []

  const zones = panneaux.map((p, index) => {
    const photos = (p.photos || {}) as Record<string, { url?: string; createdAt?: string } | undefined>
    const faceA = photos.faceA?.url || PLACEHOLDER
    const faceB = photos.faceB?.url || PLACEHOLDER
    const loc = (p.localisation || {}) as Record<string, unknown>
    const nomGestion = String((p as { nomZone?: string }).nomZone ?? (p as { nom_zone?: string }).nom_zone ?? "").trim()
    return {
      id: String(p.id || `zone-${index}`),
      name: nomGestion || String(loc.adresse || `Zone ${index + 1}`),
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

  const legendeV = projet.legendeVisuelle ?? projet.legende_visuelle
  const legendeC = projet.legendeCarte ?? projet.legende_carte
  const instructions = projet.instructions ? String(projet.instructions).trim() : ""

  const extras = report.__renderExtras
  const mapFromApi = extras?.mapImageUrl && String(extras.mapImageUrl).trim() ? String(extras.mapImageUrl).trim() : undefined
  const captionFromApi =
    extras?.mapCaption && String(extras.mapCaption).trim() ? String(extras.mapCaption).trim() : undefined
  const legendFromApi = Array.isArray(extras?.mapLegend) ? extras.mapLegend : undefined

  const cLogo =
    extras?.coverClientLogoDataUri && String(extras.coverClientLogoDataUri).trim()
      ? String(extras.coverClientLogoDataUri).trim()
      : undefined
  const eLogo =
    extras?.coverEntrepriseLogoDataUri && String(extras.coverEntrepriseLogoDataUri).trim()
      ? String(extras.coverEntrepriseLogoDataUri).trim()
      : undefined
  const coverHasCampaignLogos = Boolean(
    extras?.coverHasCampaignLogos ?? (cLogo || eLogo),
  )

  return {
    campaignName: String(projet.titreRapport || projet.nom || "Rapport campagne"),
    date: formatReportDate(projet.date),
    clientLine: projet.entreprise ? `Client : ${projet.entreprise}` : undefined,
    /** Sous-titre optionnel (zone géographique) sous le client sur la couverture */
    zoneLine: projet.zone ? String(projet.zone).trim() : undefined,
    coverHasCampaignLogos,
    coverClientLogoDataUri: cLogo,
    coverEntrepriseLogoDataUri: eLogo,
    summary: {
      zonesCount: panneaux.length,
      billboardsCount: panneaux.length,
      duration: String(projet.duree || "N/R"),
      /** Note / consignes affichées dans le résumé (bloc texte) */
      noteResume: instructions || undefined,
      /** Légende sous la carte */
      mapCaption: captionFromApi || (legendeC ? String(legendeC) : DEFAULT_MAP_CAPTION),
      /** URL image Mapbox (serveur API) */
      mapImageUrl: mapFromApi,
      /** Correspondance numéros ↔ noms de zones */
      mapLegend: legendFromApi,
    },
    zones,
    visualImageUrl: firstPhoto,
    visualCaption: legendeV ? String(legendeV) : DEFAULT_VISUAL_CAPTION,
  }
}
