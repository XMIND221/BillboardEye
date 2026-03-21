"use client"

import { MapPin, LayoutGrid, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"

interface SummaryData {
  zonesCount: number
  billboardsCount: number
  duration: string
  mapImageUrl?: string
  /** Texte libre (consignes / note) sous les cartes stats */
  noteResume?: string
  /** Légende sous la carte illustrative */
  mapCaption?: string
}

interface SummarySectionProps {
  data: SummaryData
}

export function SummarySection({ data }: SummarySectionProps) {
  const stats = [
    {
      icon: MapPin,
      label: "Zones",
      value: data.zonesCount.toString(),
      suffix: "zones couvertes",
    },
    {
      icon: LayoutGrid,
      label: "Panneaux",
      value: data.billboardsCount.toString(),
      suffix: "panneaux actifs",
    },
    {
      icon: Calendar,
      label: "Durée",
      value: data.duration,
      suffix: "de campagne",
    },
  ]

  return (
    <section className="bg-background px-8 py-20 md:px-16">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-12">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
            Aperçu
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Résumé de la campagne
          </h2>
        </div>

        {/* Stats Cards */}
        <div className="mb-12 grid gap-6 md:grid-cols-3">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="group relative overflow-hidden border-0 bg-secondary p-6 transition-all hover:shadow-lg"
            >
              <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5 transition-transform group-hover:scale-110" />
              <div className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-4xl font-bold tracking-tight text-foreground">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stat.suffix}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {data.noteResume ? (
          <div className="mb-12 rounded-xl border border-border bg-card p-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Consignes & note</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{data.noteResume}</p>
          </div>
        ) : null}

        {/* Map */}
        <Card className="overflow-hidden border-0 bg-secondary p-0">
          <div className="relative aspect-[16/9] w-full bg-muted">
            {/* Map placeholder with GPS points */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-full w-full overflow-hidden rounded-lg">
                {/* Simulated map background */}
                <div className="absolute inset-0 bg-gradient-to-br from-secondary via-muted to-secondary" />
                
                {/* Grid pattern for map effect */}
                <div className="absolute inset-0 opacity-30">
                  <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/30" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                {/* GPS Points */}
                <div className="absolute left-[20%] top-[30%]">
                  <div className="relative">
                    <div className="h-4 w-4 animate-ping rounded-full bg-primary/40" />
                    <div className="absolute inset-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-lg">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                    </div>
                  </div>
                </div>
                <div className="absolute left-[45%] top-[50%]">
                  <div className="relative">
                    <div className="h-4 w-4 animate-ping rounded-full bg-primary/40" style={{ animationDelay: "0.5s" }} />
                    <div className="absolute inset-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-lg">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                    </div>
                  </div>
                </div>
                <div className="absolute left-[70%] top-[35%]">
                  <div className="relative">
                    <div className="h-4 w-4 animate-ping rounded-full bg-primary/40" style={{ animationDelay: "1s" }} />
                    <div className="absolute inset-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-lg">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                    </div>
                  </div>
                </div>
                <div className="absolute left-[55%] top-[70%]">
                  <div className="relative">
                    <div className="h-4 w-4 animate-ping rounded-full bg-primary/40" style={{ animationDelay: "1.5s" }} />
                    <div className="absolute inset-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-lg">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                    </div>
                  </div>
                </div>

                {/* Map caption */}
                <div className="absolute bottom-4 left-4 rounded-lg bg-background/90 px-4 py-2 backdrop-blur-sm">
                  <p className="max-w-md text-xs font-medium text-muted-foreground">
                    {data.mapCaption || "Distribution géographique des panneaux"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
