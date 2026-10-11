import Portfolio from "../Portfolio.jsx";
import { getPortfolioContent } from "../lib/content.js";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const [content, requestHeaders] = await Promise.all([
    getPortfolioContent(),
    headers(),
  ]);
  const configuredSiteUrl = process.env.SITE_URL;
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0].trim();
  const host = forwardedHost || requestHeaders.get("host");
  const forwardedProtocol = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",")[0]
    .trim();
  const protocol =
    forwardedProtocol || (process.env.NODE_ENV === "production" ? "https" : "http");
  const metadataBase = new URL(
    configuredSiteUrl || (host ? `${protocol}://${host}` : "http://localhost:3000"),
  );
  if (!["http:", "https:"].includes(metadataBase.protocol)) {
    throw new Error("SITE_URL must use HTTP or HTTPS.");
  }

  const title = `${content.name} | ${content.role}`;
  const description = content.description;
  const image = content.hero.image
    ? new URL(content.hero.image, metadataBase).toString()
    : undefined;

  return {
    metadataBase,
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: content.name,
      type: "website",
      images: image ? [{ url: image, alt: content.hero.imageAlt || content.name }] : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function HomePage() {
  const content = await getPortfolioContent();
  return <Portfolio siteConfig={content} />;
}
