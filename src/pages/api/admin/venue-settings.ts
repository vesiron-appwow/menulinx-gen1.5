import type { APIRoute } from "astro";
import { getEnv } from "../../../lib/kv";
import { getVenue, writeVenue, makeVenueDefaults } from "../../../lib/venue";

export const prerender = false;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const { MENULINX_KV } = getEnv(locals);

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: "Invalid JSON" });
  }

  const venueId = String(payload?.venueId || "").trim();
  if (!venueId) return json(400, { ok: false, error: "Missing venueId" });

  const existing = await getVenue(MENULINX_KV, venueId);
  const base = existing ?? makeVenueDefaults(venueId);

  const updated = {
    ...base,
    name: payload.name ?? base.name,
    status:
      payload.status === "OPEN" || payload.status === "CLOSED"
        ? payload.status
        : base.status,
    prepMinutes:
      payload.prepMinutes != null
        ? Number(payload.prepMinutes)
        : base.prepMinutes,
    collectionEnabled:
      payload.collectionEnabled != null
        ? Boolean(payload.collectionEnabled)
        : base.collectionEnabled,
    deliveryEnabled:
      payload.deliveryEnabled != null
        ? Boolean(payload.deliveryEnabled)
        : base.deliveryEnabled,
    updatedAt: Date.now(),
  };

  await writeVenue(MENULINX_KV, updated);

  return json(200, { ok: true, venue: updated });
};
