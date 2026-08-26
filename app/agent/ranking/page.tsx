"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { ranking } from "@/lib/calc";
import { pt } from "@/lib/config";

export default function Ranking() {
  const { stats, viewAgentId } = useStore();
  const [scope, setScope] = useState<"month" | "cumulative">("month");
  const [cat, setCat] = useState<"all" | "法人" | "一般">("all");

  const list = ranking(stats, scope, cat === "all" ? undefined : cat);
  const medal = (i: number) => (i === 0 ? "g1" : i === 1 ? "g2" : i === 2 ? "g3" : "");
  const meIsRuby = stats.find((s) => s.agent.id === viewAgentId)?.agent.kind === "ruby";

  return (
    <div className="stack" style={{ gap: 14 }}>
      <h2 style={{ margin: "4px 2px", fontSize: 20 }}>🏆 ランキング</h2>

      {meIsRuby && (
        <div className="note-box">あなた（ルビー代理店）はランキング対象外です。下記は個人代理店のランキングです。</div>
      )}

      <div className="row" style={{ gap: 8 }}>
        {[["month", "当月pt"], ["cumulative", "累計pt"]].map(([k, label]) => (
          <button key={k} className={"btn sm " + (scope === k ? "ruby" : "ghost")} onClick={() => setScope(k as typeof scope)}>{label}</button>
        ))}
      </div>

      <div className="row" style={{ gap: 8 }}>
        {[["all", "すべて"], ["法人", "法人"], ["一般", "一般"]].map(([k, label]) => (
          <button key={k} className={"btn sm " + (cat === k ? "" : "ghost")} onClick={() => setCat(k as typeof cat)}>{label}</button>
        ))}
      </div>

      <div className="stack" style={{ gap: 8 }}>
        {list.map((s, i) => {
          const me = s.agent.id === viewAgentId;
          return (
            <div key={s.agent.id} className={"rankrow" + (me ? " me" : "")}>
              <div className={"medal " + medal(i)}>{s.pos}</div>
              <div className="grow">
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {s.agent.no} {me && <span className="ruby">（あなた）</span>}
                </div>
                <div className="label">{s.currentRank.emoji} {s.currentRank.label}・{s.agent.category}</div>
              </div>
              <div className="ruby" style={{ fontWeight: 800 }}>{pt(s.value)}</div>
            </div>
          );
        })}
        {list.length === 0 && <div className="card"><span className="muted">対象の代理店がいません。</span></div>}
      </div>

      <p className="muted center" style={{ fontSize: 11, margin: "4px 0" }}>
        ※ プライバシー配慮のため、他社は代理店番号のみ表示。ランクは毎月1日に保有ポイントで見直されます（昇格・降格あり）。法人代理店（ルビー）は対象外です。
      </p>
    </div>
  );
}
