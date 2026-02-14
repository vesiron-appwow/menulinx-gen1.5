export async function onRequestPost({ request, env }) {
  const data = await request.json().catch(() => null);
  if (!data || !data.id || !data.action) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid update" }), { status: 400 });
  }

  const raw = await env.MENULINX.get(`order:${data.id}`);
  if (!raw) return new Response(JSON.stringify({ ok: false, error: "Order not found" }), { status: 404 });

  const o = JSON.parse(raw);
  const now = Date.now();

  if (data.action === "accept") {
    const eta = Number(data.eta_mins);
    if (![15, 30, 45, 60].includes(eta)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid ETA" }), { status: 400 });
    }
    o.status = "accepted";
    o.eta_mins = eta;
    o.accepted_at = now;
  }

  if (data.action === "ready") {
    o.status = "ready";
    o.ready_at = now;
  }

  if (data.action === "despatched") {
    o.status = "despatched";
    o.despatched_at = now;
  }

  if (data.action === "collected") {
    o.status = "collected";
    o.collected_at = now;
  }

  if (data.action === "complete") {
    // remove from open list
    const openRaw = await env.MENULINX.get("orders:open");
    const open = openRaw ? JSON.parse(openRaw) : [];
    const next = open.filter(x => x !== data.id);
    await env.MENULINX.put("orders:open", JSON.stringify(next));
    await env.MENULINX.delete(`order:${data.id}`);
    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
  }

  o.updated_at = now;
  await env.MENULINX.put(`order:${data.id}`, JSON.stringify(o));

  return new Response(JSON.stringify({ ok: true, order: o }), {
    headers: { "content-type": "application/json" }
  });
}
