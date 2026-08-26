// ダミーデータ（X-LABO 代理店制度・初期リリース設計）
// 個人代理店（シルバー/ゴールド/プラチナ）＋ 法人代理店（ルビー・招待制）

import { Agent, Case, User, Lead, AuditLog } from "./types";
import { shotKey } from "./calc";
import { MONTHLY_FEE } from "./config";

// 紹介関係：
//  RUBY-001 みらいホールディングス（ルビー）
//    ├ XL-001 田中商会（プラチナ・法人）
//    ├ XL-003 山田（ゴールド）
//    └ XL-006 伊藤（シルバー）
//  RUBY-002 ゼンネクスト（ルビー）
//    ├ XL-002 佐藤エージェント（ゴールド・法人）
//    └ XL-007 渡辺（シルバー）
//  （XL-004/005/008/009 は紹介元なし＝本部直）
export const AGENTS: Agent[] = [
  { id: "001", no: "XL-001", name: "田中商会", kind: "individual", rank: "platinum", referrerId: "010", category: "法人", code: "XL-A123", bank: "みずほ ****1234", joinDate: "2026-02-01", basePt: 210000, activeUsers: 142 },
  { id: "002", no: "XL-002", name: "佐藤エージェント", kind: "individual", rank: "gold", referrerId: "011", category: "法人", code: "XL-B456", bank: "三菱UFJ ****5678", joinDate: "2026-03-01", basePt: 40000, activeUsers: 58 },
  { id: "003", no: "XL-003", name: "山田", kind: "individual", rank: "gold", referrerId: "010", category: "一般", code: "XL-A1A7", bank: "楽天 ****2001", joinDate: "2026-03-15", basePt: 62000, activeUsers: 71 },
  { id: "004", no: "XL-004", name: "鈴木", kind: "individual", rank: "silver", referrerId: null, category: "一般", code: "XL-A2B8", bank: "住信SBI ****2002", joinDate: "2026-04-01", basePt: 12000, activeUsers: 22 },
  { id: "005", no: "XL-005", name: "高橋", kind: "individual", rank: "silver", referrerId: null, category: "一般", code: "XL-A3C9", bank: "PayPay ****2003", joinDate: "2026-04-20", basePt: 6000, activeUsers: 11 },
  { id: "006", no: "XL-006", name: "伊藤", kind: "individual", rank: "silver", referrerId: "010", category: "一般", code: "XL-B1D1", bank: "GMOあおぞら ****3001", joinDate: "2026-05-01", basePt: 18000, activeUsers: 33 },
  { id: "007", no: "XL-007", name: "渡辺", kind: "individual", rank: "silver", referrerId: "011", category: "一般", code: "XL-B2E2", bank: "ゆうちょ ****3002", joinDate: "2026-05-10", basePt: 3000, activeUsers: 7 },
  { id: "008", no: "XL-008", name: "中村事務所", kind: "individual", rank: "gold", referrerId: null, category: "法人", code: "XL-C1F3", bank: "みずほ ****4002", joinDate: "2026-05-20", basePt: 88000, activeUsers: 64 },
  { id: "009", no: "XL-009", name: "小林", kind: "individual", rank: "silver", referrerId: null, category: "一般", code: "XL-C2G4", bank: "PayPay ****4001", joinDate: "2026-06-01", basePt: 1500, activeUsers: 4 },
  // 法人代理店（ルビー・招待制）。ランキング／ランク判定は対象外。
  { id: "010", no: "RUBY-001", name: "みらいホールディングス", kind: "ruby", rank: "platinum", referrerId: null, category: "法人", code: "RUBY-001", bank: "三井住友 ****9001", joinDate: "2026-01-20", basePt: 0, activeUsers: 25 },
  { id: "011", no: "RUBY-002", name: "ゼンネクスト", kind: "ruby", rank: "gold", referrerId: null, category: "法人", code: "RUBY-002", bank: "みずほ ****9002", joinDate: "2026-02-05", basePt: 0, activeUsers: 12 },
];

const names = ["中村", "小林", "加藤", "吉田", "山本", "佐々木", "松本", "井上", "木村", "林", "斎藤", "清水", "山崎", "森", "池田", "橋本", "阿部", "石川", "前田", "藤田"];
let ni = 0;
const cust = () => names[ni++ % names.length] + "様";

type Row = [string, "給付" | "税務法務", ("対応中" | "成約" | "キャンセル")?, number?];

// [代理店id, 種別, ステータス?, ショット報酬?]
function mk(month: string, rows: Row[]): Case[] {
  return rows.map((r, i) => {
    const [agentId, type, status = "成約", shot] = r;
    const day = String((i % 26) + 2).padStart(2, "0");
    return {
      id: `${month}-${agentId}-${i}`,
      date: `${month}-${day}`,
      agentId,
      type,
      customer: cust(),
      status,
      shotReward: type === "給付" ? (shot ?? 50000) : undefined,
      staff: ["岩﨑", "大城", "神谷", "石田"][i % 4],
    };
  });
}

