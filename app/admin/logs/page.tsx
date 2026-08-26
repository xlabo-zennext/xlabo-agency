"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

const fmt = (iso: string) => {
  // ISO → "MM/DD HH:mm"（表示用・簡易）
  const m = iso.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return m ? `${m[2]}/${m[3]} ${m[4]}:${m[5]}` : iso;
};

export default function Logs() {
  const { logs } = useStore();
  const [q, setQ] = useState("");
  const rows = logs.filter((l) => !q || (l.action + l.detail + l.actor).includes(q));

  return (
    <div>
      <h2 className="h2">操作ログ（監査履歴）</h2>
      <p className="sub">
        誰が・いつ・何を変更したかを記録します。案件登録、会員登録/解約、会員化、ランク変更、報酬振込、スプレッドシート反映などを自動記録。
        本番では認証ユーザー単位で記録・改ざん防止・長期保管します。
      </p>

      <div className="field" style={{ marginBottom: 12, maxWidth: 360 }}>
        <label>検索（操作・対象・操作者）</label>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="例：会員化 / XL-003 / 報酬" />
      </div>

      <div className="card">
        <p className="label" style={{ margin: "0 0 8px" }}>{rows.length}件（新しい順）</p>
        <div style={{ maxHeight: 560, overflowY: "auto" }}>
          <table>
            <thead><tr><th>日時</th><th>操作者</th><th>権限</th><th>操作</th><th>対象</th></tr></thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id}>
                  <td><span className="label">{fmt(l.time)}</span></td>
                  <td>{l.actor}</td>
                  <td><span className={"pill " + (l.role === "運営管理者" ? "" : l.role === "申込フォーム" ? "orange" : "")}>{l.role}</span></td>
                  <td><strong>{l.action}</strong></td>
                  <td><span className="label">{l.detail}</span></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="muted">ログがありません。</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
