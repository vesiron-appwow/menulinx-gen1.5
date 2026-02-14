// src/lib/orders.ts

import type { KVNamespaceLike } from "./kv";
import { kvGetJSON, kvPutJSON } from "./kv";
import { keyOrder, keyOrdersIndex } from "./keys";

export type OrderStatus =
  | "NEW"
  | "ACCEPTED"
  | "READY"
  | "DISPATCHED"
  | "COLLECTED"
  | "CANCELLED";

export type OrderItem = {
  itemId: string;
  name: string;
  qty: number;
  unitPrice?: number;
};

export type OrderRecord = {
  orderId: string;
  venueId: string;

  createdAt: string;
  estimatedReadyAt: string;

  customerName: string;
  customerContact: string;
  customerNote?: string;

  items: OrderItem[];

  status: OrderStatus;

  acceptedAt?: string;
  readyAt?: string;
  completedAt?: string;
};

export function newOrderId(): string {
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase();
  return `MLX-${ts}-${rnd}`;
}

export function computeEstimatedReadyAt(prepMinutes: number): string {
  const ms = Math.max(0, prepMinutes) * 60_000;
  return new Date(Date.now() + ms).toISOString();
}

async function readOrderIndex(
  kv: KVNamespaceLike,
  venueId: string
): Promise<string[]> {
  const raw = await kv.get(keyOrdersIndex(venueId));
  if (!raw) return [];
  try {
    const ids = JSON.parse(raw) as string[];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

async function writeOrderIndex(
  kv: KVNamespaceLike,
  venueId: string,
  ids: string[]
): Promise<void> {
  await kv.put(keyOrdersIndex(venueId), JSON.stringify(ids));
}

async function appendToIndex(
  kv: KVNamespaceLike,
  venueId: string,
  orderId: string
): Promise<void> {
  const ids = await readOrderIndex(kv, venueId);
  if (!ids.includes(orderId)) {
    ids.unshift(orderId);
    await writeOrderIndex(kv, venueId, ids);
  }
}

export async function writeOrder(
  kv: KVNamespaceLike,
  order: OrderRecord
): Promise<void> {
  await kvPutJSON(kv, keyOrder(order.orderId), order);
  await appendToIndex(kv, order.venueId, order.orderId);
}

export async function getOrder(
  kv: KVNamespaceLike,
  orderId: string
): Promise<OrderRecord | null> {
  return kvGetJSON<OrderRecord>(kv, keyOrder(orderId));
}

export async function getOrdersByVenue(
  kv: KVNamespaceLike,
  venueId: string
): Promise<OrderRecord[]> {
  const ids = await readOrderIndex(kv, venueId);
  const orders: OrderRecord[] = [];
  for (const id of ids) {
    const o = await getOrder(kv, id);
    if (o) orders.push(o);
  }
  return orders;
}

export async function updateOrderStatus(
  kv: KVNamespaceLike,
  orderId: string,
  nextStatus: OrderStatus
): Promise<OrderRecord | null> {
  const existing = await getOrder(kv, orderId);
  if (!existing) return null;

  const nowIso = new Date().toISOString();
  const updated: OrderRecord = {
    ...existing,
    status: nextStatus,
    acceptedAt: nextStatus === "ACCEPTED" ? nowIso : existing.acceptedAt,
    readyAt: nextStatus === "READY" ? nowIso : existing.readyAt,
    completedAt:
      nextStatus === "DISPATCHED" ||
      nextStatus === "COLLECTED" ||
      nextStatus === "CANCELLED"
        ? nowIso
        : existing.completedAt,
  };

  await kvPutJSON(kv, keyOrder(orderId), updated);
  return updated;
}
