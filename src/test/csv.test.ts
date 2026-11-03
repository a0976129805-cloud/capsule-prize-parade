import { describe, it, expect } from "vitest";
import { ordersToCsv } from "@/lib/csv";

describe("ordersToCsv", () => {
  it("includes recipient, phone, store, store code and total", () => {
    const csv = ordersToCsv([{ id: "ORD-1", total: 300, createdAt: "x", status: "待出貨", shipping: { name: "王小明", phone: "0912", storeName: "台北店", storeCode: "123456" }, items: [{ name: "A" }] }]);
    const line = csv.split("\r\n")[1];
    expect(line).toBe('"ORD-1","王小明","0912","台北店","123456","300","A","x","待出貨"');
  });
});
