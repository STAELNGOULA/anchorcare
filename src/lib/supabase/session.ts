import type { Database } from "@/types/supabase";
import {
  needsOnboardingRedirect,
  type OnboardingStatus,
} from "@/lib/auth/onboarding";
import { isUserRole, ROLE_HOME_PATH, type UserRole } from "@/lib/auth/roles";
import { isValidRedirectPath } from "@/lib/auth/redirect-path";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function withSupabaseCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
  return target;
}

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/invite/",
  "/auth/callback",
  "/r/",
  "/for-parents",
  "/for-programs",
  "/support",
  "/privacy",
  "/terms",
  "/api/health",
  "/api/webhooks/",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route),
  );
}

function isAuthRoute(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/sign-up" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/admin/login"
  );
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 503 },
      );
    }
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole: UserRole | null = null;
  let onboardingStatus: OnboardingStatus = "active";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_status")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role && isUserRole(profile.role)) {
      userRole = profile.role;
      onboardingStatus = profile.onboarding_status ?? "active";
    }
  }

  const isApiRoute = pathname.startsWith("/api/");
  const isProtected =
    !isPublicRoute(pathname) && !isAuthRoute(pathname) && !isApiRoute;

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.startsWith("/admin") ? "/admin/login" : "/login";
    if (isValidRedirectPath(pathname)) {
      url.searchParams.set("redirect", pathname);
    }
    return withSupabaseCookies(NextResponse.redirect(url), supabaseResponse);
  }

  if (user && isAuthRoute(pathname) && pathname !== "/admin/login") {
    const url = request.nextUrl.clone();
    url.pathname = userRole
      ? needsOnboardingRedirect(userRole, onboardingStatus, "/") ??
        ROLE_HOME_PATH[userRole]
      : "/parent/today";
    return withSupabaseCookies(NextResponse.redirect(url), supabaseResponse);
  }

  if (user && userRole) {
    const onboardingRedirect = needsOnboardingRedirect(
      userRole,
      onboardingStatus,
      pathname,
    );
    if (onboardingRedirect && pathname !== onboardingRedirect) {
      const url = request.nextUrl.clone();
      url.pathname = onboardingRedirect;
      return withSupabaseCookies(NextResponse.redirect(url), supabaseResponse);
    }

    const rolePrefixes: Record<UserRole, string[]> = {
      parent: ["/parent", "/api/parent", "/connect"],
      business_admin: ["/business", "/coach", "/api/business", "/api/coach"],
      coach: ["/coach", "/api/coach"],
      admin: ["/admin", "/api/admin"],
    };

    const allowedPrefixes = rolePrefixes[userRole];
    const isRoleScoped =
      pathname.startsWith("/parent") ||
      pathname.startsWith("/business") ||
      pathname.startsWith("/coach") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/connect") ||
      pathname.startsWith("/api/parent") ||
      pathname.startsWith("/api/business") ||
      pathname.startsWith("/api/coach") ||
      pathname.startsWith("/api/admin");

    if (isRoleScoped && !allowedPrefixes.some((p) => pathname.startsWith(p))) {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_HOME_PATH[userRole];
      return withSupabaseCookies(NextResponse.redirect(url), supabaseResponse);
    }
  }

  return supabaseResponse;
}
