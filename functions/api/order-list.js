export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const since = Number(url.searchParams.get("since") || 0);

  const openRaw = await env.MENULINX.get("orders:open");
  const open = openRaw ? JSON.parse(openRaw) : [];

  const orders = [];
  for (const id of open) {
    const raw = await env.MENULINX.get(`order:${id}`);
    if (!raw) continue;
    const o = JSON.parse(raw);
    if (o.updated_at && o.updated_at < since) continue;
    orders.push(o);
  }

  return new Response(JSON.stringify({ ok: true, now: Date.now(), orders }), {
    headers: { "content-type": "application/json" }
  });
}
