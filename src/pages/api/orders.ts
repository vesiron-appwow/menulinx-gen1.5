import type { APIRoute } from "astro";
import { getEnv, kvGetJSON } from "../../lib/kv";
import { keyMenu, keyOrder } from "../../lib/keys";

export const prerender = false;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function newOrderId() {
  return "MLX-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

export const GET: APIRoute = async ({ request, locals }) => {
  const { MENULINX_KV } = getEnv(locals);
  const url = new URL(request.url);
  const venueId = String(url.searchParams.get("venueId") || "").trim();

  if (!venueId) return json(400, { ok: false, error: "Missing venueId" });

  const orders = await kvGetJSON<any[]>(MENULINX_KV, keyOrder(venueId)) || [];
  return json(200, { ok: true, orders });
};

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

  const customerName = String(payload?.customerName || "").trim();
  const customerContact = String(payload?.customerContact || "").trim();
  const items = Array.isArray(payload?.items) ? payload.items : [];

  if (!customerName) return json(400, { ok: false, error: "Missing name" });
  if (!customerContact) return json(400, { ok: false, error: "Missing contact" });
  if (!items.length) return json(400, { ok: false, error: "No items" });

  // 🔎 Load menu fresh from KV
  const menu = await kvGetJSON<any>(MENULINX_KV, keyMenu(venueId));
  if (!menu || !Array.isArray(menu.items)) {
    return json(500, { ok: false, error: "Menu not found in KV" });
  }

  let subtotalPence = 0;

  const resolvedItems = items.map((i: any) => {
    const menuItem = menu.items.find((m: any) => m.id === i.itemId);

    if (!menuItem) {
      return {
        itemId: i.itemId,
        name: i.name,
        qty: i.qty,
        pricePence: 0,
      };
    }

    const pricePence = Math.round(Number(menuItem.price) * 100);
    subtotalPence += pricePence * Number(i.qty);

    return {
      itemId: menuItem.id,
      name: menuItem.name,
      qty: Number(i.qty),
      pricePence,
    };
  });

  const order = {
    orderId: newOrderId(),
    venueId,
    status: "PLACED",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    customer: {
      name: customerName,
      contact: customerContact,
    },
    fulfilment: {
      method: "COLLECTION",
    },
    items: resolvedItems,
    totals: {
      subtotalPence,
    },
  };

  const existingOrders =
    (await kvGetJSON<any[]>(MENULINX_KV, keyOrder(venueId))) || [];

  existingOrders.unshift(order);

  await MENULINX_KV.put(
    keyOrder(venueId),
    JSON.stringify(existingOrders)
  );

  return json(200, { ok: true, orderId: order.orderId });
};
