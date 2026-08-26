// 計算エンジン：ポイント集計（ランキング・ランク判定）＋ 報酬集計（支払管理）
// ポイントと報酬は別管理（ポイント≠報酬）。

import { Agent, Case } from "./types";
import {
  CURRENT_MONTH, rateOf, casePoints,
  rankOf, rankDef, RUBY_REWARD_RATE, REFERRAL_PT_RATE, PT_TO_YEN,
} from "./config";

const inMonth = (date: string, month: string) => date.startsWith(month);
const activeCase = (c: Case) => c.status === "成約";

// 報酬支払の管理キー（本人報酬＝代理店×月／ショット＝案件単位／ルビー＝代理店×月）
export function honninKey(agentId: string, month: string): string {
  return `honnin::${agentId}::${month}`;
}
export function shotKey(caseId: string): string {
  return `shot::${caseId}`;
}
export function rubyKey(agentId: string, month: string): string {
  return `ruby::${agentId}::${month}`;
}

export interface AgentStat {
  agent: Agent;
  // ── ポイント（ランキング・ランク判定用） ──
  activeUsers: number;
  activeUserPt: number; // アクティブユーザー × 当月ランクのレート
  kyufuCount: number; // 当月の給付サポート成約 件数
  zeimuCount: number; // 当月の税務・法務案件 件数
  casePt: number; // 案件由来のポイント（給付＋税務法務）
  referralPt: number; // 紹介加算pt（紹介先 月間ptの10%／ランキング・ランク判定のみ）
  monthPt: number; // 当月 保有ポイント（activeUserPt + casePt + referralPt）
  basePt: number;
  cumulativePt: number; // 累計（basePt + monthPt）表示用
  currentRank: ReturnType<typeof rankDef>; // 当月の適用ランク
  judgedRank: ReturnType<typeof rankOf>; // 保有ptから判定した「翌月ランク」
  rankingEligible: boolean; // ランキング対象か（ルビーは対象外）

  // ── 報酬（お金・支払管理用） ──
  honninReward: number; // 本人報酬 = アクティブユーザーpt × 1円
  shotReward: number; // 当月の給付ショット報酬 合計
  rubyReward: number; // ルビー：紹介先アクティブユーザーptの50%
  rewardTotal: number; // 当月 報酬合計（本人 + ショット + ルビー）
  paidReward: number; // 支払済
  unpaidReward: number; // 未払い（rewardTotal − paidReward）
}

// 紹介先（自分が referrerId になっている代理店）の当月「総pt」合計。
// 循環を避けるため、総pt = activeUserPt + casePt（referralPt は含めない）。
// → 10%加算pt（紹介者加算pt）の基準。
function baseMonthPt(agentId: string, agents: Agent[], cases: Case[]): number {
  const children = agents.filter((a) => a.referrerId === agentId);
  let sum = 0;
  for (const ch of children) {
    const au = ch.activeUsers * rateOf(ch.rank);
    let cp = 0;
    for (const c of cases) {
      if (c.agentId !== ch.id || !inMonth(c.date, CURRENT_MONTH) || !activeCase(c)) continue;
      cp += casePoints(c);
    }
    sum += au + cp;
  }
  return sum;
}

// 紹介先の「アクティブユーザーptのみ」合計（案件pt・ショット報酬は含めない）。
// → ルビー報酬（50%）の基準（制度マスタ「ルビー報酬対象＝紹介代理店のアクティブユーザーptのみ」）。
function referredActiveUserPt(agentId: string, agents: Agent[]): number {
  return agents
    .filter((a) => a.referrerId === agentId)
    .reduce((sum, ch) => sum + ch.activeUsers * rateOf(ch.rank), 0);
}

export function buildStats(
  agents: Agent[],
  cases: Case[],
  paid: Record<string, { amount: number; date: string }>
): AgentStat[] {
  return agents.map((a) => {
    // ① アクティブユーザー由来のポイント（当月ランクのレート）
    const activeUserPt = a.activeUsers * rateOf(a.rank);

    // ② 案件由来のポイント＋報酬
    let kyufuCount = 0, zeimuCount = 0, casePtSum = 0, shotReward = 0;
    for (const c of cases) {
      if (c.agentId !== a.id || !inMonth(c.date, CURRENT_MONTH) || !activeCase(c)) continue;
      if (c.type === "給付") {
        kyufuCount += 1;
        casePtSum += casePoints(c);
        shotReward += c.shotReward || 0;
      } else {
        zeimuCount += 1;
        casePtSum += casePoints(c);
      }
    }

    // ③ 紹介加算pt（10%）＋ ルビー紹介報酬（50%）
    const childBase = baseMonthPt(a.id, agents, cases);
    // 加算ptはランキング対象（＝個人）にのみ反映。ルビーはランキング対象外なので0。
    const rankingEligible = a.kind !== "ruby";
    const referralPt = rankingEligible ? Math.round(childBase * REFERRAL_PT_RATE) : 0;
    // ルビー報酬 = 紹介先のアクティブユーザーptのみ × 50%（案件pt・ショット報酬は対象外）
    const rubyReward = a.kind === "ruby" ? Math.round(referredActiveUserPt(a.id, agents) * RUBY_REWARD_RATE) : 0;

    const monthPt = activeUserPt + casePtSum + referralPt;
    const cumulativePt = a.basePt + monthPt;

    // ④ 本人報酬 = アクティブユーザーpt × 1円（税務法務pt・紹介ptは対象外）
    const honninReward = activeUserPt * PT_TO_YEN;

    // 報酬合計と支払状況（本人 + ショット + ルビー）
    const rewardTotal = honninReward + shotReward + rubyReward;
    let paidReward = 0;
    for (const c of cases) {
      if (c.agentId !== a.id || c.type !== "給付") continue;
      const p = paid[shotKey(c.id)];
      if (p) paidReward += p.amount;
    }
    const hp = paid[honninKey(a.id, CURRENT_MONTH)];
    if (hp) paidReward += hp.amount;
    const rp = paid[rubyKey(a.id, CURRENT_MONTH)];
    if (rp) paidReward += rp.amount;

    return {
      agent: a,
      activeUsers: a.activeUsers,
      activeUserPt,
      kyufuCount,
      zeimuCount,
      casePt: casePtSum,
      referralPt,
      monthPt,
      basePt: a.basePt,
      cumulativePt,
      currentRank: rankDef(a.rank),
      judgedRank: rankOf(monthPt),
      rankingEligible,
      honninReward,
      shotReward,
      rubyReward,
      rewardTotal,
      paidReward,
      unpaidReward: Math.max(0, rewardTotal - paidReward),
    };
  });
}

