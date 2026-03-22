/**
 * BillboardEye Campaign Report Types
 * All business data comes from these props - no hardcoded values
 *
 * Copie de référence depuis le zip v0 — le rendu PDF utilise
 * src/services/map-report-payload.js + report-template.service.js
 */

/** A single zone entry with faces images */
export interface ZoneEntry {
  /** Zone index (displayed as 01, 02, etc.) */
  index: number;
  /** Zone name */
  name: string;
  /** GPS coordinates as string (e.g., "48.8566, 2.3522") */
  gpsCoordinates: string;
  /** Timestamp string (e.g., "15 mars 2024 - 14:32") */
  timestamp: string;
  /** URL or data URI for Face A image */
  faceAImage: string;
  /** URL or data URI for Face B image */
  faceBImage: string;
}

/** Main props for the campaign report */
export interface CampaignReportProps {
  // === Cover Page ===
  /** Campaign name - displayed as main title */
  campaignName: string;
  /** Client line (e.g., "Client : Acme Corp") */
  clientLine: string;
  /** Optional zone line (e.g., "Zone : Île-de-France") */
  zoneLine?: string;
  /** Report date (e.g., "Mars 2024") */
  date: string;

  // === Summary Page ===
  /** Number of zones covered */
  zonesCount: number;
  /** Number of billboards */
  billboardsCount: number;
  /** Duration text (free format, e.g., "2 semaines") */
  duration: string;
  /** Optional notes/instructions block */
  noteResume?: string;
  /** Map image URL (real map from API, 16:9 aspect) */
  mapImageUrl?: string;
  /** Caption below the map */
  mapCaption?: string;

  // === Zones Detail Page ===
  /** Array of zone entries */
  zones: ZoneEntry[];

  // === Full-Width Visual Page ===
  /** Large visual image URL */
  visualImageUrl?: string;
  /** Optional caption overlay on visual */
  visualCaption?: string;

  // === Optional Logo ===
  /** Custom logo URL (defaults to BillboardEye text logo) */
  logoUrl?: string;
}
