"use client";

import { useStore } from "@/lib/store";
import { statOf, ptHistory } from "@/lib/calc";
import { pt, yen, PAY_DAY } from "@/lib/config";

export default function Rewards() {
  const { stats, viewAgentId, agents, cases, rewards, paid } = useStore();
  const me = statOf(stats, viewAgentId)!;
  const isRuby = me.agent.kind === "ruby";
  const logs = ptHistory(viewAgentId, agents, cases);
  const myRewards = rewards.filter((r) => r.agentId === viewAgentId);

  return (
    <div className="stack" style={{ gap: 14 }}>
      <h2 style={{ margin: "4px 2px", fontSize: 20 }}>💰 報酬</h2>

      <div className="card" style={{ background: "linear-gradient(135deg,#ffffff,#f2f8f4)" }}>
        <div className="label">未払い報酬（翌月{PAY_DAY}日 支払予定）</div>
        <div className="big green">{yen(me.unpaidReward)}</div>
      </div>

      <div className="grid2" style={{ gap: 12 }}>
        <div className="card tight"><div className="label">当月 報酬合計</div><div className="kpi-num">{yen(me.rewardTotal)}</div></div>
        <div className="card tight"><div className="label">本人報酬（アクティブ×1円）</div><div className="kpi-num">{yen(me.honninReward)}</div></div>
        <div className="card tight"><div className="label">ショット報酬（給付）</div><div className="kpi-num">{yen(me.shotReward)}</div></div>
        {isRuby
          ? <div className="card tight"><div className="label">ルビー紹介報酬（50%）</div><div className="kpi-num ruby">{yen(me.rubyReward)}</div></div>
          : <div className="card tight"><div className="label">支払済報酬</div><div className="kpi-num">{yen(me.paidReward)}</div></div>}
      </div>

      <div className="card">
        <strong>報酬明細（当月）</strong>
        <div className="stack" style={{ gap: 8, marginTop: 10 }}>
          {myRewards.length === 0 && <div className="muted" style={{ fontSize: 13 }}>当月の報酬はまだありません。</div>}
          {myRewards.map((r) => {
            const done = !!paid[r.key];
            return (
              <div key={r.key} className="row between" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{yen(r.amount)}</div>
                  <div className="label">{r.kind}・{r.label}</div>
                </div>
                <span className={"pill " + (done ? "green" : "orange")}>{done ? "支払済" : "未払い"}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <strong>ポイント明細（当月）</strong>
        <div className="stack" style={{ gap: 6, marginTop: 10 }}>
          {logs.length === 0 && <div className="muted" style={{ fontSize: 13 }}>当月のポイントはまだありません。</div>}
          {logs.map((l, i) => (
            <div key={i} className="row between" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 6 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{l.label}</div>
                <div className="label">{l.date}</div>
              </div>
              <span style={{ fontWeight: 800 }} className={l.kind === "取消" ? "red" : "ruby"}>
                {l.kind === "取消" ? "±0" : "+" + pt(l.pt)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="muted center" style={{ fontSize: 11, margin: 0 }}>
        ※ 報酬は月末締め・翌月{PAY_DAY}日に本店から銀行振込されます。ポイントはランキング・ランク判定に使用し、報酬（お金）とは別管理です。
      </p>
    </div>
  );
}
