"use client";

import type { PDFData } from "./types";
import { CoverPage } from "./cover-page";
import { SummaryPage } from "./summary-page";
import { ZonesPage } from "./zones-page";
import { ClosingPage } from "./closing-page";
import "./pdf-print.css";

interface VariantWaouhAgenceProps {
  data: PDFData;
}

// Helper to chunk zones into pages (max 2 zones per page for readability)
function chunkZones<T>(zones: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < zones.length; i += size) {
    chunks.push(zones.slice(i, i + size));
  }
  return chunks;
}

export function VariantWaouhAgence({ data }: VariantWaouhAgenceProps) {
  const {
    campaignName,
    clientLine,
    zoneLine,
    date,
    coverLogos,
    stats,
    noteResume,
    zones,
    closing,
    footerBrand,
    footerNote,
    primaryColor,
  } = data;

  // Chunk zones into pages (2 zones per page for clean layout)
  const zonesPerPage = 2;
  const zoneChunks = chunkZones(zones, zonesPerPage);
  
  // Calculate total pages: Cover + Summary + Zone pages + Closing
  const totalPages = 2 + zoneChunks.length + 1;

  return (
    <div className="bg-neutral-200 min-h-screen">
      {/* Cover Page */}
      <CoverPage
        campaignName={campaignName}
        clientLine={clientLine}
        zoneLine={zoneLine}
        date={date}
        coverLogos={coverLogos}
        primaryColor={primaryColor}
        footerBrand={footerBrand}
      />

      {/* Summary Page */}
      <SummaryPage
        campaignName={campaignName}
        stats={stats}
        noteResume={noteResume}
        primaryColor={primaryColor}
        footerBrand={footerBrand}
        footerNote={footerNote}
      />

      {/* Zone Detail Pages */}
      {zoneChunks.map((chunk, index) => (
        <ZonesPage
          key={index}
          zones={chunk}
          primaryColor={primaryColor}
          footerBrand={footerBrand}
          footerNote={footerNote}
          pageNumber={3 + index}
          totalPages={totalPages}
        />
      ))}

      {/* Closing Page */}
      <ClosingPage
        closing={closing}
        coverLogos={coverLogos}
        primaryColor={primaryColor}
        footerBrand={footerBrand}
      />
    </div>
  );
}

export type { PDFData };
