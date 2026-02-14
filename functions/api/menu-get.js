export async function onRequestGet({ env }) {
  const raw = await env.MENULINX.get("menu:current");
  const menu = raw ? JSON.parse(raw) : {
    restaurantName: "Demo Cafe",
    deliveryFee: 2.5,
    items: []
  };
  return new Response(JSON.stringify({ ok: true, menu }), {
    headers: { "content-type": "application/json" }
  });
}
