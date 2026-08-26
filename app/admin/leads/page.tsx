"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { LeadStatus } from "@/lib/types";

const STATUSES: LeadStatus[] = ["申込", "対応中", "登録完了", "見送り"];

export default function Leads() {
  const { agents, leads, setLeadStatus, convertLead } = useStore();
  const [statusF, setStatusF] = useState<"all" | LeadStatus>("all");
  const [toast, setToast] = useState("");
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  const nameOf = (id: string) => agents.find((a) => a.id === id);
  const rows = leads.filter((l) => statusF === "all" || l.status === statusF);
  const cnt = (s: LeadStatus) => leads.filter((l) => l.status === s).length;

  const convert = (id: string, label: string) => {
    convertLead(id);
    flash(`${label} を会員化しました → アクティブ会員として紹介元へ紐付け・pt/報酬に反映 ✓`);
  };

  return (
    <div>
      <h2 className="h2">見込み・申込管理（トスアップ）</h2>
      <p className="sub">
        代理店の紹介URL/QRから届いた申込です。運営が登録・決済案内を行い、完了したら「会員化」でアクティブ会員として紹介元代理店へ自動で紐付けます（pt・報酬へ自動反映）。
      </p>

      <div className="grid4" style={{ marginBottom: 16 }}>
        <div className="card center"><div className="kpi-num ruby">{cnt("申込")}</div><div className="label">新規申込</div></div>
        <div className="card center"><div className="kpi-num" style={{ color: "var(--orange)" }}>{cnt("対応中")}</div><div className="label">対応中</div></div>
        <div className="card center"><div className="kpi-num green">{cnt("登録完了")}</div><div className="label">登録完了（会員化）</div></div>
        <div className="card center"><div className="kpi-num">{cnt("見送り")}</div><div className="label">見送り</div></div>
      </div>

      <div className="field" style={{ marginBottom: 14 }}>
        <label>ステータスで絞り込み</label>
        <div className="row wrap" style={{ gap: 8 }}>
          {(["all", ...STATUSES] as const).map((f) => (
            <button key={f} className={"btn sm " + (statusF === f ? "" : "ghost")} onClick={() => setStatusF(f)}>{f === "all" ? "すべて" : f}</button>
          ))}
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>申込</th><th>お客様</th><th>連絡先</th><th>紹介元代理店</th><th>状態</th><th style={{ textAlign: "right" }}>操作</th></tr>
          </thead>
          <tbody>
            {rows.map((l) => {
              const a = nameOf(l.agentId);
              const done = l.status === "登録完了";
              return (
                <tr key={l.id}>
                  <td><strong>{l.leadNo}</strong><div className="label">{l.date}</div></td>
                  <td>{l.name}<div className="label">{l.pref || ""}</div></td>
                  <td><span className="label">{l.phone || "—"}{l.lineName ? ` / LINE:${l.lineName}` : ""}</span></td>
                  <td>{a?.no} <span className="label">{a?.name}</span></td>
                  <td>
                    <span className={"pill " + (l.status === "登録完了" ? "green" : l.status === "見送り" ? "red" : l.status === "対応中" ? "orange" : "ruby")}>{l.status}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {done ? (
                      <span className="label">会員化済</span>
                    ) : (
                      <div className="row" style={{ gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                        {l.status !== "対応中" && <button className="btn ghost sm" onClick={() => setLeadStatus(l.id, "対応中")}>対応中</button>}
                        <button className="btn ghost sm" onClick={() => setLeadStatus(l.id, "見送り")}>見送り</button>
                        <button className="btn ruby sm" onClick={() => convert(l.id, l.name)}>会員化</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="sub" style={{ marginTop: 10 }}>該当する申込がありません。</p>}
      </div>

      <p className="label" style={{ marginTop: 10 }}>
        ※「会員化」＝登録・決済完了。会員（月額7,980円）としてアクティブ化し、紹介元代理店のアクティブ数・pt・本人報酬へ自動反映されます。
      </p>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
