import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import AdminEditor from "../../../components/AdminEditor.jsx";
import AdminLogin from "../../../components/AdminLogin.jsx";
import { isSessionTokenValid, sessionCookieName } from "../../../lib/auth.js";
import { getPortfolioContent } from "../../../lib/content.js";
import "../admin.css";

export const dynamic = "force-dynamic";

export default async function AdminPage({ params }) {
  const { secret } = await params;
  const configuredPath = process.env.ADMIN_PATH;
  if (!configuredPath || secret !== configuredPath) notFound();

  const cookieStore = await cookies();
  const authenticated = isSessionTokenValid(
    cookieStore.get(sessionCookieName)?.value,
  );
  if (!authenticated) return <AdminLogin />;

  const content = await getPortfolioContent();
  return <AdminEditor initialContent={content} />;
}
