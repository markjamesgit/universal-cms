/** Server-side URL builders for emails and tenant links */

export function getAppBaseUrl(): string {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  // Vercel injects these automatically on deploy
  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    const host = vercelHost.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }

  return "http://localhost:3000";
}

export function getPlatformHostname(): string {
  return new URL(getAppBaseUrl()).hostname;
}

export function useTenantSubdomains(): boolean {
  if (process.env.TENANT_SUBDOMAINS === "false") return false;
  if (process.env.TENANT_SUBDOMAINS === "true") return true;
  const host = getPlatformHostname();
  if (host.includes("localhost") || host.startsWith("127.")) return false;
  // Vercel default URLs do not support wildcard tenant subdomains out of the box.
  if (host.endsWith(".vercel.app")) return false;
  return true;
}

export function buildTenantSiteUrl(slug: string): string {
  const base = getAppBaseUrl();
  if (useTenantSubdomains()) {
    const url = new URL(base);
    return `${url.protocol}//${slug}.${url.hostname}`;
  }
  return `${base}/s/${slug}`;
}

export function buildMerchantLoginUrl(email: string): string {
  const params = new URLSearchParams({ email });
  return `${getAppBaseUrl()}/login?${params.toString()}`;
}
