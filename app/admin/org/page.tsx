"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { statOf } from "@/lib/calc";
import { IndivRank } from "@/lib/types";
import { pt, RANKS, rankLabelOf, CURRENT_MONTH } from "@/lib/config";

export default function Org() {
  const { agents, stats, addAgent, setRank } = useStore();
  const [form, setForm] = useState({ kind: "individual", rank: "silver", referrerId: "", category: "一般", name: "", bank: "" });
  const [toast, setToast] = useState("");
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  const rubies = agents.filter((a) => a.kind === "ruby");
  const nameOf = (id: string | null) => (id ? agents.find((a) => a.id === id)?.no : null);

  const submit = () => {
    if (!form.name.trim()) return flash("代理店名を入力してください");
    const isRuby = form.kind === "ruby";
    addAgent({
      name: form.name.trim(),
      kind: isRuby ? "ruby" : "individual",
      rank: (isRuby ? "silver" : form.rank) as IndivRank,
      referrerId: form.referrerId || null,
      category: form.category as "法人" | "一般",
      bank: form.bank || "未登録",
      joinDate: `${CURRENT_MONTH}-01`,
      activeUsers: 0,
    });
    flash(isRuby ? "ルビー代理店を登録しました（RUBY-xxx・招待制）✓" : "代理店を登録し、番号・紹介コードを発行しました ✓");
    setForm((f) => ({ ...f, name: "", bank: "" }));
  };

  // ルビー配下 → 個人 → 本店直、の順で一覧
  const rubyGroups = rubies.map((r) => ({ ruby: r, children: agents.filter((a) => a.referrerId === r.id) }));
  const direct = agents.filter((a) => a.kind !== "ruby" && !a.referrerId);

  return (
    <div>
      <h2 className="h2">組織・代理店管理</h2>
      <p className="sub">個人代理店（シルバー/ゴールド/プラチナ）と法人代理店（ルビー・招待制）を管理。ルビーは紹介先の月間ptの50%を報酬、10%を加算ptとして受け取ります。</p>

      <div className="grid2" style={{ alignItems: "start" }}>
        <div className="stack" style={{ gap: 14 }}>
          {/* ランク判定 */}
          <div className="card">
            <strong>ランク判定（毎月1日・保有ptで昇格/降格）</strong>
            <p className="label" style={{ margin: "4px 0 10px" }}>当月の保有ptから翌月ランクを判定。「判定を適用」で反映します。ルビーは対象外。</p>
            <table>
              <thead><tr><th>代理店</th><th>現在</th><th style={{ textAlign: "right" }}>当月保有pt</th><th>判定→翌月</th><th></th></tr></thead>
              <tbody>
                {agents.filter((a) => a.kind !== "ruby").map((a) => {
                  const s = statOf(stats, a.id)!;
                  const changed = s.judgedRank.key !== a.rank;
                  const up = RANKS.findIndex((r) => r.key === s.judgedRank.key) > RANKS.findIndex((r) => r.key === a.rank);
                  return (
                    <tr key={a.id}>
                      <td><strong>{a.no}</strong> <span className="label">{a.name}</span></td>
                      <td><span className="label">{s.currentRank.emoji}{s.currentRank.label}</span></td>
                      <td style={{ textAlign: "right" }} className="ruby">{pt(s.monthPt)}</td>
                      <td>
                        <span className="label">{s.judgedRank.emoji}{s.judgedRank.label}</span>
                        {changed && <span className={"pill " + (up ? "green" : "red")} style={{ marginLeft: 6 }}>{up ? "▲昇格" : "▼降格"}</span>}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn ghost sm" disabled={!changed} onClick={() => { setRank(a.id, s.judgedRank.key); flash(`${a.no} を ${s.judgedRank.label} に更新 ✓`); }}>
                          判定を適用
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 組織ツリー */}
          <div className="card">
            <strong>代理店一覧（{agents.length}社）</strong>
            <div className="stack" style={{ gap: 10, marginTop: 12 }}>
              {rubyGroups.map(({ ruby, children }) => {
                const rs = statOf(stats, ruby.id)!;
                return (
                  <div key={ruby.id}>
                    <div className="rankrow" style={{ borderColor: "#f6bccd", background: "var(--ruby2)" }}>
                      <span style={{ fontSize: 18 }}>🔴</span>
                      <div className="grow">
                        <strong>{ruby.no}・{ruby.name}</strong>
                        <div className="label">ルビー（法人・招待制）・紹介 {children.length}社・紹介報酬 {rs.rubyReward.toLocaleString()}円</div>
                      </div>
                    </div>
                    {children.map((c) => {
                      const cs = statOf(stats, c.id)!;
                      const rl = rankLabelOf(c);
                      return (
                        <div key={c.id} className="rankrow" style={{ marginLeft: 22 }}>
                          <span>↳</span>
                          <div className="grow"><strong>{c.no}・{c.name}</strong><div className="label">{rl.emoji}{rl.label}・{c.category}・コード {c.code}</div></div>
                          <span className="label">{pt(cs.monthPt)}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {direct.length > 0 && <div className="label" style={{ marginTop: 4 }}>本店直（紹介元なし）</div>}
              {direct.map((c) => {
                const cs = statOf(stats, c.id)!;
                const rl = rankLabelOf(c);
                return (
                  <div key={c.id} className="rankrow">
                    <span>•</span>
                    <div className="grow"><strong>{c.no}・{c.name}</strong><div className="label">{rl.emoji}{rl.label}・{c.category}・コード {c.code}</div></div>
                    <span className="label">{pt(cs.monthPt)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 新規登録 */}
        <div className="card">
          <strong>代理店・ルビーを新規登録</strong>
          <div className="stack" style={{ gap: 12, marginTop: 14 }}>
            <div className="field"><label>名称</label><input className="input" placeholder="例：小林 / ○○ホールディングス" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid2" style={{ gap: 12 }}>
              <div className="field"><label>区分</label>
                <select className="input" value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}>
                  <option value="individual">個人代理店</option>
                  <option value="ruby">法人代理店（ルビー・招待制）</option>
                </select>
              </div>
              <div className="field"><label>カテゴリー</label>
                <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  <option value="法人">法人</option>
                  <option value="一般">一般</option>
                </select>
              </div>
            </div>
            {form.kind === "individual" && (
              <div className="field"><label>開始ランク</label>
                <select className="input" value={form.rank} onChange={(e) => setForm((f) => ({ ...f, rank: e.target.value }))}>
                  {RANKS.map((r) => <option key={r.key} value={r.key}>{r.emoji} {r.label}（{r.rate}pt/人）</option>)}
                </select>
              </div>
            )}
            <div className="field"><label>紹介元（ルビー・任意）</label>
              <select className="input" value={form.referrerId} onChange={(e) => setForm((f) => ({ ...f, referrerId: e.target.value }))}>
                <option value="">なし（本店直）</option>
                {rubies.map((r) => <option key={r.id} value={r.id}>{r.no}・{r.name}</option>)}
              </select>
            </div>
            {form.kind === "ruby" && (
              <div className="note-box">ルビーは<b>招待制（審査あり）</b>。番号は RUBY-xxx 形式で発行。ランキング・ランク判定は対象外。個人代理店としての報酬も受け取れます。</div>
            )}
            <div className="field"><label>振込先（任意）</label><input className="input" placeholder="銀行 ****0000" value={form.bank} onChange={(e) => setForm((f) => ({ ...f, bank: e.target.value }))} /></div>
            <button className="btn ruby" onClick={submit}>登録 → 番号・紹介コード発行</button>
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
