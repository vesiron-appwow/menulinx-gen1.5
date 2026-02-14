// src/lib/kv.ts

import type { App } from "../types/app";

export type KVNamespaceLike = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list?(options?: { prefix?: string }): Promise<{ keys: Array<{ name: string }> }>;
};

export type RuntimeEnv = {
  MENULINX_KV?: KVNamespaceLike;
};

const devStore = new Map<string, string>();

const devKV: KVNamespaceLike = {
  async get(key: string) {
    return devStore.has(key) ? devStore.get(key)! : null;
  },
  async put(key: string, value: string) {
    devStore.set(key, value);
  },
  async delete(key: string) {
    devStore.delete(key);
  },
  async list(options?: { prefix?: string }) {
    const keys = Array.from(devStore.keys())
      .filter(k => !options?.prefix || k.startsWith(options.prefix))
      .map(name => ({ name }));
    return { keys };
  }
};

export function getEnv(locals: App.Locals): { MENULINX_KV: KVNamespaceLike } {
  const env = locals?.runtime?.env as RuntimeEnv | undefined;

  // If Cloudflare KV exists, use it
  if (env?.MENULINX_KV) {
    return { MENULINX_KV: env.MENULINX_KV };
  }

  // Otherwise use dev in-memory KV
  return { MENULINX_KV: devKV };
}

export async function kvGetJSON<T>(
  kv: KVNamespaceLike,
  key: string
): Promise<T | null> {
  const raw = await kv.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function kvPutJSON(
  kv: KVNamespaceLike,
  key: string,
  value: unknown
): Promise<void> {
  await kv.put(key, JSON.stringify(value));
}
