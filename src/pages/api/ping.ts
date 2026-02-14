import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  return new Response("PING OK", { status: 200 });
};

export const POST: APIRoute = async () => {
  return new Response("POST OK", { status: 200 });
};
