const RESERVED_SUBDOMAINS = new Set(["www", "app", "admin", "api", "localhost"]);

export type AppRoute =
  | { view: "marketplace" }
  | { view: "login" }
  | { view: "admin" }
  | { view: "tenant"; slug: string };

export function getTenantPublicPath(slug: string): string {
  return `/s/${slug}`;
}

function getPlatformHostname(hostname: string): string {
  const parts = hostname.split(".");
  // Vercel:
  // - project.vercel.app (base) should stay as-is
  // - tenant.project.vercel.app should map to project.vercel.app
  if (hostname.endsWith(".vercel.app")) {
    if (parts.length === 3) return hostname;
    if (parts.length >= 4) return parts.slice(1).join(".");
  }

  // Custom domains:
  // - example.com (base) should stay as-is
  // - tenant.example.com should map to example.com
  if (parts.length >= 3 && !hostname.includes("localhost")) {
    return parts.slice(1).join(".");
  }

  return hostname;
}

export function shouldUseTenantSubdomains(hostname?: string): boolean {
  if (typeof window === "undefined") return false;
  const host = hostname || window.location.hostname;
  if (host.includes("localhost") || host.startsWith("127.")) return false;
  return host.includes(".vercel.app") || host.split(".").length >= 3;
}

export function getTenantPublicUrl(slug: string): string {
  if (typeof window === "undefined") return getTenantPublicPath(slug);

  if (shouldUseTenantSubdomains()) {
    const platformHost = getPlatformHostname(window.location.hostname);
    return `${window.location.protocol}//${slug}.${platformHost}`;
  }

  return `${window.location.origin}${getTenantPublicPath(slug)}`;
}

export function parseAppRoute(pathname: string, hostname: string): AppRoute {
  const path = pathname.replace(/\/+$/, "") || "/";

  if (path === "/login" || path === "/admin") {
    return { view: path === "/admin" ? "admin" : "login" };
  }

  const tenantPath = path.match(/^\/s\/([a-z0-9-_]+)$/i);
  if (tenantPath) {
    return { view: "tenant", slug: tenantPath[1].toLowerCase() };
  }

  const hostParts = hostname.split(".");
  if (hostname.endsWith(".vercel.app")) {
    // project.vercel.app → marketplace (NOT a tenant)
    if (hostParts.length >= 4) {
      const subdomain = hostParts[0].toLowerCase();
      if (!RESERVED_SUBDOMAINS.has(subdomain)) {
        return { view: "tenant", slug: subdomain };
      }
    }
  } else if (hostParts.length >= 3) {
    const subdomain = hostParts[0].toLowerCase();
    if (!RESERVED_SUBDOMAINS.has(subdomain)) {
      return { view: "tenant", slug: subdomain };
    }
  }

  return { view: "marketplace" };
}

export function pushRoute(path: string): void {
  if (typeof window !== "undefined" && window.location.pathname !== path) {
    window.history.pushState({}, "", path);
  }
}

export function getLoginUrlWithEmail(email: string): string {
  const params = new URLSearchParams({ email });
  return `/login?${params.toString()}`;
}
