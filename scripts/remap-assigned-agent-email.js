#!/usr/bin/env node
/**
 * Met à jour projets.assigned_agent quand un agent change d’email (nouveau compte Supabase).
 * Utilise la service_role (contourne RLS si présent).
 *
 * Usage :
 *   REMAP_AGENT_FROM=ancien@email.com REMAP_AGENT_TO=nouveau@email.com npm run remap:agent
 * ou :
 *   node scripts/remap-assigned-agent-email.js ancien@email.com nouveau@email.com
 */
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const fromRaw = process.env.REMAP_AGENT_FROM || process.argv[2];
const toRaw = process.env.REMAP_AGENT_TO || process.argv[3];

if (!fromRaw || !toRaw) {
  console.error("[remap-agent] Renseigner l’ancien et le nouvel email.");
  console.error(
    "  REMAP_AGENT_FROM=ancien@x.com REMAP_AGENT_TO=nouveau@x.com npm run remap:agent",
  );
  process.exit(1);
}

const fromNorm = String(fromRaw).trim().toLowerCase();
const toNorm = String(toRaw).trim();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("[remap-agent] SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey);

async function main() {
  const { data: rows, error: selErr } = await admin.from("projets").select("id, assigned_agent");
  if (selErr) throw selErr;

  const ids = (rows || [])
    .filter((r) => String(r.assigned_agent || "").trim().toLowerCase() === fromNorm)
    .map((r) => r.id);

  if (ids.length === 0) {
    console.log("[remap-agent] Aucune campagne avec assigned_agent =", fromRaw);
    return;
  }

  const { error: updErr } = await admin.from("projets").update({ assigned_agent: toNorm }).in("id", ids);
  if (updErr) throw updErr;

  console.log(`[remap-agent] ${ids.length} campagne(s) : "${fromRaw}" -> "${toNorm}"`);
}

main().catch((e) => {
  console.error("[remap-agent] échec:", e.message || e);
  process.exit(1);
});
