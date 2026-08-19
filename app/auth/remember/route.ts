import { NextResponse } from "next/server";
import {
  REMEMBER_ME_COOKIE,
  REMEMBER_ME_MAX_AGE,
} from "@/lib/auth/remember";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    remember?: unknown;
  } | null;

  if (typeof body?.remember !== "boolean") {
    return NextResponse.json(
      { error: "A remember preference is required." },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ saved: true });
  response.headers.set("Cache-Control", "private, no-store");

  if (body.remember) {
    response.cookies.set(REMEMBER_ME_COOKIE, "1", {
      httpOnly: true,
      maxAge: REMEMBER_ME_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  } else {
    response.cookies.delete(REMEMBER_ME_COOKIE);
  }

  return response;
}
