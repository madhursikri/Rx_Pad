import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureDatabaseReady: vi.fn(async () => undefined)
}));

vi.mock("@/lib/cloudflare-db", () => ({
  ensureDatabaseReady: mocks.ensureDatabaseReady
}));

import { onRequest } from "@/functions/_middleware";

describe("pages middleware", () => {
  it("boots preview mode with the preview database", async () => {
    const next = vi.fn(async () => new Response("ok"));
    const waitUntil = vi.fn();
    const context = {
      env: {
        DB: {} as D1Database,
        RX_PAD_BOOTSTRAP_MODE: "preview"
      },
      next,
      waitUntil
    };

    const response = await onRequest(context);

    expect(waitUntil).toHaveBeenCalledTimes(1);
    expect(mocks.ensureDatabaseReady).toHaveBeenCalledWith(context.env.DB, "preview");
    expect(await response.text()).toBe("ok");
  });

  it("defaults to production mode when preview is not configured", async () => {
    const next = vi.fn(async () => new Response("ok"));
    const waitUntil = vi.fn();
    const context = {
      env: {
        DB: {} as D1Database,
        RX_PAD_BOOTSTRAP_MODE: "production"
      },
      next,
      waitUntil
    };

    await onRequest(context);

    expect(mocks.ensureDatabaseReady).toHaveBeenCalledWith(context.env.DB, "production");
  });
});
