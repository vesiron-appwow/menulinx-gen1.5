import type { APIRoute } from "astro";
import { getEnv } from "../../../lib/kv";
import { keyMenu } from "../../../lib/keys";

export const prerender = false;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const { MENULINX_KV } = getEnv(locals);

  const url = new URL(request.url);
  const venueId = String(url.searchParams.get("venueId") || "").trim();

  if (!venueId) {
    return json(400, { ok: false, error: "Missing venueId" });
  }

  const menu = {
    venueId,
    currency: "GBP",
    updatedAt: Date.now(),
    sections: [
      {
        sectionId: "mains",
        title: "Mains",
        items: [
          {
            itemId: "burger-1",
            name: "Classic Burger",
            description: "Beef patty, cheese, lettuce, tomato",
            pricePence: 850,
            available: true,
          },
          {
            itemId: "burger-2",
            name: "Veggie Burger",
            description: "Plant-based patty with house sauce",
            pricePence: 800,
            available: true,
          },
        ],
      },
      {
        sectionId: "sides",
        title: "Sides",
        items: [
          {
            itemId: "fries-1",
            name: "Fries",
            description: "Golden, lightly salted",
            pricePence: 300,
            available: true,
          },
        ],
      },
      {
        sectionId: "drinks",
        title: "Drinks",
        items: [
          {
            itemId: "drink-1",
            name: "Soft Drink",
            description: "Cola / Lemonade / Orange",
            pricePence: 200,
            available: true,
          },
        ],
      },
    ],
  };

  await MENULINX_KV.put(keyMenu(venueId), JSON.stringify(menu));

  return json(200, { ok: true, menu });
};
