import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    "Variables Supabase manquantes. Ajoute VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY " +
      "(voir .env.example) dans un fichier .env en local, ou dans les variables d'environnement " +
      "de ton hébergeur (Cloudflare Pages) pour la production."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
