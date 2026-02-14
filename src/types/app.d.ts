// src/types/app.d.ts
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    runtime: {
      env: Record<string, any>;
    };
  }
}
