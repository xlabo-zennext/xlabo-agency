"use client";

import { useStore } from "@/lib/store";
import { statOf, ranking } from "@/lib/calc";
import { nextRank, pt, yen, CURRENT_MONTH, rateOf, RANKS, REFERRAL_PT_RATE } from "@/lib/config";

export default function AgentHome() {
  const { stats, viewAgentId } = useStore();
  const me = statOf(stats, viewAgentId);
  if (!me) return null;
  const a = me.agent;
  const isRuby = a.kind === "ruby";

  // ランキング内の自分の順位（ルビーは対象外）
  const rk = ranking(stats, "month");
  const myPos = rk.find((r) => r.agent.id === viewAgentId)?.pos || 0;
  const total = rk.length;

  // 次のランクまで（保有pt=当月monthPtで判定）
  const base = me.monthPt;
  const next = nextRank(base);
  const cur = me.currentRank;
  const toNext = next ? next.min - base : 0;
  const span = next ? next.min - cur.min : 1;
  const prog = next ? Math.min(100, Math.max(0, ((base - cur.min) / span) * 100)) : 100;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="hero">
        <div className="row between" style={{ marginBottom: 14 }}>
          <div>
            <div className="label">こんにちは</div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{a.name}（{a.no}）</div>
          </div>
          <div className={"rankbadge" + (isRuby ? " ruby" : "")}>
            <span>{isRuby ? "🔴" : cur.emoji}</span>{isRuby ? "ルビー" : cur.label}
          </div>
        </div>

        <div className="label">当月 保有ポイント（ランク判定・ランキング用）</div>
        <div className="big ruby">{pt(me.monthPt)}</div>

        {isRuby ? (
          <div className="info-box" style={{ marginTop: 12, background: "#fff", borderColor: "#f6bccd", color: "#7a1233" }}>
            ルビー代理店はランキング・ランク判定の対象外です。紹介先の月間ptの50%を報酬として受け取ります。
          </div>
        ) : (
          <>
            <div style={{ margin: "12px 0 6px" }} className="progress">
              <div style={{ width: prog + "%" }} />
            </div>
            <div className="row between">
              <span className="label">{cur.label}（{cur.rate}pt/人）</span>
              <span className="label">{next ? `次の${next.label}まで ${pt(toNext)}` : "最高ランク達成 🎉"}</span>
            </div>
          </>
        )}
      </div>

      {/* ポイント（ランキング用） */}
      <div>
        <div className="label" style={{ margin: "0 2px 8px" }}>📊 ポイント（ランキング・ランク判定用）</div>
        <div className="grid2" style={{ gap: 12 }}>
          <div className="card tight">
            <div className="label">アクティブユーザー</div>
            <div className="kpi-num">{me.activeUsers}<span style={{ fontSize: 13 }} className="muted"> 名</span></div>
            <div className="label ruby" style={{ marginTop: 4 }}>{pt(me.activeUserPt)}（×{rateOf(a.rank)}pt）</div>
          </div>
          <div className="card tight">
            <div className="label">今月の順位</div>
            {isRuby ? (
              <div className="kpi-num muted" style={{ fontSize: 18 }}>対象外</div>
            ) : (
              <>
                <div className="kpi-num">#{myPos} <span style={{ fontSize: 13 }} className="muted">/ {total}社</span></div>
                <div className="label green" style={{ marginTop: 4 }}>上位 {total ? Math.round((myPos / total) * 100) : 0}%</div>
              </>
            )}
          </div>
          <div className="card tight">
            <div className="label">案件ポイント（当月）</div>
            <div className="kpi-num">{pt(me.casePt)}</div>
            <div className="label" style={{ marginTop: 4 }}>給付 {me.kyufuCount}件・税務法務 {me.zeimuCount}件</div>
          </div>
          <div className="card tight">
            <div className="label">紹介加算pt（{Math.round(REFERRAL_PT_RATE * 100)}%）</div>
            <div className="kpi-num">{isRuby ? "—" : pt(me.referralPt)}</div>
            <div className="label" style={{ marginTop: 4 }}>紹介先ptの10%</div>
          </div>
        </div>
      </div>

      {/* 報酬（お金） */}
      <div>
        <div className="label" style={{ margin: "0 2px 8px" }}>💰 報酬（実際の支払い・ポイントとは別）</div>
        <div className="grid2" style={{ gap: 12 }}>
          <div className="card tight">
            <div className="label">未払い報酬</div>
            <div className="kpi-num green">{yen(me.unpaidReward)}</div>
            <div className="label" style={{ marginTop: 4 }}>翌月15日 支払予定</div>
          </div>
          <div className="card tight">
            <div className="label">当月 報酬合計</div>
            <div className="kpi-num">{yen(me.rewardTotal)}</div>
          </div>
          <div className="card tight">
            <div className="label">本人報酬（アクティブ×1円）</div>
            <div className="kpi-num">{yen(me.honninReward)}</div>
          </div>
          <div className="card tight">
            <div className="label">ショット報酬（給付）</div>
            <div className="kpi-num">{yen(me.shotReward)}</div>
          </div>
          {isRuby && (
            <div className="card tight">
              <div className="label">ルビー紹介報酬（50%）</div>
              <div className="kpi-num ruby">{yen(me.rubyReward)}</div>
            </div>
          )}
          <div className="card tight">
            <div className="label">支払済報酬</div>
            <div className="kpi-num">{yen(me.paidReward)}</div>
          </div>
        </div>
      </div>

      <div className="info-box">
        📌 ポイントはランキングとランク（{RANKS.map((r) => r.label).join("／")}）の判定に使われ、報酬（お金）とは別物です。ランクは毎月1日に保有ポイントで見直されます。
      </div>
    </div>
  );
}
