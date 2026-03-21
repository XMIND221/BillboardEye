import { MapPin, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import Image from "next/image"

function ZoneFaceImage({ src, alt }: { src: string; alt: string }) {
  if (!src) {
    return <div className="absolute inset-0 bg-muted" aria-hidden />
  }
  const useNative =
    src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://")
  if (useNative) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
    )
  }
  return <Image src={src} alt={alt} fill className="object-cover" />
}

interface ZoneData {
  id: string
  name: string
  faceAImage: string
  faceBImage: string
  gpsCoordinates: string
  timestamp: string
}

interface ZoneSectionProps {
  zones: ZoneData[]
}

export function ZoneSection({ zones }: ZoneSectionProps) {
  return (
    <section className="bg-secondary px-8 py-20 md:px-16">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-12">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
            Détails
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Zones de la campagne
          </h2>
        </div>

        {/* Zones Grid */}
        <div className="space-y-8">
          {zones.map((zone, index) => (
            <Card
              key={zone.id}
              className="overflow-hidden border-0 bg-background p-0 shadow-sm"
            >
              {/* Zone Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                    {(index + 1).toString().padStart(2, "0")}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {zone.name}
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {zone.gpsCoordinates}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    {zone.timestamp}
                  </span>
                </div>
              </div>

              {/* Zone Images */}
              <div className="grid gap-4 p-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="text-sm font-medium text-foreground">
                      Face A
                    </span>
                  </div>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                    <ZoneFaceImage src={zone.faceAImage} alt={`${zone.name} - Face A`} />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="text-sm font-medium text-foreground">
                      Face B
                    </span>
                  </div>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                    <ZoneFaceImage src={zone.faceBImage} alt={`${zone.name} - Face B`} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
