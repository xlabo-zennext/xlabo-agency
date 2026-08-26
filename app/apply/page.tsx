"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";

const prefs = ["東京都", "神奈川県", "埼玉県", "千葉県", "大阪府", "愛知県", "福岡県", "北海道", "その他"];

function ApplyInner() {
  const params = useSearchParams();
  const ref = params.get("ref") || "";
  const { agents, addLead } = useStore();

  const agent = useMemo(
    () => agents.find((a) => a.code.toLowerCase() === ref.toLowerCase()) || null,
    [agents, ref]
  );

  const [f, setF] = useState({ name: "", phone: "", lineName: "", email: "", pref: "東京都", message: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = () => {
    if (!agent) return setErr("紹介リンクが正しくありません。紹介元にご確認ください。");
    if (!f.name.trim()) return setErr("お名前を入力してください");
    if (!f.phone.trim() && !f.lineName.trim()) return setErr("電話番号かLINE名のいずれかを入力してください");
    setErr("");
    addLead({
      agentId: agent.id, name: f.name.trim(), phone: f.phone.trim(), lineName: f.lineName.trim(),
      email: f.email.trim(), pref: f.pref, message: f.message.trim(),
    });
    setDone(true);
  };

  if (done) {
    return (
      <div className="legal" style={{ maxWidth: 520 }}>
        <div className="card center" style={{ padding: "44px 22px" }}>
          <div style={{ fontSize: 46 }}>✅</div>
          <h2 style={{ margin: "10px 0 6px" }}>お申し込みありがとうございます</h2>
          <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.9 }}>
            担当より折り返しご連絡いたします。<br />
            登録・お手続きは X-LABO 運営がご案内しますので、そのままお待ちください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="legal" style={{ maxWidth: 520 }}>
      <div className="brand" style={{ fontSize: 26, margin: "4px 0 8px" }}><span className="dot" /> X-LABO</div>
      <h1 style={{ fontSize: 22 }}>ご案内のお申し込み</h1>
      <p className="lead" style={{ fontSize: 13.5 }}>
        かんたん入力で完了します。以降のご登録・お手続きは X-LABO 運営がご案内します。
      </p>

      {agent ? (
        <div className="pill green" style={{ marginBottom: 12 }}>紹介元：{agent.name}（{agent.no}）</div>
      ) : (
        <div className="pill orange" style={{ marginBottom: 12 }}>
          {ref ? "紹介リンクを確認できません" : "紹介リンクからアクセスしてください"}
        </div>
      )}

      <div className="card">
        <div className="stack" style={{ gap: 12 }}>
          <div className="field"><label>お名前 <span style={{ color: "var(--red)" }}>*</span></label>
            <input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="山田 太郎" /></div>
          <div className="field"><label>電話番号</label>
            <input className="input" type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="090-0000-0000" /></div>
          <div className="field"><label>LINE名</label>
            <input className="input" value={f.lineName} onChange={(e) => set("lineName", e.target.value)} placeholder="任意" /></div>
          <div className="field"><label>メール（任意）</label>
            <input className="input" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="任意" /></div>
          <div className="field"><label>お住まいの都道府県</label>
            <select className="input" value={f.pref} onChange={(e) => set("pref", e.target.value)}>
              {prefs.map((p) => <option key={p} value={p}>{p}</option>)}
            </select></div>
          <div className="field"><label>ご要望・ご質問（任意）</label>
            <textarea className="input" rows={3} value={f.message} onChange={(e) => set("message", e.target.value)} /></div>

          {err && <div className="pill red" style={{ alignSelf: "flex-start" }}>{err}</div>}
          <button className="btn ruby" disabled={!agent} onClick={submit}>この内容で申し込む</button>
          <p className="muted" style={{ fontSize: 11, margin: 0 }}>
            送信いただいた情報は X-LABO のプライバシーポリシーに基づき、ご案内の目的で利用します。
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Apply() {
  return (
    <Suspense fallback={<div className="legal">読み込み中…</div>}>
      <ApplyInner />
    </Suspense>
  );
}