export function statOf(stats: AgentStat[], id: string) {
  return stats.find((s) => s.agent.id === id);
}

// ランキング（当月pt or 累計pt／カテゴリ絞り込み可）。ルビーは対象外。
export function ranking(
  stats: AgentStat[],
  scope: "month" | "cumulative",
  category?: "法人" | "一般"
): Array<AgentStat & { pos: number; value: number }> {
  const list = stats
    .filter((s) => s.rankingEligible)
    .filter((s) => !category || s.agent.category === category)
    .map((s) => ({ ...s, pos: 0, value: scope === "month" ? s.monthPt : s.cumulativePt }))
    .sort((a, b) => b.value - a.value);
  let pos = 0, prev = -1;
  list.forEach((s, i) => {
    if (s.value !== prev) { pos = i + 1; prev = s.value; }
    s.pos = pos;
  });
  return list;
}

// ── 報酬支払管理：支払マイルストーン（案件ショット＋ルビー月次） ──────────
export interface RewardItem {
  key: string; // honnin::agentId::month / shot::caseId / ruby::agentId::month
  agentId: string;
  kind: "本人報酬" | "ショット報酬" | "ルビー紹介報酬";
  label: string; // 内訳の説明
  amount: number;
  date: string; // 案件日 / 集計月
  refId: string; // caseId / month
}

export function rewardItems(
  agents: Agent[],
  cases: Case[]
): RewardItem[] {
  const out: RewardItem[] = [];
  // 本人報酬（アクティブユーザーpt × 1円・当月）
  for (const a of agents) {
    const amount = a.activeUsers * rateOf(a.rank) * PT_TO_YEN;
    if (amount <= 0) continue;
    out.push({
      key: honninKey(a.id, CURRENT_MONTH),
      agentId: a.id,
      kind: "本人報酬",
      label: `${CURRENT_MONTH} 本人報酬（アクティブ${a.activeUsers}名）`,
      amount,
      date: `${CURRENT_MONTH}-末`,
      refId: CURRENT_MONTH,
    });
  }
  // ショット報酬（給付・成約・当月）
  for (const c of cases) {
    if (c.type !== "給付" || c.status !== "成約") continue;
    if ((c.shotReward || 0) <= 0) continue;
    out.push({
      key: shotKey(c.id),
      agentId: c.agentId,
      kind: "ショット報酬",
      label: `${c.customer}（給付）`,
      amount: c.shotReward || 0,
      date: c.date,
      refId: c.id,
    });
  }
  // ルビー紹介報酬（50%・当月）＝紹介先のアクティブユーザーptのみ × 50%
  for (const a of agents) {
    if (a.kind !== "ruby") continue;
    const amount = Math.round(referredActiveUserPt(a.id, agents) * RUBY_REWARD_RATE);
    if (amount <= 0) continue;
    out.push({
      key: rubyKey(a.id, CURRENT_MONTH),
      agentId: a.id,
      kind: "ルビー紹介報酬",
      label: `${CURRENT_MONTH} 紹介報酬（50%）`,
      amount,
      date: `${CURRENT_MONTH}-末`,
      refId: CURRENT_MONTH,
    });
  }
  return out;
}

// ポイント履歴（マイページ・報酬用）：当月の内訳を明細で
export interface PtLog {
  date: string;
  label: string;
  pt: number;
  kind: string;
}

export function ptHistory(agentId: string, agents: Agent[], cases: Case[]): PtLog[] {
  const a = agents.find((x) => x.id === agentId);
  if (!a) return [];
  const logs: PtLog[] = [];

  if (a.activeUsers > 0) {
    logs.push({
      date: CURRENT_MONTH,
      label: `アクティブユーザー ${a.activeUsers}名 × ${rateOf(a.rank)}pt`,
      pt: a.activeUsers * rateOf(a.rank),
      kind: "アクティブ",
    });
  }
  for (const c of cases) {
    if (c.agentId !== agentId || !inMonth(c.date, CURRENT_MONTH)) continue;
    if (c.status === "キャンセル") {
      logs.push({ date: c.date, label: `${c.customer}（${c.type}・取消）`, pt: 0, kind: "取消" });
    } else if (c.status === "成約") {
      logs.push({ date: c.date, label: `${c.customer}（${c.type}成約）`, pt: casePoints(c), kind: c.type });
    }
  }
  const childBase = baseMonthPt(agentId, agents, cases);
  if (a.kind !== "ruby" && childBase > 0) {
    logs.push({
      date: CURRENT_MONTH,
      label: "紹介加算（紹介先 月間ptの10%）",
      pt: Math.round(childBase * REFERRAL_PT_RATE),
      kind: "紹介",
    });
  }
  return logs.sort((a, b) => (a.date < b.date ? 1 : -1));
}
