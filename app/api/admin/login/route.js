import { NextResponse } from "next/server";
import {
  createSessionToken,
  credentialsAreValid,
  missingAdminConfiguration,
  sessionCookieName,
} from "../../../../lib/auth.js";

export const runtime = "nodejs";

export async function POST(request) {
  const missingConfiguration = missingAdminConfiguration();
  if (missingConfiguration.length > 0) {
    return NextResponse.json(
      {
        error: `Admin environment is incomplete: ${missingConfiguration.join(", ")}. Set these in portfolio-nextjs/.env.local and restart Next.js.`,
      },
      { status: 503 },
    );
  }

  try {
    createSessionToken();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  let credentials;
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    typeof credentials?.email !== "string" ||
    typeof credentials?.password !== "string"
  ) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  if (!credentialsAreValid(credentials.email, credentials.password)) {
    return NextResponse.json(
      { error: "Incorrect email or password." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(sessionCookieName, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
