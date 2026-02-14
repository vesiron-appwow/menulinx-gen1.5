export async function onRequestPost({ request, env }) {
  const data = await request.json().catch(() => null);
  if (!data || !Array.isArray(data.items)) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid menu" }), { status: 400 });
  }
  // minimal sanitisation
  const menu = {
    restaurantName: String(data.restaurantName || "Demo Cafe"),
    deliveryFee: Number(data.deliveryFee || 2.5),
    items: data.items.map(i => ({
      id: String(i.id),
      name: String(i.name),
      price: Number(i.price),
      category: String(i.category || "menu"),
      available: i.available !== false
    }))
  };
  await env.MENULINX.put("menu:current", JSON.stringify(menu));
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
}
