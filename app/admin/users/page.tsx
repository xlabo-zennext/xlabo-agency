"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { MemberStatus } from "@/lib/types";
import { yen, CURRENT_MONTH, MONTHLY_FEE, rateOf } from "@/lib/config";

const prefs = ["東京都", "神奈川県", "埼玉県", "千葉県", "大阪府", "愛知県", "福岡県", "北海道", "その他"];
const payMethods = ["クレジットカード", "口座振替", "PayPay"];

export default function Users() {
  const { agents, users, addUser, cancelUser, reactivateUser } = useStore();
  const [agentF, setAgentF] = useState("003");
  const [statusF, setStatusF] = useState<"all" | MemberStatus>("有効");
  const [toast, setToast] = useState("");
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2600); };

  const [form, setForm] = useState({ agentId: "003", name: "", phone: "", lineName: "", email: "", pref: "東京都", payMethod: "クレジットカード" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const nameOf = (id: string) => agents.find((a) => a.id === id)?.no || id;
  const activeCount = (id: string) => users.filter((u) => u.agentId === id && u.status === "有効").length;

  const rows = users.filter((u) => (agentF === "all" || u.agentId === agentF) && (statusF === "all" || u.status === statusF));

  const totalActive = users.filter((u) => u.status === "有効").length;
  const totalCancel = users.filter((u) => u.status === "解約").length;
  const selAgent = agents.find((a) => a.id === agentF);
  const selActive = agentF === "all" ? totalActive : activeCount(agentF);
  const selReward = selAgent ? selActive * rateOf(selAgent.rank) : 0;

  const submit = () => {
    if (!form.name.trim()) return flash("氏名を入力してください");
    addUser({
      agentId: form.agentId, name: form.name.trim(), phone: form.phone.trim(), lineName: form.lineName.trim(),
      email: form.email.trim(), pref: form.pref, joinDate: `${CURRENT_MONTH}-01`, startDate: `${CURRENT_MONTH}-01`,
      monthlyFee: MONTHLY_FEE, payMethod: form.payMethod, payStatus: "入金済",
    });
    flash("会員を登録しました（有効）→ アクティブ数・本人報酬に反映 ✓");
    setForm((f) => ({ ...f, name: "", phone: "", lineName: "", email: "" }));
  };

  return (
    <div>
      <h2 className="h2">会員管理（アクティブユーザー）</h2>
      <p className="sub">月額 {yen(MONTHLY_FEE)} の会員を1名ずつ登録・解約します。有効会員数がその代理店のアクティブユーザー数となり、ポイント・本人報酬に自動反映されます。</p>

      <div className="grid4" style={{ marginBottom: 16 }}>
        <div className="card center"><div className="kpi-num green">{totalActive}</div><div className="label">有効会員 総数</div></div>
        <div className="card center"><div className="kpi-num">{totalCancel}</div><div className="label">解約 総数</div></div>
        <div className="card center"><div className="kpi-num ruby">{selActive}</div><div className="label">{selAgent ? selAgent.no + " の有効会員" : "全体 有効会員"}</div></div>
        <div className="card center"><div className="kpi-num">{yen(selReward)}</div><div className="label">{selAgent ? selAgent.no + " の本人報酬" : "—"}</div></div>
      </div>

      <div className="grid2" style={{ alignItems: "start" }}>
        {/* 会員登録 */}
        <div className="card">
          <strong>会員を新規登録</strong>
          <div className="stack" style={{ gap: 12, marginTop: 12 }}>
            <div className="field"><label>担当代理店</label>
              <select className="input" value={form.agentId} onChange={(e) => set("agentId", e.target.value)}>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.no}・{a.name}</option>)}
              </select>
            </div>
            <div className="grid2" style={{ gap: 12 }}>
              <div className="field"><label>氏名</label><input className="input" placeholder="山田 太郎" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div className="field"><label>電話番号</label><input className="input" placeholder="090-..." value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
            </div>
            <div className="grid2" style={{ gap: 12 }}>
              <div className="field"><label>LINE名</label><input className="input" value={form.lineName} onChange={(e) => set("lineName", e.target.value)} /></div>
              <div className="field"><label>メール</label><input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
            </div>
            <div className="grid2" style={{ gap: 12 }}>
              <div className="field"><label>都道府県</label>
                <select className="input" value={form.pref} onChange={(e) => set("pref", e.target.value)}>
                  {prefs.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="field"><label>支払い方法</label>
                <select className="input" value={form.payMethod} onChange={(e) => set("payMethod", e.target.value)}>
                  {payMethods.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="card" style={{ background: "var(--bg2)", padding: "10px 14px" }}>
              <div className="row between"><span className="label">月額料金</span><strong>{yen(MONTHLY_FEE)}</strong></div>
            </div>
            <button className="btn ruby" onClick={submit}>会員を登録（有効）</button>
          </div>
        </div>

        {/* 会員一覧 */}
        <div className="card">
          <div className="row between wrap" style={{ gap: 8, marginBottom: 10 }}>
            <strong>会員一覧</strong>
            <div className="row" style={{ gap: 6 }}>
              <select className="input" style={{ width: "auto", padding: "6px 10px", fontSize: 12 }} value={agentF} onChange={(e) => setAgentF(e.target.value)}>
                <option value="all">全代理店</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.no}・{a.name}</option>)}
              </select>
              <select className="input" style={{ width: "auto", padding: "6px 10px", fontSize: 12 }} value={statusF} onChange={(e) => setStatusF(e.target.value as "all" | MemberStatus)}>
                <option value="有効">有効</option>
                <option value="解約">解約</option>
                <option value="all">すべて</option>
              </select>
            </div>
          </div>
          <p className="label" style={{ margin: "0 0 8px" }}>{rows.length}件</p>
          <div style={{ maxHeight: 520, overflowY: "auto" }}>
            <table>
              <thead><tr><th>会員</th><th>代理店</th><th>連絡先</th><th>状態</th><th style={{ textAlign: "right" }}>操作</th></tr></thead>
              <tbody>
                {rows.slice(0, 100).map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.memberNo}</strong><div className="label">{u.name}</div></td>
                    <td>{nameOf(u.agentId)}</td>
                    <td><span className="label">{u.phone || "—"}</span></td>
                    <td><span className={"pill " + (u.status === "有効" ? "green" : u.status === "解約" ? "red" : "orange")}>{u.status}</span></td>
                    <td style={{ textAlign: "right" }}>
                      {u.status === "有効"
                        ? <button className="btn ghost sm" onClick={() => { cancelUser(u.id, `${CURRENT_MONTH}-末`); flash("解約しました（アクティブ数から除外）"); }}>解約</button>
                        : <button className="btn ghost sm" onClick={() => { reactivateUser(u.id); flash("再有効化しました"); }}>再有効化</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 100 && <p className="label" style={{ marginTop: 8 }}>※ 先頭100件を表示（代理店で絞り込むと全件見られます）</p>}
            {rows.length === 0 && <p className="sub" style={{ marginTop: 10 }}>該当する会員がいません。</p>}
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
