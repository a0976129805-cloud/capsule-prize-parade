import { describe, it, expect } from "vitest";
import { orderTotal, isExpired } from "@/lib/shipping";
import { buildMyshipRows } from "@/lib/exportMyship";

describe("shipping rules", () => {
  it("charges NT$38 under 10 items", () => expect(orderTotal(Array(9).fill(100))).toEqual({ subtotal: 900, fee: 38, total: 938 }));
  it("is free at 10 items", () => expect(orderTotal(Array(10).fill(100)).fee).toBe(0));
  it("releases vault items after 24 hours", () => {
    const now = new Date("2026-01-02T00:00:00Z");
    expect(isExpired("2026-01-01T00:00:01Z", now)).toBe(false);
    expect(isExpired("2026-01-01T00:00:00Z", now)).toBe(true);
  });
  it("賣貨便 export: header on row 6, 10 columns, goods and fee split", () => {
    const rows = buildMyshipRows([{ id: "ORD-1", total: 938, fee: 38, createdAt: "2026/1/5 上午10:00:00", items: [{ name: "A" }, { name: "A" }], shipping: { name: "王", phone: "0912345678", email: "a@b.c", storeCode: "123456" } }]);
    expect(rows[5]![0]).toBe("＊取件人姓名");
    expect(rows[6]).toHaveLength(10);
    expect(rows[6]![2]).toBe("123456");
    expect(rows[6]![4]).toBe("A x2");
    expect(rows[6]![5]).toBe(900);
    expect(rows[6]![6]).toBe(38);
  });
});
