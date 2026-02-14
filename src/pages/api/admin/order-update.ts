import type { APIRoute } from "astro";
import { getEnv } from "../../../lib/kv";
import {
  updateOrderStatus,
  type OrderStatus,
} from "../../../lib/orders";

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

  const orderId = String(payload?.orderId || "").trim();
  const nextStatus = String(payload?.status || "").trim() as OrderStatus;

  if (!orderId || !nextStatus) {
    return json(400, { ok: false, error: "Missing fields" });
  }

  const validStatuses: OrderStatus[] = [
    "NEW",
    "ACCEPTED",
    "READY",
    "DISPATCHED",
    "COLLECTED",
    "CANCELLED",
  ];

  if (!validStatuses.includes(nextStatus)) {
    return json(400, { ok: false, error: "Invalid status" });
  }

  const updated = await updateOrderStatus(
    MENULINX_KV,
    orderId,
    nextStatus
  );

  if (!updated) {
    return json(404, { ok: false, error: "Order not found" });
  }

  return json(200, { ok: true, order: updated });
};
