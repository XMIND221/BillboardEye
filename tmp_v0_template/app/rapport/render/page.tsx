import { CoverSection } from "@/components/report/cover-section"
import { SummarySection } from "@/components/report/summary-section"
import { ZoneSection } from "@/components/report/zone-section"
import { VisualSection } from "@/components/report/visual-section"
import { FooterSection } from "@/components/report/footer-section"
import { mapApiReportToCampaign } from "@/lib/map-report-payload"

export const dynamic = "force-dynamic"

type SearchParams = { token?: string }

function getInternalSecret(): string {
  return (
    process.env.PDF_RENDER_INTERNAL_SECRET ||
    (process.env.NODE_ENV !== "production" ? "dev-pdf-render-internal-secret" : "")
  )
}

async function fetchReport(token: string) {
  const secret = getInternalSecret()
  if (!secret) {
    throw new Error("PDF_RENDER_INTERNAL_SECRET manquant")
  }
  const base =
    process.env.BILLBOARD_API_INTERNAL_URL ||
    `http://127.0.0.1:${process.env.BILLBOARD_API_PORT || "5000"}`
  const url = `${base.replace(/\/$/, "")}/api/internal/pdf-render-session/${encodeURIComponent(token)}`
  const res = await fetch(url, {
    headers: {
      "x-pdf-internal": secret,
    },
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`API ${res.status}`)
  }
  const json = (await res.json()) as { success?: boolean; data?: unknown }
  if (!json.success || !json.data) {
    throw new Error("Réponse API invalide")
  }
  return json.data
}

export default async function RapportRenderPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { token } = await searchParams
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8 text-foreground">
        <p>Paramètre token manquant.</p>
      </div>
    )
  }

  let campaign
  try {
    const raw = await fetchReport(token)
    campaign = mapApiReportToCampaign(raw as Parameters<typeof mapApiReportToCampaign>[0])
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8 text-foreground">
        <p>Impossible de charger le rapport (session expirée ou serveur API injoignable).</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background print:bg-background">
      <CoverSection
        campaignName={campaign.campaignName}
        date={campaign.date}
        clientLine={campaign.clientLine}
      />
      <SummarySection data={campaign.summary} />
      <ZoneSection zones={campaign.zones} />
      <VisualSection imageUrl={campaign.visualImageUrl} caption={campaign.visualCaption} />
      <FooterSection />
    </main>
  )
}
