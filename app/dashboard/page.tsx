import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ExperiencePortal } from "@/components/portal/ExperiencePortal";
import type {
  Category,
  ExperienceEntry,
  Organization,
  Profile,
} from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: verifiedToken } = await supabase.auth.getClaims();
  const claims = verifiedToken?.claims;

  if (!claims?.sub) {
    redirect("/login?next=/dashboard");
  }

  const [categoriesResult, organizationsResult, entriesResult, profileResult] =
    await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("organizations")
        .select("*")
        .order("name", { ascending: true }),
      supabase
        .from("experience_entries")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").maybeSingle(),
    ]);

  const databaseError =
    categoriesResult.error ??
    organizationsResult.error ??
    entriesResult.error ??
    profileResult.error;

  if (databaseError) {
    throw new Error(
      "Your private tracker could not be loaded. Confirm the Supabase migration has been applied.",
    );
  }

  const profile = (profileResult.data as Profile | null) ?? null;
  let avatarUrl: string | null = null;

  if (profile?.avatar_path) {
    const { data } = await supabase.storage
      .from("profile-photos")
      .createSignedUrl(profile.avatar_path, 3_600);
    avatarUrl = data?.signedUrl ?? null;
  }

  return (
    <ExperiencePortal
      userId={claims.sub}
      userEmail={
        typeof claims.email === "string" ? claims.email : "Signed-in user"
      }
      categories={(categoriesResult.data ?? []) as Category[]}
      organizations={(organizationsResult.data ?? []) as Organization[]}
      entries={(entriesResult.data ?? []) as ExperienceEntry[]}
      initialProfile={profile}
      initialAvatarUrl={avatarUrl}
    />
  );
}
