const projectUrl = "https://lzxeubqpimgyglowuhjh.supabase.co";
const projectPublishableKey =
  "sb_publishable_E4by_DqbYecFi1kspeGs9g_jO6afw2Y";

export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? projectUrl;

export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  projectPublishableKey;
