import { Eye } from "lucide-react"

interface CoverSectionProps {
  campaignName: string
  date: string
  /** Ligne optionnelle sous le titre (ex. client) */
  clientLine?: string
}

export function CoverSection({ campaignName, date, clientLine }: CoverSectionProps) {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center bg-background px-8 py-16">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5" />
        <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary/3" />
      </div>

      {/* Red accent line at top */}
      <div className="absolute left-0 right-0 top-0 h-1.5 bg-primary" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo */}
        <div className="mb-12 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Eye className="h-8 w-8 text-primary-foreground" />
          </div>
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            BillboardEye
          </span>
        </div>

        {/* Title */}
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
          Rapport de campagne
        </p>

        <h1 className="mb-8 max-w-2xl text-balance text-5xl font-bold tracking-tight text-foreground md:text-6xl">
          {campaignName}
        </h1>

        {clientLine ? (
          <p className="mb-6 max-w-xl text-center text-base text-muted-foreground">{clientLine}</p>
        ) : null}

        {/* Date */}
        <div className="flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            {date}
          </span>
        </div>
      </div>

      {/* Red accent line at bottom */}
      <div className="absolute bottom-0 left-1/2 h-24 w-0.5 -translate-x-1/2 bg-gradient-to-b from-primary to-transparent" />
    </section>
  )
}
