import type { Stats } from "./types";

interface SummaryPageProps {
  campaignName: string;
  stats: Stats;
  noteResume: string;
  primaryColor: string;
  footerBrand: string;
  footerNote: string;
}

function KPICard({
  value,
  label,
  primaryColor,
}: {
  value: string | number;
  label: string;
  primaryColor: string;
}) {
  return (
    <div className="flex flex-col items-center p-8 bg-neutral-50 rounded-2xl border border-neutral-100">
      <span
        className="text-5xl font-bold mb-3"
        style={{ color: primaryColor }}
      >
        {value}
      </span>
      <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider text-center">
        {label}
      </span>
    </div>
  );
}

export function SummaryPage({
  campaignName,
  stats,
  noteResume,
  primaryColor,
  footerBrand,
  footerNote,
}: SummaryPageProps) {
  return (
    <div className="pdf-page bg-white flex flex-col">
      {/* Top accent bar */}
      <div className="h-2" style={{ backgroundColor: primaryColor }} />

      {/* Header */}
      <div className="px-12 pt-10 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-1 h-6 rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
          <span className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
            Resume de la campagne
          </span>
        </div>
        <h2 className="text-3xl font-bold text-neutral-900">{campaignName}</h2>
      </div>

      {/* KPI Cards */}
      <div className="px-12 pb-10">
        <div className="grid grid-cols-3 gap-6">
          <KPICard
            value={stats.zonesCount}
            label="Zones"
            primaryColor={primaryColor}
          />
          <KPICard
            value={stats.billboardsCount}
            label="Panneaux"
            primaryColor={primaryColor}
          />
          <KPICard
            value={stats.duration}
            label="Duree"
            primaryColor={primaryColor}
          />
        </div>
      </div>

      {/* Note section */}
      <div className="px-12 flex-1">
        <div className="bg-neutral-50 rounded-2xl p-8 border border-neutral-100">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Notes et Observations
          </h3>
          <p className="text-neutral-600 leading-relaxed whitespace-pre-line">
            {noteResume}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-12 pb-10 pt-6">
        <div className="border-t border-neutral-200 pt-6 flex items-center justify-between">
          <span className="text-sm text-neutral-400">{footerBrand}</span>
          <span className="text-sm text-neutral-400">{footerNote}</span>
        </div>
      </div>
    </div>
  );
}
