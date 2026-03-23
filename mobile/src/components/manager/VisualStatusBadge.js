import React from "react";
import StatusBadge from "./StatusBadge";

const TONE_MAP = {
  actif: { variant: "success", label: "🟢 Actif" },
  attente: { variant: "warning", label: "🟡 En attente" },
  termine: { variant: "info", label: "🔵 Terminé" },
  probleme: { variant: "error", label: "🔴 Problème" },
  syncing: { variant: "info", label: "🔄 Sync…" },
};

/**
 * @param {{ tone: keyof typeof TONE_MAP }} props
 */
export default function VisualStatusBadge({ tone }) {
  const cfg = TONE_MAP[tone] || TONE_MAP.actif;
  return <StatusBadge variant={cfg.variant}>{cfg.label}</StatusBadge>;
}
