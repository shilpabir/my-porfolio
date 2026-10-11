import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { isSessionValid } from "../../../../lib/auth.js";

export const runtime = "nodejs";

const maxImageSize = 5 * 1024 * 1024;
const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request) {
  if (!isSessionValid(request)) {
    return NextResponse.json({ error: "Sign in to upload images." }, { status: 401 });
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  if (
    !CLOUDINARY_CLOUD_NAME ||
    !/^[\w-]+$/.test(CLOUDINARY_CLOUD_NAME) ||
    !CLOUDINARY_API_KEY ||
    !CLOUDINARY_API_SECRET
  ) {
    return NextResponse.json(
      {
        error:
          "Cloudinary is not configured. Add its cloud name, API key, and API secret to .env.local.",
      },
      { status: 503 },
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  if (!allowedImageTypes.has(file.type)) {
    return NextResponse.json(
      { error: "Use a JPG, PNG, WebP, or GIF image." },
      { status: 400 },
    );
  }
  if (file.size === 0 || file.size > maxImageSize) {
    return NextResponse.json(
      { error: "Image must be larger than 0 bytes and no more than 5 MB." },
      { status: 413 },
    );
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "portfolio";
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
    .digest("hex");
  const cloudinaryForm = new FormData();
  cloudinaryForm.append("file", file);
  cloudinaryForm.append("api_key", CLOUDINARY_API_KEY);
  cloudinaryForm.append("timestamp", timestamp);
  cloudinaryForm.append("folder", folder);
  cloudinaryForm.append("signature", signature);

  let cloudinaryResponse;
  try {
    cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUDINARY_CLOUD_NAME)}/image/upload`,
      { method: "POST", body: cloudinaryForm },
    );
  } catch (error) {
    console.error("Cloudinary image upload request failed:", error);
    return NextResponse.json(
      { error: "Could not connect to Cloudinary. Please try again." },
      { status: 502 },
    );
  }

  let result;
  try {
    result = await cloudinaryResponse.json();
  } catch (error) {
    console.error("Cloudinary returned an invalid upload response:", error);
    return NextResponse.json(
      { error: "Cloudinary returned an invalid response. Please try again." },
      { status: 502 },
    );
  }

  if (!cloudinaryResponse.ok || typeof result?.secure_url !== "string") {
    console.error("Cloudinary image upload was rejected:", result?.error?.message);
    return NextResponse.json(
      { error: "Cloudinary could not upload this image. Check your settings and try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ url: result.secure_url });
}