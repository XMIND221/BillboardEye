import { CoverSection } from "@/components/report/cover-section"
import { SummarySection } from "@/components/report/summary-section"
import { ZoneSection } from "@/components/report/zone-section"
import { VisualSection } from "@/components/report/visual-section"
import { FooterSection } from "@/components/report/footer-section"

// Sample campaign data
const campaignData = {
  name: "Campagne Été 2024",
  date: "Mars 2024",
  summary: {
    zonesCount: 4,
    billboardsCount: 12,
    duration: "3 mois",
  },
  zones: [
    {
      id: "zone-1",
      name: "Boulevard Haussmann",
      faceAImage: "/images/billboard-1a.jpg",
      faceBImage: "/images/billboard-1b.jpg",
      gpsCoordinates: "48.8738, 2.3288",
      timestamp: "14:32",
    },
    {
      id: "zone-2",
      name: "Place de la République",
      faceAImage: "/images/billboard-2a.jpg",
      faceBImage: "/images/billboard-2b.jpg",
      gpsCoordinates: "48.8674, 2.3637",
      timestamp: "15:45",
    },
    {
      id: "zone-3",
      name: "Avenue des Champs-Élysées",
      faceAImage: "/images/billboard-3a.jpg",
      faceBImage: "/images/billboard-3b.jpg",
      gpsCoordinates: "48.8698, 2.3078",
      timestamp: "16:20",
    },
    {
      id: "zone-4",
      name: "Gare de Lyon",
      faceAImage: "/images/billboard-4a.jpg",
      faceBImage: "/images/billboard-4b.jpg",
      gpsCoordinates: "48.8443, 2.3739",
      timestamp: "17:10",
    },
  ],
  visualCaption: "Une visibilité maximale dans les zones à fort trafic de la capitale",
}

export default function CampaignReportPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Cover Section */}
      <CoverSection
        campaignName={campaignData.name}
        date={campaignData.date}
      />

      {/* Summary Section */}
      <SummarySection data={campaignData.summary} />

      {/* Zones Section */}
      <ZoneSection zones={campaignData.zones} />

      {/* Visual Section */}
      <VisualSection
        imageUrl="/images/campaign-visual.jpg"
        caption={campaignData.visualCaption}
      />

      {/* Footer Section */}
      <FooterSection />
    </main>
  )
}
