import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Updates Supabase auth session in middleware.
 * Called on every matched request to rotate tokens and set cookies.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Do not use getSession() — it reads from storage, not the server.
  // getUser() sends a request to the Supabase Auth server every time to revalidate.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes — redirect to /login if no user
  // Public paths: /login, /signup (and static assets excluded by matcher)
  const publicPaths = ["/login", "/signup"];
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

