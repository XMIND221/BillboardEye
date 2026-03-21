import { Eye } from "lucide-react"

export function FooterSection() {
  return (
    <footer className="bg-background px-8 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Divider */}
        <div className="mb-12 h-px bg-border" />

        {/* Footer Content */}
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Eye className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              BillboardEye
            </span>
          </div>

          {/* Generated text */}
          <p className="text-sm text-muted-foreground">
            Rapport généré par{" "}
            <span className="font-medium text-foreground">BillboardEye</span>
          </p>
        </div>

        {/* Bottom accent */}
        <div className="mt-12 flex justify-center">
          <div className="h-1 w-16 rounded-full bg-primary" />
        </div>
      </div>
    </footer>
  )
}
