import type { APIRoute } from "astro";
import { getEnv } from "../../../lib/kv";
import { getVenue } from "../../../lib/venue";

export const prerender = false;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const GET: APIRoute = async ({ request, locals }) => {
  const { MENULINX_KV } = getEnv(locals);

  const url = new URL(request.url);
  const venueId = String(url.searchParams.get("venueId") || "").trim();

  if (!venueId) return json(400, { ok: false, error: "Missing venueId" });

  try {
    const venue = await getVenue(MENULINX_KV, venueId);
    if (!venue) return json(404, { ok: false, error: "Venue not found" });
    return json(200, { ok: true, venue });
  } catch {
    return json(500, { ok: false, error: "Failed to load venue" });
  }
};
