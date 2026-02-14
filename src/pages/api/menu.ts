import type { APIRoute } from "astro";
import { getEnv, kvGetJSON } from "../../lib/kv";
import { keyMenu } from "../../lib/keys";

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
  const venueId = String(url.searchParams.get("venueId") || "default").trim();

  try {
    const menu = await kvGetJSON<any>(MENULINX_KV, keyMenu(venueId));

    if (!menu) {
      return json(404, { ok: false, error: "Menu not found" });
    }

    return json(200, { ok: true, menu });
  } catch {
    return json(500, { ok: false, error: "Failed to load menu" });
  }
};
