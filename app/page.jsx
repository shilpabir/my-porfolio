import Portfolio from "../Portfolio.jsx";
import { getPortfolioContent } from "../lib/content.js";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await getPortfolioContent();
  return <Portfolio siteConfig={content} />;
}
