import { NextResponse } from "next/server";
import { sessionCookieName } from "../../../../lib/auth.js";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
