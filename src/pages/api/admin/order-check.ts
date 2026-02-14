// src/pages/api/admin/order-check.ts
import type { APIRoute } from "astro";
import { getEnv } from "../../../lib/kv";
import { keyOrder } from "../../../lib/keys";

export const GET: APIRoute = async ({ url, locals }) => {
  const { MENULINX_KV } = getEnv(locals);

  const orderId = (url.searchParams.get("orderId") || "").trim();
  if (!orderId) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing orderId" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  const raw = await MENULINX_KV.get(keyOrder(orderId));
  if (!raw) {
    return new Response(
      JSON.stringify({ ok: false, error: "Order not found" }),
      { status: 404, headers: { "content-type": "application/json" } }
    );
  }

  const order = JSON.parse(raw);

  return new Response(
    JSON.stringify({ ok: true, order }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
};
