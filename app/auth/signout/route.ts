import { NextResponse } from "next/server";
import { REMEMBER_ME_COOKIE } from "@/lib/auth/remember";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const response = NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
  response.cookies.delete(REMEMBER_ME_COOKIE);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
