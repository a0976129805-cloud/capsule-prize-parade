import { createServerFn } from "@tanstack/react-start";

export const CITIES: [string, string][] = [
  ["01", "台北市"], ["02", "基隆市"], ["03", "新北市"], ["04", "桃園市"], ["05", "新竹市"], ["06", "新竹縣"], ["07", "苗栗縣"],
  ["08", "台中市"], ["10", "彰化縣"], ["11", "南投縣"], ["12", "雲林縣"], ["13", "嘉義市"], ["14", "嘉義縣"], ["15", "台南市"],
  ["17", "高雄市"], ["19", "屏東縣"], ["20", "宜蘭縣"], ["21", "花蓮縣"], ["22", "台東縣"], ["23", "澎湖縣"], ["24", "連江縣"], ["25", "金門縣"],
];

export type Store = { code: string; name: string; address: string };
const EMAP = "https://emap.pcsc.com.tw/EMapSDK.aspx";

async function call(params: Record<string, string>) {
  const r = await fetch(EMAP, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(params).toString() });
  return r.text();
}
const tag = (block: string, t: string) => (block.match(new RegExp(`<${t}>([^<]*)</${t}>`))?.[1] ?? "").trim();
const blocks = (xml: string) => xml.split("<GeoPosition>").slice(1);

export const getTowns = createServerFn({ method: "POST" })
  .validator((d: { cityId: string }) => ({ cityId: String(d.cityId).replace(/\D/g, "").slice(0, 2) }))
  .handler(async ({ data }) => blocks(await call({ commandid: "GetTown", cityid: data.cityId })).map((b) => tag(b, "TownName")).filter(Boolean));

export const searchStores = createServerFn({ method: "POST" })
  .validator((d: { q?: string; city?: string; town?: string }) => ({ q: String(d.q ?? "").trim().slice(0, 30), city: String(d.city ?? "").slice(0, 10), town: String(d.town ?? "").slice(0, 10) }))
  .handler(async ({ data }): Promise<Store[]> => {
    let params: Record<string, string>;
    if (/^\d{6}$/.test(data.q)) params = { commandid: "SearchStore", ID: data.q };
    else if (data.city && data.town) params = { commandid: "SearchStore", city: data.city, town: data.town };
    else if (data.q) params = { commandid: "SearchStore", StoreName: data.q };
    else return [];
    const list = blocks(await call(params)).map((b) => ({ code: tag(b, "POIID"), name: tag(b, "POIName"), address: tag(b, "Address") }));
    const q = data.city && data.town && data.q && !/^\d{6}$/.test(data.q) ? data.q : "";
    return list.filter((s) => /^\d{6}$/.test(s.code) && (!q || s.name.includes(q) || s.address.includes(q))).slice(0, 80);
  });
