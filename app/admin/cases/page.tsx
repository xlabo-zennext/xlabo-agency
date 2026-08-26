"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { CaseStatus, CaseType } from "@/lib/types";
import { pt, CURRENT_MONTH, CASE_STATUSES, CASE_TYPES, CASE_TYPE_LABEL, casePoints } from "@/lib/config";

export default function Cases() {
  const { agents, cases, setCaseStatus, setShotReward, setCasePoints } = useStore();
  const [typeF, setTypeF] = useState<"all" | CaseType>("all");
  const [statusF, setStatusF] = useState<"all" | CaseStatus>("all");
  const [toast, setToast] = useState("");
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2400); };

  const nameOf = (id: string) => agents.find((a) => a.id === id)?.no || id;
  const month = cases.filter((c) => c.date.startsWith(CURRENT_MONTH));
  const rows = month.filter(
    (c) => (typeF === "all" || c.type === typeF) && (statusF === "all" || c.status === statusF)
  );

  const cntType = (t: CaseType) => month.filter((c) => c.type === t && c.status === "成約").length;
  const cntStatus = (s: CaseStatus) => month.filter((c) => c.status === s).length;

  return (
    <div>
      <h2 className="h2">案件管理</h2>
      <p className="sub">給付サポート成約・税務法務案件のステータスとショット報酬を管理。成約でポイント確定、キャンセルでポイント取消（ランキング再計算）。</p>

      <div className="grid4" style={{ marginBottom: 16 }}>
        <div className="card center"><div className="kpi-num green">{cntType("給付")}</div><div className="label">給付サポート成約</div></div>
        <div className="card center"><div className="kpi-num">{cntType("税務法務")}</div><div className="label">税務・法務案件</div></div>
        <div className="card center"><div className="kpi-num" style={{ color: "var(--orange)" }}>{cntStatus("対応中")}</div><div className="label">対応中</div></div>
        <div className="card center"><div className="kpi-num red">{cntStatus("キャンセル")}</div><div className="label">キャンセル</div></div>
      </div>

      <div className="field" style={{ marginBottom: 10 }}>
        <label>種別で絞り込み</label>
        <div className="row wrap" style={{ gap: 8 }}>
          {(["all", ...CASE_TYPES] as const).map((f) => (
            <button key={f} className={"btn sm " + (typeF === f ? "" : "ghost")} onClick={() => setTypeF(f)}>
              {f === "all" ? "すべて" : CASE_TYPE_LABEL[f]}
            </button>
          ))}
        </div>
      </div>
      <div className="field" style={{ marginBottom: 14 }}>
        <label>ステータスで絞り込み</label>
        <div className="row wrap" style={{ gap: 8 }}>
          {(["all", ...CASE_STATUSES] as const).map((f) => (
            <button key={f} className={"btn sm " + (statusF === f ? "" : "ghost")} onClick={() => setStatusF(f)}>
              {f === "all" ? "すべて" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>案件</th><th>対象者</th><th>代理店</th><th>種別</th>
              <th style={{ textAlign: "right" }}>付与pt</th>
              <th style={{ textAlign: "right" }}>ショット報酬</th>
              <th>ステータス</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const canceled = c.status === "キャンセル";
              return (
                <tr key={c.id}>
                  <td><strong>{c.caseNo}</strong><div className="label">{c.date}</div></td>
                  <td>{c.customer}</td>
                  <td>{nameOf(c.agentId)}</td>
                  <td><span className={"pill " + (c.type === "給付" ? "green" : "")}>{c.type}</span></td>
                  <td style={{ textAlign: "right" }}>
                    <input
                      className="input"
                      type="number"
                      style={{ width: 96, textAlign: "right", padding: "5px 7px", fontSize: 13 }}
                      value={casePoints(c)}
                      disabled={canceled}
                      onChange={(e) => setCasePoints(c.id, Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                    />
                    {canceled && <div className="label red">取消で0pt</div>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {c.type === "給付" ? (
                      <input
                        className="input"
                        type="number"
                        style={{ width: 100, textAlign: "right", padding: "5px 7px", fontSize: 13 }}
                        value={c.shotReward ?? 0}
                        disabled={canceled}
                        onChange={(e) => setShotReward(c.id, Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                      />
                    ) : (
                      <span className="label">—</span>
                    )}
                  </td>
                  <td>
                    <select
                      className="input"
                      style={{ width: "auto", padding: "6px 10px", fontSize: 13 }}
                      value={c.status}
                      onChange={(e) => { setCaseStatus(c.id, e.target.value as CaseStatus); flash("ステータスを更新しました ✓"); }}
                    >
                      {CASE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="sub" style={{ marginTop: 10 }}>該当する案件がありません。絞り込みを変えてください。</p>}
      </div>

      <p className="label" style={{ marginTop: 10 }}>
        ※ ショット報酬（給付のみ）は案件ごとに本店が入力。ここで入力した金額が「報酬支払管理」に連動します（ポイントとは別管理）。
      </p>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
