/** Valeurs API / serveur : `default` | `a` | `b` | `c` | `waouh` */
export const PDF_TEMPLATE_OPTIONS = [
  { value: "default", label: "Classique", hint: "Mise en page historique BillboardEye" },
  { value: "a", label: "Editorial", hint: "Minimal, typo forte" },
  { value: "b", label: "Corporate", hint: "Sombre, type dashboard" },
  { value: "c", label: "Premium", hint: "Noir & papier, sobre" },
  { value: "waouh", label: "WAOUH AGENCE", hint: "Template agence premium" },
];

export function labelForPdfTemplate(value) {
  const v = String(value || "default").toLowerCase();
  return PDF_TEMPLATE_OPTIONS.find((o) => o.value === v)?.label || "Classique";
}
