"use client"

import { MapPin, LayoutGrid, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { MapLegendItem } from "@/lib/map-report-payload"

interface SummaryData {
  zonesCount: number
  billboardsCount: number
  duration: string
  mapImageUrl?: string
  mapLegend?: MapLegendItem[]
  noteResume?: string
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
        <div className="mb-12">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">Aperçu</p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Résumé de la campagne</h2>
        </div>

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
                <p className="text-4xl font-bold tracking-tight text-foreground">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.suffix}</p>
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

        <Card className="overflow-hidden border-0 bg-secondary p-0">
          <div className="relative aspect-video w-full bg-muted">
            {data.mapImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL Mapbox dynamique (session PDF)
              <img
                src={data.mapImageUrl}
                alt="Carte des panneaux"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
                Carte non disponible : renseigner le GPS des panneaux et MAPBOX_ACCESS_TOKEN sur l&apos;API.
              </div>
            )}
          </div>
          {data.mapCaption ? (
            <div className="border-t border-border bg-muted/30 px-4 py-3 text-center text-sm text-muted-foreground">
              {data.mapCaption}
            </div>
          ) : null}
          {data.mapLegend && data.mapLegend.length > 0 ? (
            <div className="border-t border-border bg-card px-4 py-4 text-left print:break-inside-avoid">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                Correspondance des points sur la carte
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                Chaque repère numéroté correspond au panneau du même numéro dans le détail (01, 02, etc.).
              </p>
              <ul className="space-y-2">
                {data.mapLegend.map((row) => {
                  const usesRealGps =
                    row.pinUsesRealGps !== undefined ? row.pinUsesRealGps : row.onMap !== false
                  return (
                  <li
                    key={row.num}
                    className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-2 text-sm last:border-0"
                  >
                    <span className="flex h-7 min-w-[1.75rem] items-center justify-center rounded-md bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                      {row.numPadded}
                    </span>
                    <span className="min-w-0 flex-1 font-medium text-foreground">{row.name}</span>
                    {usesRealGps ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        sur la carte (GPS)
                      </span>
                    ) : (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200">
                        position indicative
                      </span>
                    )}
                  </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
        </Card>
      </div>
    </section>
  )
}
