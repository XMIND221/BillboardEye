import type { CoverLogos } from "./types";

interface CoverPageProps {
  campaignName: string;
  clientLine: string;
  zoneLine: string;
  date: string;
  coverLogos: CoverLogos;
  primaryColor: string;
  footerBrand: string;
}

function LogoPlaceholder({ label }: { label: string }) {
  return (
    <div className="h-14 w-32 flex items-center justify-center bg-neutral-100 rounded-lg border border-neutral-200">
      <span className="text-xs text-neutral-400 font-medium uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

export function CoverPage({
  campaignName,
  clientLine,
  zoneLine,
  date,
  coverLogos,
  primaryColor,
  footerBrand,
}: CoverPageProps) {
  return (
    <div className="pdf-page bg-white flex flex-col">
      {/* Top accent bar */}
      <div className="h-2" style={{ backgroundColor: primaryColor }} />

      {/* Header with logos */}
      <div className="px-12 pt-10 flex items-center justify-between">
        {coverLogos.client ? (
          <img
            src={coverLogos.client}
            alt="Logo client"
            className="h-14 w-auto object-contain"
            crossOrigin="anonymous"
          />
        ) : (
          <LogoPlaceholder label="Client" />
        )}
        {coverLogos.entreprise ? (
          <img
            src={coverLogos.entreprise}
            alt="Logo entreprise"
            className="h-14 w-auto object-contain"
            crossOrigin="anonymous"
          />
        ) : (
          <LogoPlaceholder label="Entreprise" />
        )}
      </div>

      {/* Main content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-12">
        {/* Decorative line */}
        <div
          className="w-20 h-1 rounded-full mb-10"
          style={{ backgroundColor: primaryColor }}
        />

        {/* Campaign name */}
        <h1 className="text-5xl font-bold text-neutral-900 text-center text-balance leading-tight mb-6">
          {campaignName}
        </h1>

        {/* Client line */}
        <p className="text-xl text-neutral-600 text-center mb-2">{clientLine}</p>

        {/* Zone line */}
        <p className="text-lg text-neutral-500 text-center mb-8">{zoneLine}</p>

        {/* Date badge */}
        <div
          className="inline-flex items-center px-5 py-2 rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {date}
        </div>
      </div>

      {/* Footer */}
      <div className="px-12 pb-10">
        <div className="border-t border-neutral-200 pt-6 flex items-center justify-between">
          <span className="text-sm text-neutral-400">{footerBrand}</span>
          <span className="text-sm text-neutral-400">Document confidentiel</span>
        </div>
      </div>
    </div>
  );
}
