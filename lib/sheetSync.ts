// アプリ入力 → Googleスプレッドシート反映（Google Apps Script Web App 経由）
//
// 使い方：
//  1. 対象シートに Apps Script（google-apps-script/Code.gs）を貼り付けてWebアプリとしてデプロイ
//  2. 発行された /exec URL を環境変数 NEXT_PUBLIC_SHEET_WEBAPP_URL に設定（.env.local）
//  3. 以降、アプリでの登録（案件・代理店・アクティブ数）がシートへ追記/更新される
//
// URL未設定なら何もしない（プロトタイプは自己完結のまま動作）。

const WEBAPP_URL = process.env.NEXT_PUBLIC_SHEET_WEBAPP_URL || "";

export function sheetSyncEnabled(): boolean {
  return !!WEBAPP_URL;
}

export interface SyncResult {
  ok: boolean;
  error?: string;
}

// 1件を送信（action: "append" | "upsert"、upsert は keyField で既存行を判定して更新）
export async function pushRows(
  tab: string,
  rows: Record<string, unknown>[],
  action: "append" | "upsert" = "append",
  keyField?: string
): Promise<SyncResult> {
  if (!WEBAPP_URL) return { ok: false, error: "disabled" };
  try {
    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      // text/plain でCORSプリフライトを回避（Apps Script Web App の定番）
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ tab, action, keyField, rows }),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ── アプリの型 → シート各タブの列マッピング ──────────────────────
// タブ名・列名は共有シートの見出しに一致させています。

export const TAB_CASES = "進行中案件・完了案件管理";
export const TAB_AGENTS = "代理店マスタ";
export const TAB_USERS = "ユーザー・アクティブ会員管理";

export function userToRow(u: {
  memberNo?: string; agentNo: string; name: string; phone?: string; lineName?: string;
  joinDate: string; startDate?: string; cancelDate?: string; monthlyFee: number;
  payMethod?: string; payStatus?: string; status: string; email?: string; pref?: string;
}): Record<string, unknown> {
  return {
    "ユーザーID": u.memberNo || "",
    "代理店ID": u.agentNo,
    "氏名": u.name,
    "電話番号": u.phone || "",
    "LINE名": u.lineName || "",
    "登録日": u.joinDate,
    "利用開始日": u.startDate || u.joinDate,
    "解約日": u.cancelDate || "",
    "月額料金": u.monthlyFee,
    "支払い方法": u.payMethod || "",
    "支払いステータス": u.payStatus || "",
    "アクティブ状態": u.status,
    "メール": u.email || "",
    "住所/都道府県": u.pref || "",
  };
}

export function caseToRow(c: {
  caseNo?: string; agentNo: string; customer: string; type: string;
  status: string; date: string; staff?: string; points: number; shotReward?: number;
}): Record<string, unknown> {
  return {
    "案件ID": c.caseNo || "",
    "代理店ID": c.agentNo,
    "ユーザー名": c.customer,
    "案件種別": c.type === "給付" ? "給付サポート成約" : "税務・法務案件",
    "ステータス": c.status,
    "受付日": c.date,
    "担当者": c.staff || "",
    "案件pt": c.points,
    "ショット報酬": c.shotReward ?? "",
    "pt付与状況": c.status === "成約" ? "付与済" : "未付与",
  };
}

export function agentToRow(a: {
  no: string; name: string; phone?: string; lineName?: string; kind: string;
  referrerNo?: string; joinDate: string; rankLabel: string; activeUsers: number; bank?: string;
}): Record<string, unknown> {
  return {
    "代理店ID": a.no,
    "代理店名": a.name,
    "電話番号": a.phone || "",
    "LINE名": a.lineName || "",
    "区分": a.kind === "ruby" ? "ルビー（法人）" : "個人",
    "紹介者代理店ID": a.referrerNo || "",
    "登録日": a.joinDate,
    "稼働状況": "稼働中",
    "現在ランク": a.rankLabel,
    "今月アクティブ数": a.activeUsers,
    "振込先メモ": a.bank || "",
  };
}
