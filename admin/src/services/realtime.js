import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (url && anonKey) {
  supabase = createClient(url, anonKey);
}

export const subscribeDashboardRealtime = (onChange) => {
  if (!supabase) {
    return () => {};
  }

  const channel = supabase
    .channel("billboardeye-dashboard-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "projets" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "panneaux" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "photos" }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
