import type { Zone } from "./types";

interface ZoneCardProps {
  zone: Zone;
  primaryColor: string;
}

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="w-full h-full min-h-[140px] bg-neutral-100 rounded-xl flex items-center justify-center border border-neutral-200">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-neutral-200 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <span className="text-xs text-neutral-400 font-medium">{label}</span>
      </div>
    </div>
  );
}

export function ZoneCard({ zone, primaryColor }: ZoneCardProps) {
  return (
    <div className="zone-card bg-white rounded-2xl border border-neutral-200 overflow-hidden mb-6">
      {/* Zone header */}
      <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: primaryColor }}
          >
            {zone.index}
          </div>
          <div>
            <h4 className="font-semibold text-neutral-900 text-lg">{zone.name}</h4>
            <p className="text-sm text-neutral-500">{zone.gpsCoordinates}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm text-neutral-400">{zone.timestamp}</span>
        </div>
      </div>

      {/* Images grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Face A */}
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              {zone.faceALabel}
            </p>
            {zone.faceAImage ? (
              <img
                src={zone.faceAImage}
                alt={zone.faceALabel}
                className="w-full h-auto rounded-xl object-cover border border-neutral-100"
                crossOrigin="anonymous"
              />
            ) : (
              <ImagePlaceholder label={zone.faceALabel} />
            )}
          </div>

          {/* Face B */}
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              {zone.faceBLabel}
            </p>
            {zone.faceBImage ? (
              <img
                src={zone.faceBImage}
                alt={zone.faceBLabel}
                className="w-full h-auto rounded-xl object-cover border border-neutral-100"
                crossOrigin="anonymous"
              />
            ) : (
              <ImagePlaceholder label={zone.faceBLabel} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
