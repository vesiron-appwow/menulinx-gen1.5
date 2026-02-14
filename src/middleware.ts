import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, redirect } = context;

  // Only guard the root path
  if (url.pathname === "/") {
    try {
      const res = await fetch(new URL("/api/menu?venueId=default", request.url));

      if (res.ok) {
        const data = await res.json();

        // If menu missing → redirect to setup
        if (!data?.menu) {
          return redirect("/setup");
        }
      } else {
        return redirect("/setup");
      }
    } catch {
      return redirect("/setup");
    }
  }

  // Otherwise continue normally
  return next();
});