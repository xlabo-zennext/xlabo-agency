// X-LABO 代理店管理アプリ — 型定義（初期リリース設計 2026/08）
// ベース：退職サポートプラス 代理店管理アプリ。ポイント制度を X-LABO 仕様に置換。

// 個人代理店ランク（毎月1日にポイントで判定・昇格/降格あり）
export type IndivRank = "silver" | "gold" | "platinum";

// 代理店区分：個人代理店（シルバー〜プラチナ）／ 法人代理店（ルビー・招待制）
export type AgentKind = "individual" | "ruby";

// 案件種別（ポイント加算対象）
//  給付   : 給付サポート成約（ポイント + ショット報酬あり）
//  税務法務: 税務・法務案件（ポイントのみ・ショット報酬なし）
export type CaseType = "給付" | "税務法務";

// 案件ステータス（成約でポイント確定・キャンセルでマイナス）
export type CaseStatus = "対応中" | "成約" | "キャンセル";

// 報酬（お金）の種類。※ポイントとは別管理（ポイント≠報酬）
//  本人報酬     : アクティブユーザーpt × 1円（税務法務pt・紹介ptは対象外）
//  ショット報酬 : 給付サポート成約ごと
//  ルビー紹介報酬: 紹介先のアクティブユーザーpt × 50%
export type RewardKind = "本人報酬" | "ショット報酬" | "ルビー紹介報酬";
export type RewardStatus = "未払い" | "支払済";

// 会員（アクティブユーザー）ステータス
export type MemberStatus = "有効" | "停止" | "解約";

// 会員（アクティブユーザー）。代理店が獲得する月額会員（既定 7,980円/月）。
// 「有効」会員の人数がその代理店のアクティブユーザー数になる。
export interface User {
  id: string;
  memberNo?: string; // 会員番号 例 U-0001
  agentId: string; // 担当代理店
  name: string;
  phone?: string;
  lineName?: string;
  email?: string;
  pref?: string; // 都道府県
  joinDate: string; // 登録日
  startDate?: string; // 利用開始日
  cancelDate?: string; // 解約日
  monthlyFee: number; // 月額料金（既定 7,980）
  payMethod?: string; // 支払い方法
  payStatus?: string; // 支払いステータス
  status: MemberStatus;
  note?: string;
}

export interface Agent {
  id: string;
  no: string; // 代理店番号（表示用）例 XL-001 / RUBY-001
  name: string; // 本部内での表示名
  kind: AgentKind; // individual / ruby（法人）
  rank: IndivRank; // 当月の適用ランク（個人）。ルビーも個人代理店としての基準ランクを保持
  referrerId: string | null; // 紹介元（ルビーの50%報酬・10%pt加算の集計に使用）
  category: "法人" | "一般"; // 表示・ランキング区分
  code: string; // 紹介コード
  bank: string; // 報酬振込口座（表示用サマリ）
  joinDate: string;
  basePt: number; // 移行前の保有pt（データ移行相当）
  activeUsers: number; // 当月アクティブユーザー数（本部が手入力／スプレッドシート反映）

  // 代理店登録フォームの項目（自己登録）
  furigana?: string;
  birthday?: string;
  email?: string;
  phone?: string;
  zip?: string;
  address?: string;
  // 報酬振込口座（5項目）
  bankName?: string;
  branch?: string;
  acctType?: string;
  acctNo?: string;
  acctHolder?: string;
}

export interface Case {
  id: string;
  caseNo?: string; // 案件番号 例 C-0001（表示用）
  date: string; // 案件日（登録日）
  agentId: string; // 担当代理店
  type: CaseType; // 給付 / 税務法務
  customer: string; // 対象者名
  status: CaseStatus;
  points?: number; // 付与ポイント（案件ごとに可変・本部確定2026/08）。未設定なら種別の既定値を使用
  shotReward?: number; // 給付のみ：ショット報酬（本部が案件ごとに手入力・円）
  staff?: string; // 担当者（社内）
  note?: string;
}

// 報酬（振込）履歴。ショット報酬・ルビー紹介報酬を支払った単位。
export interface Reward {
  id: string;
  agentId: string;
  kind: RewardKind;
  amount: number;
  date: string;
  refId?: string; // caseId（ショット）／ 集計月（ルビー）
  note?: string;
}

// 見込み客（申込）。代理店の紹介URL/QRから最低限の情報で申込→運営が会員化する。
export type LeadStatus = "申込" | "対応中" | "登録完了" | "見送り";
export interface Lead {
  id: string;
  leadNo?: string; // 申込番号 例 L-0001
  agentId: string; // 紹介元代理店（紹介コードから解決）
  name: string;
  phone?: string;
  lineName?: string;
  email?: string;
  pref?: string;
  message?: string; // 備考・要望
  status: LeadStatus;
  date: string; // 申込日
  convertedUserId?: string; // 会員化した場合の会員ID
}

// 操作ログ（誰がいつ何を変更したか）
export type Role = "運営管理者" | "代理店" | "ルビー代理店" | "申込フォーム";
export interface AuditLog {
  id: string;
  time: string; // ISO日時
  actor: string; // 操作者
  role: Role;
  action: string; // 例「案件登録」「会員解約」
  detail: string; // 対象の説明
}

export interface RankDef {
  key: IndivRank;
  label: string;
  min: number; // 必要保有ポイント（この値以上でこのランク）
  max: number | null; // 上限（表示用・null=上限なし）
  rate: number; // アクティブユーザー1名あたりのポイント
  usersGuide: string; // アクティブユーザー数の目安
  color: string;
  emoji: string;
}
