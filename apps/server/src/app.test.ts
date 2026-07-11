import { describe, expect, it, vi } from "vitest";

// Mock Clerk so tests exercise *our* auth guard, not Clerk's SDK/network.
// getAuth returns null => an unauthenticated request.
vi.mock("@clerk/hono", () => ({
  clerkMiddleware:
    () =>
    (_c: unknown, next: () => Promise<void>): Promise<void> =>
      next(),
  getAuth: () => null,
}));

const { app } = await import("./app");

describe("server", () => {
  it("GET /health returns ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("GET /api/widgets rejects unauthenticated requests", async () => {
    const res = await app.request("/api/widgets");
    expect(res.status).toBe(401);
  });
});
