require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const roleMapRaw = process.env.APP_ROLE_MAP || "";

if (!supabaseUrl || !serviceKey) {
  console.error("[set-app-roles] SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
  process.exit(1);
}

if (!roleMapRaw) {
  console.error("[set-app-roles] APP_ROLE_MAP manquant.");
  console.error('Exemple APP_ROLE_MAP: {"boss@x.com":"gestionnaire","agent@x.com":"agent"}');
  process.exit(1);
}

let roleMap;
try {
  roleMap = JSON.parse(roleMapRaw);
} catch (e) {
  console.error("[set-app-roles] APP_ROLE_MAP doit être un JSON valide.");
  process.exit(1);
}

const validRoles = new Set(["gestionnaire", "agent", "reporting"]);
const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function setRole(email, role) {
  if (!validRoles.has(role)) {
    console.warn(`[set-app-roles] rôle ignoré pour ${email}: ${role}`);
    return;
  }
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw error;
  const user = (data?.users || []).find((u) => String(u.email || "").toLowerCase() === String(email).toLowerCase());
  if (!user) {
    console.warn(`[set-app-roles] utilisateur introuvable: ${email}`);
    return;
  }
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata || {}),
      app_role: role,
    },
  });
  if (updateError) throw updateError;
  console.log(`[set-app-roles] ${email} -> ${role}`);
}

async function main() {
  const entries = Object.entries(roleMap);
  for (const [email, role] of entries) {
    await setRole(email, String(role).toLowerCase().trim());
  }
  console.log("[set-app-roles] terminé.");
}

main().catch((e) => {
  console.error("[set-app-roles] échec:", e.message || e);
  process.exit(1);
});
