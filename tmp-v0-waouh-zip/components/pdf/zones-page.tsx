import type { Zone } from "./types";
import { ZoneCard } from "./zone-card";

interface ZonesPageProps {
  zones: Zone[];
  primaryColor: string;
  footerBrand: string;
  footerNote: string;
  pageNumber: number;
  totalPages: number;
}

export function ZonesPage({
  zones,
  primaryColor,
  footerBrand,
  footerNote,
  pageNumber,
  totalPages,
}: ZonesPageProps) {
  return (
    <div className="pdf-page bg-neutral-50 flex flex-col">
      {/* Top accent bar */}
      <div className="h-2" style={{ backgroundColor: primaryColor }} />

      {/* Header */}
      <div className="px-12 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-1 h-6 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            <span className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
              Détail des zones
            </span>
          </div>
          <span className="text-sm text-neutral-400">
            Page {pageNumber} / {totalPages}
          </span>
        </div>
      </div>

      {/* Zones list */}
      <div className="px-12 flex-1 pb-4">
        {zones.map((zone) => (
          <ZoneCard key={zone.index} zone={zone} primaryColor={primaryColor} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-12 pb-8">
        <div className="border-t border-neutral-200 pt-6 flex items-center justify-between">
          <span className="text-sm text-neutral-400">{footerBrand}</span>
          <span className="text-sm text-neutral-400">{footerNote}</span>
        </div>
      </div>
    </div>
  );
}
