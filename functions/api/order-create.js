export async function onRequestPost({ request, env }) {
  const data = await request.json().catch(() => null);
  if (!data || !Array.isArray(data.items) || data.items.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid order" }), { status: 400 });
  }

  // Load menu for server-side validation (availability + prices)
  const menuRaw = await env.MENULINX.get("menu:current");
  const menu = menuRaw ? JSON.parse(menuRaw) : { items: [] };
  const menuById = new Map((menu.items || []).map(i => [String(i.id), i]));

  // Validate each item is available
  for (const it of data.items) {
    const mi = menuById.get(String(it.id));
    if (!mi) return new Response(JSON.stringify({ ok: false, error: `Unknown item ${it.id}` }), { status: 400 });
    if (mi.available === false) return new Response(JSON.stringify({ ok: false, error: `Unavailable: ${mi.name}` }), { status: 409 });
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  // Compute totals server-side (avoid tampering)
  const items = data.items.map(it => {
    const mi = menuById.get(String(it.id));
    const qty = Math.max(1, Number(it.quantity || 1));
    return {
      id: String(mi.id),
      name: mi.name,
      price: Number(mi.price),
      quantity: qty
    };
  });

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryType = data.deliveryType === "collection" ? "collection" : "delivery";
  const deliveryFee = deliveryType === "delivery" ? Number(menu.deliveryFee || 2.5) : 0;
  const total = Number((subtotal + deliveryFee).toFixed(2));

  const order = {
    id,
    created_at: now,
    status: "new",
    deliveryType,
    customerName: String(data.customerName || "Customer"),
    customerPhone: String(data.customerPhone || ""),
    address: deliveryType === "delivery" ? String(data.address || "") : "",
    notes: String(data.notes || ""),
    items,
    subtotal: Number(subtotal.toFixed(2)),
    deliveryFee,
    total
  };

  // Write order
  await env.MENULINX.put(`order:${id}`, JSON.stringify(order));

  // Add to open list
  const openRaw = await env.MENULINX.get("orders:open");
  const open = openRaw ? JSON.parse(openRaw) : [];
  open.unshift(id);
  await env.MENULINX.put("orders:open", JSON.stringify(open));

  return new Response(JSON.stringify({ ok: true, id }), {
    headers: { "content-type": "application/json" }
  });
}
