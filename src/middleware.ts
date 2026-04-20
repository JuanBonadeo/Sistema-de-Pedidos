import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function resolveSlugFromHost(
  host: string | null,
  rootDomain: string | undefined,
): string | null {
  if (!rootDomain || !host || host === rootDomain) return null;
  const suffix = `.${rootDomain}`;
  if (!host.endsWith(suffix)) return null;
  const slug = host.slice(0, -suffix.length);
  if (!slug || slug.includes(".")) return null;
  return slug;
}

export async function middleware(request: NextRequest) {
  const rootDomain = process.env.ROOT_DOMAIN;
  const host = request.headers.get("host");
  const hostSlug = resolveSlugFromHost(host, rootDomain);
  const pathname = request.nextUrl.pathname;

  // Subdomain → path rewrite for prod. Skip global routes (auth callback,
  // platform admin at root, platform login, platform business CRUD).
  const isGlobalRoute =
    pathname === "/auth/callback" ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/negocios");
  if (
    hostSlug &&
    !isGlobalRoute &&
    !pathname.startsWith(`/${hostSlug}/`) &&
    pathname !== `/${hostSlug}`
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${hostSlug}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Effective path used for admin protection (same in dev)
  const effectivePath = hostSlug
    ? `/${hostSlug}${pathname === "/" ? "" : pathname}`
    : pathname;

  // Protect platform routes (/ and /negocios/*). /login is the unauthenticated
  // entry point so it's excluded.
  const isPlatformProtected =
    effectivePath === "/" || effectivePath.startsWith("/negocios");
  if (isPlatformProtected) {
    const response = NextResponse.next();
    const supabase = makeSessionClient(request, response);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = `/login`;
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  // Protect /{slug}/admin/* (except /admin/login)
  const adminMatch = effectivePath.match(/^\/([^/]+)\/admin(?:\/(.*))?$/);
  if (adminMatch) {
    const [, slug, rest = ""] = adminMatch;
    if (rest !== "login") {
      const response = NextResponse.next();
      const supabase = makeSessionClient(request, response);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = `/${slug}/admin/login`;
        return NextResponse.redirect(redirectUrl);
      }
      return response;
    }
  }

  return NextResponse.next();
}

function makeSessionClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          for (const { name, value, options } of cookies) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );
}

export const config = {
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