export const CASES: Case[] = [
  ...mk("2026-08", [
    ["001", "給付", "成約", 60000],
    ["001", "税務法務", "成約"],
    ["003", "給付", "成約", 50000],
    ["003", "給付", "成約", 50000],
    ["003", "税務法務", "成約"],
    ["002", "給付", "成約", 50000],
    ["008", "給付", "成約", 55000],
    ["006", "給付", "対応中"],
    ["006", "税務法務", "成約"],
    ["004", "給付", "成約", 50000],
    ["005", "税務法務", "成約"],
    ["007", "給付", "対応中"],
    ["009", "給付", "キャンセル", 50000],
    ["010", "給付", "成約", 60000], // ルビー自身も個人代理店として案件を持てる
  ]),
];

// 案件番号を採番（表示用）
CASES.forEach((c, i) => { c.caseNo = "C-" + String(i + 1).padStart(4, "0"); });

// 報酬の初期支払シード（既に振込済みのショット報酬）
export const INITIAL_PAID: Record<string, { amount: number; date: string }> = {
  [shotKey("2026-08-001-0")]: { amount: 60000, date: "2026-08-15" },
};

// ── 会員（アクティブユーザー）データ生成 ──────────────────────────
// 各代理店の「有効」会員数 = mock の activeUsers に一致させる（＝アクティブpt整合）。
// さらに一部は解約会員を追加（アクティブ数には数えない）。
const memberSurnames = [
  "田中", "鈴木", "高橋", "渡辺", "伊藤", "山本", "中村", "小林", "加藤", "吉田",
  "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "斎藤", "清水", "森",
];
const prefs = ["東京都", "神奈川県", "埼玉県", "千葉県", "大阪府", "愛知県", "福岡県", "北海道"];
const payMethods = ["クレジットカード", "口座振替", "PayPay"];

let mid = 0;
const mkUser = (agentId: string, joinDate: string, canceled: boolean): User => {
  mid++;
  const name = memberSurnames[mid % memberSurnames.length];
  const givenIdx = mid % 4;
  const fullName = `${name} ${["太郎", "花子", "健", "美咲"][givenIdx]}`;
  return {
    id: `u-${mid}`,
    memberNo: "U-" + String(mid).padStart(4, "0"),
    agentId,
    name: fullName,
    phone: "090-" + String(1000 + (mid * 37) % 9000) + "-" + String(1000 + (mid * 71) % 9000),
    lineName: ["taro", "hana", "ken", "mai", "sho", "yui"][mid % 6] + (mid % 90),
    email: `member${mid}@example.com`,
    pref: prefs[mid % prefs.length],
    joinDate,
    startDate: joinDate,
    cancelDate: canceled ? "2026-07-31" : undefined,
    monthlyFee: MONTHLY_FEE,
    payMethod: payMethods[mid % payMethods.length],
    payStatus: canceled ? "停止" : "入金済",
    status: canceled ? "解約" : "有効",
  };
};

export const USERS: User[] = [];
AGENTS.forEach((a) => {
  for (let i = 0; i < a.activeUsers; i++) USERS.push(mkUser(a.id, a.joinDate, false));
  // 代理店の一部に解約会員を1名（アクティブ数には影響しない）
  if (a.activeUsers >= 20) USERS.push(mkUser(a.id, a.joinDate, true));
});

// ── 操作ログ 初期データ（誰がいつ何を変更したか） ──────────────────
export const INITIAL_LOGS: AuditLog[] = [
  { id: "log-seed-3", time: "2026-08-04T10:22:00+09:00", actor: "運営管理者", role: "運営管理者", action: "報酬振込", detail: "XL-001 へ 60,000円（2026-08-15）" },
  { id: "log-seed-2", time: "2026-08-03T15:05:00+09:00", actor: "運営管理者", role: "運営管理者", action: "会員化（申込→登録完了）", detail: "L-0004 藤井 桃 → 会員登録（XL-006へ紐付け）" },
  { id: "log-seed-1", time: "2026-08-02T09:40:00+09:00", actor: "西村 彩", role: "申込フォーム", action: "申込受付", detail: "L-0002 西村 彩（紹介元 XL-003）" },
];

// ── 見込み客（申込）: 代理店の紹介URLから届いた申込の例 ──────────────
export const LEADS: Lead[] = [
  { id: "L1", leadNo: "L-0001", agentId: "003", name: "大野 翔", phone: "090-2233-4455", lineName: "sho_o", email: "sho@example.com", pref: "東京都", status: "申込", date: "2026-08-03", message: "詳しく聞きたいです" },
  { id: "L2", leadNo: "L-0002", agentId: "003", name: "西村 彩", phone: "080-1122-3344", lineName: "aya_n", pref: "神奈川県", status: "対応中", date: "2026-08-02" },
  { id: "L3", leadNo: "L-0003", agentId: "004", name: "岡本 亮", phone: "070-9988-7766", lineName: "ryo_ok", pref: "埼玉県", status: "申込", date: "2026-08-04" },
  { id: "L4", leadNo: "L-0004", agentId: "006", name: "藤井 桃", phone: "090-5566-7788", pref: "大阪府", status: "登録完了", date: "2026-07-28" },
];
