// X-LABO 代理店制度の確定仕様をここに集約。ルール変更はこのファイルで完結。
// 出典：共有画像「XLABO 代理店制度 概要」＋ 議事録（2026-08-04）。

import { IndivRank, RankDef } from "./types";

export const BRAND = "X-LABO";
export const COMPANY = "X-LABO";

// ── ランク（個人代理店・毎月1日にポイントで判定／昇格・降格あり） ───────────
//  必要保有ポイント：シルバー 0〜24,999 / ゴールド 25,000〜199,999 / プラチナ 200,000〜
//  アクティブユーザー1名あたりのポイント：シルバー500 / ゴールド1,000 / プラチナ1,500
export const RANKS: RankDef[] = [
  { key: "silver", label: "シルバー", min: 0, max: 24999, rate: 500, usersGuide: "〜約49名", color: "#9aa6b2", emoji: "🥈" },
  { key: "gold", label: "ゴールド", min: 25000, max: 199999, rate: 1000, usersGuide: "約50〜199名", color: "#e9b949", emoji: "🥇" },
  { key: "platinum", label: "プラチナ", min: 200000, max: null, rate: 1500, usersGuide: "約200名以上", color: "#7d5cff", emoji: "💎" },
];

// 法人代理店（ルビー）：招待制・審査あり。ランキング／ランク判定は対象外。
export const RUBY = { label: "ルビー", emoji: "🔴", color: "#e0245e" };

// ── ポイント付与ルール ───────────────────────────────────────────
// 給付サポート成約（1件あたり）：ポイント + ショット報酬あり。
//  本部確定（2026-08）：80,000pt → 60,000pt へ変更。
export const KYUFU_PT = 60000; // 確定値（旧80,000から変更）
export const KYUFU_PT_OLD = 80000; // 変更前（参考）

export function kyufuPt(): number {
  return KYUFU_PT;
}

// 税務・法務案件（1件あたり）：ポイントのみ（ショット報酬なし）。
//  ※pt額は共有画像に数値記載なし。暫定値。本部確定後にここを修正。
export const ZEIMU_PT = 30000; // 暫定（要本部確定）

// アクティブユーザー1名あたりのポイント（当月ランクのレートを適用）
export function rateOf(rank: IndivRank): number {
  return RANKS.find((r) => r.key === rank)?.rate ?? RANKS[0].rate;
}

// 会員の月額基本料金（制度マスタ）
export const MONTHLY_FEE = 7980;

// pt → 円 換算（本人報酬 = アクティブユーザーpt × 1円）。
//  ※本人報酬に反映するのは「アクティブユーザーpt」のみ。税務法務pt・紹介ptは対象外。
export const PT_TO_YEN = 1;

// ── ルビー（法人代理店）紹介の扱い（制度マスタ 2026/08 確定） ──────────
// 加算pt：紹介した代理店の月間総ptの10%（※ランキング・ランク判定のみ／報酬ではない）。
// 報酬：紹介代理店の「アクティブユーザーptのみ」×50%（案件pt・給付ショット報酬は対象外）。
export const RUBY_REWARD_RATE = 0.5; // 50%（報酬・対象=紹介先のアクティブユーザーptのみ）
export const REFERRAL_PT_RATE = 0.1; // 10%（ランキング・ランク判定用の加算pt）

// 締め：月末締め → 翌月15日払い
export const PAY_DAY = 15;

// 集計対象月（プロトタイプ固定。実運用は当月自動）
export const CURRENT_MONTH = "2026-08";

// ── ランク判定 ───────────────────────────────────────────────
// 保有ポイントからランクを決定（毎月1日判定・昇格/降格あり）。
export function rankOf(pt: number): RankDef {
  let r = RANKS[0];
  for (const d of RANKS) if (pt >= d.min) r = d;
  return r;
}

// 次のランク（プラチナなら null）
export function nextRank(pt: number): RankDef | null {
  for (const d of RANKS) if (pt < d.min) return d;
  return null;
}

export function rankDef(rank: IndivRank): RankDef {
  return RANKS.find((r) => r.key === rank) ?? RANKS[0];
}

// カテゴリー
export const CATEGORIES = ["法人", "一般"] as const;

// 案件種別
export const CASE_TYPES = ["給付", "税務法務"] as const;
export const CASE_TYPE_LABEL: Record<string, string> = {
  給付: "給付サポート成約",
  税務法務: "税務・法務案件",
};
export const CASE_STATUSES = ["対応中", "成約", "キャンセル"] as const;

// 案件種別ごとの「既定」付与ポイント（フォームの初期値などに使用）
export function casePt(type: string): number {
  return type === "給付" ? kyufuPt() : ZEIMU_PT;
}

// 実際の付与ポイント：案件ごとの指定を優先（本部確定2026/08・案件によって変動可）。
// 未設定なら種別の既定値。
export function casePoints(c: { type: string; points?: number }): number {
  return c.points ?? casePt(c.type);
}

// 表示ヘルパ
export const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");
export const pt = (n: number) => Math.round(n).toLocaleString("ja-JP") + "pt";

// ランク表示（ルビーは区分優先）
export function rankLabelOf(a: { kind: string; rank: IndivRank }): { label: string; emoji: string; color: string } {
  if (a.kind === "ruby") return { label: RUBY.label, emoji: RUBY.emoji, color: RUBY.color };
  const d = rankDef(a.rank);
  return { label: d.label, emoji: d.emoji, color: d.color };
}
