import { VariantWaouhAgence, type PDFData } from "@/components/pdf/variant-waouh-agence";

// Demo data - replace with your actual data
const demoData: PDFData = {
  campaignName: "Campagne Bégué Confiseri",
  clientLine: "Pour Bégué Confiseri",
  zoneLine: "Région Dakar • Affichage Grand Format",
  date: "Mars 2024",
  coverLogos: {
    client: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-x1ViQKu0BcIerj8Zq8gdrsTsSuVPPP.png",
    entreprise: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-UBnv4nBvpOQ7lu9ZXoxQw8WV4mLmRx.png",
  },
  stats: {
    zonesCount: 12,
    billboardsCount: 24,
    duration: "3 mois",
  },
  noteResume:
    "Cette campagne d'affichage couvre les principales artères de la région de Dakar avec une visibilité optimale sur les axes à fort trafic.\n\nLes emplacements ont été sélectionnés pour maximiser l'impact visuel et la mémorisation de la marque Bégué auprès des consommateurs cibles.",
  zones: [
    {
      index: 1,
      name: "Champs-Élysées Nord",
      gpsCoordinates: "48.8698° N, 2.3075° E",
      timestamp: "15 Mars 2024 • 09:30",
      faceALabel: "Face A - Avenue",
      faceBLabel: "Face B - Rue latérale",
      faceAImage: undefined,
      faceBImage: undefined,
    },
    {
      index: 2,
      name: "La Défense - Parvis",
      gpsCoordinates: "48.8918° N, 2.2362° E",
      timestamp: "15 Mars 2024 • 11:45",
      faceALabel: "Face A - Esplanade",
      faceBLabel: "Face B - Centre commercial",
      faceAImage: undefined,
      faceBImage: undefined,
    },
    {
      index: 3,
      name: "Gare de Lyon",
      gpsCoordinates: "48.8443° N, 2.3734° E",
      timestamp: "16 Mars 2024 • 08:15",
      faceALabel: "Face A - Hall principal",
      faceBLabel: "Face B - Quais",
      faceAImage: undefined,
      faceBImage: undefined,
    },
    {
      index: 4,
      name: "Montmartre - Place du Tertre",
      gpsCoordinates: "48.8867° N, 2.3406° E",
      timestamp: "16 Mars 2024 • 14:20",
      faceALabel: "Face A - Place",
      faceBLabel: "Face B - Rue adjacente",
      faceAImage: undefined,
      faceBImage: undefined,
    },
  ],
  closing: {
    heading: "Merci pour votre confiance",
    body: "Nous restons à votre disposition pour toute question concernant cette campagne. Notre équipe est mobilisée pour assurer le succès de votre communication.",
    signatureLabel: "Votre contact dédié",
    signatureValue: "Jean-Pierre Dupont",
  },
  footerBrand: "WAOUH!",
  footerNote: "Rapport généré automatiquement par BillboardEye",
  primaryColor: "#c24632", // WAOUH brand red
};

export default function PDFPreviewPage() {
  return <VariantWaouhAgence data={demoData} />;
}
