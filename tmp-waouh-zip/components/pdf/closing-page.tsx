import type { Closing, CoverLogos } from "./types";

interface ClosingPageProps {
  closing: Closing;
  coverLogos: CoverLogos;
  primaryColor: string;
  footerBrand: string;
}

function LogoPlaceholder({ label }: { label: string }) {
  return (
    <div className="h-12 w-28 flex items-center justify-center bg-neutral-100 rounded-lg border border-neutral-200">
      <span className="text-xs text-neutral-400 font-medium uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

export function ClosingPage({
  closing,
  coverLogos,
  primaryColor,
  footerBrand,
}: ClosingPageProps) {
  return (
    <div className="pdf-page bg-white flex flex-col">
      {/* Top accent bar */}
      <div className="h-2" style={{ backgroundColor: primaryColor }} />

      {/* Main content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-12">
        {/* Decorative element */}
        <div
          className="w-16 h-16 rounded-2xl mb-10 flex items-center justify-center"
          style={{ backgroundColor: primaryColor }}
        >
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="text-4xl font-bold text-neutral-900 text-center text-balance mb-6">
          {closing.heading}
        </h2>

        {/* Body text */}
        <p className="text-lg text-neutral-600 text-center max-w-lg leading-relaxed mb-12">
          {closing.body}
        </p>

        {/* Signature block */}
        <div className="text-center mb-16">
          <p className="text-sm text-neutral-400 uppercase tracking-wider mb-2">
            {closing.signatureLabel}
          </p>
          <p
            className="text-2xl font-semibold"
            style={{ color: primaryColor }}
          >
            {closing.signatureValue}
          </p>
        </div>

        {/* Logos */}
        <div className="flex items-center gap-8">
          {coverLogos.client ? (
            <img
              src={coverLogos.client}
              alt="Logo client"
              className="h-12 w-auto object-contain opacity-60"
              crossOrigin="anonymous"
            />
          ) : (
            <LogoPlaceholder label="Client" />
          )}
          <div className="w-px h-10 bg-neutral-200" />
          {coverLogos.entreprise ? (
            <img
              src={coverLogos.entreprise}
              alt="Logo entreprise"
              className="h-12 w-auto object-contain opacity-60"
              crossOrigin="anonymous"
            />
          ) : (
            <LogoPlaceholder label="Entreprise" />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-12 pb-10">
        <div className="border-t border-neutral-200 pt-6 text-center">
          <span className="text-sm text-neutral-400">{footerBrand}</span>
        </div>
      </div>
    </div>
  );
}
