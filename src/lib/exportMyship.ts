// Rows matching 7-11 賣貨便「訂單匯入」template v1.5: 5 note rows, header on row 6, 10 data columns.
import { groupItems } from "@/lib/shop-info";

export const MYSHIP_HEAD = ["＊取件人姓名", "＊取件人手機", "＊取件門市", "* 溫層", "＊商品", "＊訂單金額", "＊運費金額", "買家下訂日期", "商品備註", "其他資訊\n(FB/LINE/IG帳號)"];
const NOTES = [
  ["賣貨便- 訂單匯入檢核"],
  ["請在本檔案填入商品資料，一次最多可以上傳 500 筆商品資料"],
  ["按下 「驗證」 後，會協助您檢查資料格式。"],
  ["【註：若整筆資料不要，請選取整列後按右鍵刪除】"],
  [],
];

type O = { id: string; total: number; fee: number; createdAt: string; items: { name: string }[]; shipping: { name: string; phone: string; email: string; storeCode: string } };

export function buildMyshipRows(orders: O[]): (string | number)[][] {
  const rows = orders.map((o) => [
    o.shipping.name, o.shipping.phone, o.shipping.storeCode, "常溫",
    groupItems(o.items).map((g) => `${g.name} x${g.qty}`).join("、").slice(0, 200),
    o.total - o.fee, o.fee, o.createdAt.split(/[ \s]/)[0] ?? "", o.id, o.shipping.email,
  ]);
  return [...NOTES, MYSHIP_HEAD, ...rows];
}
