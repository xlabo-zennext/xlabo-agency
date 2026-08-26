"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { pt, yen, PAY_DAY, CURRENT_MONTH, RUBY_REWARD_RATE, REFERRAL_PT_RATE } from "@/lib/config";

const DEFAULT_PAY_DATE = `${CURRENT_MONTH}-15`;

export default function Rewards() {
  const { agents, rewards, paid, payReward } = useStore();
  const [unpaidOnly, setUnpaidOnly] = useState(true);
  const [dates, setDates] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  const nameOf = (id: string) => agents.find((a) => a.id === id);
  const isPaid = (key: string) => !!paid[key];
  const dateOf = (key: string) => dates[key] ?? DEFAULT_PAY_DATE;

  const visible = useMemo(
    () => rewards.filter((r) => (unpaidOnly ? !isPaid(r.key) : true)).sort((a, b) => (a.kind < b.kind ? -1 : 1)),
    [rewards, unpaidOnly, paid]
  );

  const unpaidTotal = rewards.filter((r) => !isPaid(r.key)).reduce((s, r) => s + r.amount, 0);
  const honninTotal = rewards.filter((r) => r.kind === "本人報酬").reduce((s, r) => s + r.amount, 0);
  const shotTotal = rewards.filter((r) => r.kind === "ショット報酬").reduce((s, r) => s + r.amount, 0);
  const rubyTotal = rewards.filter((r) => r.kind === "ルビー紹介報酬").reduce((s, r) => s + r.amount, 0);

  const pay = (key: string, agentId: string, amount: number) => {
    const a = nameOf(agentId);
    payReward({ key, agentId, amount, date: dateOf(key) });
    flash(`${a?.no} へ ${yen(amount)} を ${dateOf(key)} 付で振込しました ✓`);
  };

  return (
    <div>
      <h2 className="h2">報酬支払管理（お金・ポイントとは別）</h2>
      <p className="sub">
        ショット報酬（給付サポート成約・案件ごと）と、ルビー紹介報酬（紹介先の月間ptの{Math.round(RUBY_REWARD_RATE * 100)}%）を支払管理します。
        月末締め・翌月{PAY_DAY}日払いが目安。※ポイントはランキング用で、ここでは扱いません。
      </p>

      <div className="grid4" style={{ marginBottom: 16 }}>
        <div className="card center"><div className="kpi-num" style={{ color: "var(--orange)" }}>{yen(unpaidTotal)}</div><div className="label">未払い合計</div></div>
        <div className="card center"><div className="kpi-num">{yen(honninTotal)}</div><div className="label">本人報酬（当月）</div></div>
        <div className="card center"><div className="kpi-num green">{yen(shotTotal)}</div><div className="label">ショット報酬（当月）</div></div>
        <div className="card center"><div className="kpi-num ruby">{yen(rubyTotal)}</div><div className="label">ルビー紹介報酬（当月）</div></div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <label className="row" style={{ gap: 6, alignItems: "center", cursor: "pointer" }}>
          <input type="checkbox" checked={unpaidOnly} onChange={(e) => setUnpaidOnly(e.target.checked)} />
          <span className="label">未払いだけ表示</span>
        </label>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>代理店</th><th>種別</th><th>対象</th>
              <th style={{ textAlign: "right" }}>金額</th>
              <th>振込予定日</th>
              <th style={{ textAlign: "right" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && <tr><td colSpan={6} className="muted">条件に合う報酬はありません。</td></tr>}
            {visible.map((r) => {
              const a = nameOf(r.agentId);
              const done = isPaid(r.key);
              return (
                <tr key={r.key}>
                  <td><strong>{a?.no}</strong> <span className="label">{a?.name}</span></td>
                  <td><span className={"pill " + (r.kind === "ルビー紹介報酬" ? "ruby" : r.kind === "ショット報酬" ? "green" : "")}>{r.kind}</span></td>
                  <td><span className="label">{r.label}</span></td>
                  <td style={{ textAlign: "right" }}>
                    {done ? <span className="muted">{yen(r.amount)}</span> : <strong className="green">{yen(r.amount)}</strong>}
                  </td>
                  <td>
                    {done ? (
                      <span className="label">{paid[r.key]?.date}</span>
                    ) : (
                      <input
                        className="input"
                        type="date"
                        style={{ width: 150, padding: "6px 8px", fontSize: 13 }}
                        value={dateOf(r.key)}
                        onChange={(e) => setDates((d) => ({ ...d, [r.key]: e.target.value }))}
                      />
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {done ? <span className="pill green">支払済</span> : <button className="btn ruby sm" onClick={() => pay(r.key, r.agentId, r.amount)}>振込</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="label" style={{ marginTop: 10 }}>
        ※ ルビー紹介報酬 = 紹介先の<b>アクティブユーザーptのみ</b> × {Math.round(RUBY_REWARD_RATE * 100)}%（案件pt・給付ショット報酬は対象外）。
        別途、紹介先の月間総ptの{Math.round(REFERRAL_PT_RATE * 100)}%は<b>加算ポイント</b>としてランキング・ランク判定に反映されます（報酬ではありません）。
      </p>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
