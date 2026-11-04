import { describe, it, expect } from "vitest";
import { orderTotal, isExpired } from "@/lib/shipping";
import { build711Rows, emptySeller } from "@/lib/export711";

describe("shipping rules", () => {
  it("charges NT$38 under 10 items", () => expect(orderTotal(Array(9).fill(100))).toEqual({ subtotal: 900, fee: 38, total: 938 }));
  it("is free at 10 items", () => expect(orderTotal(Array(10).fill(100)).fee).toBe(0));
  it("expires after 5 days", () => {
    const now = new Date("2026-01-06T00:00:00Z");
    expect(isExpired("2026-01-01T00:00:01Z", now)).toBe(false);
    expect(isExpired("2026-01-01T00:00:00Z", now)).toBe(true);
  });
  it("711 export has 18 columns with total and store code", () => {
    const rows = build711Rows([{ total: 938, shipping: { name: "王", phone: "0912345678", email: "a@b.c", storeName: "鑫台北", storeCode: "123456" } }], emptySeller);
    expect(rows[2]).toHaveLength(18);
    expect(rows[2][10]).toBe(938);
    expect(rows[2][12]).toBe("123456");
  });
});
