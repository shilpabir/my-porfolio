import { NextResponse } from "next/server";
import { isSessionValid } from "../../../../lib/auth.js";
import {
  hasUnsafeUrl,
  isValidPortfolio,
  savePortfolioContent,
} from "../../../../lib/content.js";

export const runtime = "nodejs";

export async function PUT(request) {
  if (!isSessionValid(request)) {
    return NextResponse.json({ error: "Sign in to save changes." }, { status: 401 });
  }

  const body = await request.text();
  if (Buffer.byteLength(body, "utf8") > 1_000_000) {
    return NextResponse.json({ error: "Portfolio content is too large." }, { status: 413 });
  }

  let content;
  try {
    content = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Content must be valid JSON." }, { status: 400 });
  }

  if (!isValidPortfolio(content)) {
    return NextResponse.json(
      { error: "Required portfolio sections or project lists are missing." },
      { status: 400 },
    );
  }
  if (hasUnsafeUrl(content)) {
    return NextResponse.json(
      { error: "javascript:, data:, and vbscript: links are not allowed." },
      { status: 400 },
    );
  }

  try {
    const saved = await savePortfolioContent(content);
    return NextResponse.json({ success: true, content: saved });
  } catch (error) {
    console.error("Portfolio save failed:", error);
    return NextResponse.json(
      { error: "Could not save portfolio content to MongoDB." },
      { status: 500 },
    );
  }
}
