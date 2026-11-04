// Builds rows matching 7-11「一般交貨便-取貨付款」official import template (18 columns, A1:R1 merged title).
export type Seller = {
  senderName: string; senderPhone: string; senderEmail: string;
  accountName: string; bankCode: string; branchCode: string; accountNo: string;
  accountType: "個人戶" | "商業戶"; idNo: string;
};
export const emptySeller: Seller = { senderName: "", senderPhone: "", senderEmail: "", accountName: "", bankCode: "", branchCode: "", accountNo: "", accountType: "個人戶", idNo: "" };

export const TITLE_711 = "一般交貨便-取貨付款(以下欄位皆必填)";
export const HEADERS_711 = [
  "", "寄件人姓名", "寄件人電話", "寄件人mail", "收款人的帳戶名稱", "收款人的金融機構", "收款人的金融機構分行(7碼)",
  "收款人的銀行帳號", "收款人的銀行開戶之身分ID", "銀行開戶使用之身分資料", "包裏價值", "收件門市", "收件門市店號",
  "收件人姓名\n(請填寫證件姓名)", "收件人電話", "收件人mail",
  "退貨門市\n(非必填，退貨門市未填寫者，則依原寄件門市為退貨門市。此欄位有填寫者，退貨門市店號必填)",
  "退貨門市店號\n(非必填，退貨門市未填寫者，則依原寄件門市為退貨門市。此欄位有填寫者，退貨門市必填)",
];

type O = { total: number; shipping: { name: string; phone: string; email: string; storeName: string; storeCode: string } };

export function missingSeller(s: Seller) {
  return (Object.keys(emptySeller) as (keyof Seller)[]).filter((k) => !String(s[k] ?? "").trim());
}

export function build711Rows(orders: O[], s: Seller): (string | number)[][] {
  const title = [TITLE_711, ...Array(17).fill("")];
  const rows = orders.map((o) => [
    "", s.senderName, s.senderPhone, s.senderEmail, s.accountName, s.bankCode, s.branchCode, s.accountNo, s.accountType, s.idNo,
    o.total, o.shipping.storeName.replace(/門市$/, "") + "門市", o.shipping.storeCode,
    o.shipping.name, o.shipping.phone, o.shipping.email, "", "",
  ]);
  return [title, HEADERS_711, ...rows];
}
