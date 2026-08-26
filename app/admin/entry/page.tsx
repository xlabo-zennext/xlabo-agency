"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { CaseType } from "@/lib/types";
import { pt, yen, CURRENT_MONTH, CASE_TYPES, CASE_TYPE_LABEL, casePt, rateOf, rankLabelOf } from "@/lib/config";

export default function Entry() {
  const { agents, cases, addCase, pushActiveUsers, syncEnabled } = useStore();
  const [toast, setToast] = useState("");
  const [syncing, setSyncing] = useState(false);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3200); };

  const syncActive = async () => {
    setSyncing(true);
    const r = await pushActiveUsers();
    setSyncing(false);
    flash(
      r.ok ? "スプレッドシートへ反映しました ✓"
        : r.error === "disabled" ? "スプレッドシート未接続です（.env.local の NEXT_PUBLIC_SHEET_WEBAPP_URL を設定してください）"
          : "反映に失敗しました：" + r.error
    );
  };

  // 案件登録フォーム
  const [form, setForm] = useState({
    date: `${CURRENT_MONTH}-31`,
    agentId: "003",
    type: "給付" as CaseType,
    customer: "",
    points: String(casePt("給付")), // 付与ポイント（案件ごとに変動可・既定は種別の標準値）
    shotReward: "50000",
    staff: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  // 種別を変えたら付与ポイントを種別の既定値にリセット
  const setType = (t: CaseType) => setForm((f) => ({ ...f, type: t, points: String(casePt(t)) }));

  const pointsNum = Number(form.points) || 0;

  const submit = () => {
    if (!form.customer.trim()) return flash("対象者名を入力してください");
    addCase({
      date: form.date,
      agentId: form.agentId,
      type: form.type,
      customer: form.customer.trim() + (form.customer.includes("様") ? "" : "様"),
      status: "成約",
      points: pointsNum,
      shotReward: form.type === "給付" ? Number(form.shotReward) || 0 : undefined,
      staff: form.staff.trim(),
    });
    flash(`案件を登録しました（${CASE_TYPE_LABEL[form.type]}・${pt(pointsNum)} 付与）`);
    setForm((f) => ({ ...f, customer: "" }));
  };

  const nameOf = (id: string) => agents.find((a) => a.id === id)?.no || id;

  return (
    <div>
      <h2 className="h2">実績入力（アクティブユーザー・案件）</h2>
      <p className="sub">
        アクティブユーザー数と案件を入力すると、ポイントが自動集計されます。初期運用は<b>手入力 → スプレッドシート → アプリ反映</b>。
        本番はスプレッドシートと双方向同期し、本店はスプレッドシート操作のみで反映できるようにします。
      </p>

      <div className="info-box" style={{ marginBottom: 16 }}>
        <div className="row between wrap" style={{ gap: 10 }}>
          <div>
            📄 <b>スプレッドシート反映</b>：アプリで登録した案件・代理店は「代理店マスタ／案件」タブへ自動反映されます。
            アクティブ数など既存行の更新は、右のボタンでまとめて反映します。
            <div style={{ marginTop: 4 }}>
              接続状態：
              {syncEnabled
                ? <span className="pill green" style={{ marginLeft: 4 }}>接続済み</span>
                : <span className="pill orange" style={{ marginLeft: 4 }}>未接続（URL未設定）</span>}
            </div>
          </div>
          <button className="btn" disabled={syncing} onClick={syncActive}>
            {syncing ? "反映中…" : "スプレッドシートへ反映"}
          </button>
        </div>
      </div>

      <div className="grid2" style={{ alignItems: "start" }}>
        {/* アクティブユーザー数（有効会員数から自動算出） */}
        <div className="card">
          <div className="row between" style={{ marginBottom: 4 }}>
            <strong>当月アクティブユーザー数（{CURRENT_MONTH}）</strong>
            <Link href="/admin/users" className="btn ghost sm">会員管理へ</Link>
          </div>
          <p className="label" style={{ margin: "4px 0 10px" }}>
            人数は<b>「会員管理」で登録・解約した有効会員数</b>から自動算出されます。本人報酬 = 人数 × ランクレート（🥈500 / 🥇1,000 / 💎1,500）× 1円。
          </p>
          <table>
            <thead><tr><th>代理店</th><th>ランク</th><th style={{ textAlign: "right" }}>有効会員</th><th style={{ textAlign: "right" }}>アクティブpt</th><th style={{ textAlign: "right" }}>本人報酬</th></tr></thead>
            <tbody>
              {agents.map((a) => {
                const rl = rankLabelOf(a);
                const aupt = a.activeUsers * rateOf(a.rank);
                return (
                  <tr key={a.id}>
                    <td><strong>{a.no}</strong> <span className="label">{a.name}</span></td>
                    <td><span className="label">{rl.emoji} {rl.label}</span></td>
                    <td style={{ textAlign: "right" }}><strong>{a.activeUsers}</strong> 名</td>
                    <td style={{ textAlign: "right" }} className="ruby">{pt(aupt)}</td>
                    <td style={{ textAlign: "right" }}>{yen(aupt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 案件登録 */}
        <div className="stack" style={{ gap: 14 }}>
          <div className="card">
            <strong>案件を登録（ポイント加算）</strong>
            <div className="stack" style={{ gap: 12, marginTop: 12 }}>
              <div className="grid2" style={{ gap: 12 }}>
                <div className="field"><label>案件日</label><input className="input" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></div>
                <div className="field"><label>担当代理店</label>
                  <select className="input" value={form.agentId} onChange={(e) => set("agentId", e.target.value)}>
                    {agents.map((a) => <option key={a.id} value={a.id}>{a.no}・{a.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid2" style={{ gap: 12 }}>
                <div className="field"><label>案件種別</label>
                  <select className="input" value={form.type} onChange={(e) => setType(e.target.value as CaseType)}>
                    {CASE_TYPES.map((t) => <option key={t} value={t}>{CASE_TYPE_LABEL[t]}{t === "給付" ? "（+ショット報酬）" : "（ptのみ）"}</option>)}
                  </select>
                </div>
                <div className="field"><label>付与ポイント（案件ごとに変動可）</label>
                  <input className="input" type="number" inputMode="numeric" value={form.points} onChange={(e) => set("points", e.target.value)} />
                  <div className="label" style={{ marginTop: 2 }}>既定 {pt(casePt(form.type))}</div>
                </div>
              </div>
              <div className="field"><label>対象者名</label><input className="input" placeholder="例：田中" value={form.customer} onChange={(e) => set("customer", e.target.value)} /></div>
              {form.type === "給付" && (
                <div className="field"><label>ショット報酬（円・本店入力）</label>
                  <input className="input" type="number" value={form.shotReward} onChange={(e) => set("shotReward", e.target.value)} />
                </div>
              )}
              <div className="field"><label>担当者（社内）</label><input className="input" placeholder="例：岩﨑" value={form.staff} onChange={(e) => set("staff", e.target.value)} /></div>

              <div className="card" style={{ background: "var(--bg2)", padding: "10px 14px" }}>
                <div className="row between"><span className="label">付与ポイント</span><strong className="ruby">{pt(pointsNum)}</strong></div>
                {form.type === "給付" && <div className="row between" style={{ marginTop: 2 }}><span className="label">ショット報酬</span><strong>{yen(Number(form.shotReward) || 0)}</strong></div>}
              </div>

              <button className="btn ruby" onClick={submit}>案件を登録（成約）</button>
            </div>
          </div>

          <div className="card">
            <strong>最近の案件（{cases.length}件）</strong>
            <table style={{ marginTop: 10 }}>
              <thead><tr><th>日付</th><th>対象者</th><th>代理店</th><th>種別</th><th>状態</th></tr></thead>
              <tbody>
                {cases.slice(0, 8).map((c) => (
                  <tr key={c.id}>
                    <td>{c.date.slice(5)}</td>
                    <td>{c.customer}</td>
                    <td>{nameOf(c.agentId)}</td>
                    <td><span className="label">{c.type}</span></td>
                    <td><span className={"pill " + (c.status === "成約" ? "green" : c.status === "キャンセル" ? "red" : "orange")}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p className="label" style={{ marginTop: 12 }}>
        ※ 付与ポイントは案件ごとに変動できます（本部確定 2026/08）。既定値：給付サポート成約 {pt(casePt("給付"))}／件・税務・法務案件 {pt(casePt("税務法務"))}／件。金額は登録時に上書きできます。
      </p>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
