"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";

export default function Join() {
  const { agents, addAgent } = useStore();
  const [f, setF] = useState({
    referrer: "", name: "", furigana: "", birthday: "", email: "", phone: "", zip: "", address: "",
    bankName: "", branch: "", acctType: "普通", acctNo: "", acctHolder: "",
  });
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ parent: string } | null>(null);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  // 紹介コード/氏名 → 紹介元を照合
  const parent = useMemo(() => {
    const key = f.referrer.trim();
    if (!key) return null;
    return (
      agents.find((a) => a.code.toLowerCase() === key.toLowerCase()) ||
      agents.find((a) => a.name === key) ||
      null
    );
  }, [f.referrer, agents]);

  const submit = () => {
    const required: [string, string][] = [
      ["referrer", "紹介者氏名 or 紹介コード"], ["name", "氏名"], ["furigana", "フリガナ"],
      ["birthday", "生年月日"], ["email", "メールアドレス"], ["phone", "電話番号"], ["address", "住所"],
      ["bankName", "金融機関名"], ["branch", "支店名"], ["acctNo", "口座番号"], ["acctHolder", "口座名義"],
    ];
    const miss = required.find(([k]) => !(f as any)[k].trim());
    if (miss) return setErr(`「${miss[1]}」を入力してください`);
    if (!parent) return setErr("紹介コード（または紹介者氏名）が確認できません");
    setErr("");

    const bank = `${f.bankName.trim()} ${f.branch.trim()} ${f.acctType} ${f.acctNo.trim()} ${f.acctHolder.trim()}`;
    addAgent({
      name: f.name.trim(),
      kind: "individual",
      rank: "silver", // 新規はシルバースタート
      referrerId: parent.id,
      category: "一般",
      bank,
      joinDate: "2026-08-01",
      activeUsers: 0,
      furigana: f.furigana.trim(), birthday: f.birthday, email: f.email.trim(), phone: f.phone.trim(),
      zip: f.zip.trim(), address: f.address.trim(),
      bankName: f.bankName.trim(), branch: f.branch.trim(), acctType: f.acctType, acctNo: f.acctNo.trim(), acctHolder: f.acctHolder.trim(),
    });
    setDone({ parent: `${parent.no}・${parent.name}` });
  };

  if (done) {
    return (
      <div className="legal" style={{ maxWidth: 560 }}>
        <div className="card center" style={{ padding: "40px 22px" }}>
          <div style={{ fontSize: 46 }}>🎉</div>
          <h2 style={{ margin: "10px 0 6px" }}>代理店登録が完了しました</h2>
          <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.9 }}>
            {f.name}様を <b>シルバー代理店</b> として登録しました。<br />
            紹介元：{done.parent}<br />
            本店の承認後、代理店番号・紹介コードが発行され、アプリをご利用いただけます。
          </p>
          <div className="row" style={{ gap: 8, justifyContent: "center", marginTop: 18 }}>
            <button className="btn ghost sm" onClick={() => { setF({ referrer: "", name: "", furigana: "", birthday: "", email: "", phone: "", zip: "", address: "", bankName: "", branch: "", acctType: "普通", acctNo: "", acctHolder: "" }); setDone(null); }}>別の代理店を登録</button>
            <Link href="/" className="btn sm">トップへ</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="legal" style={{ maxWidth: 560 }}>
      <Link href="/" className="back">‹ トップへ戻る</Link>
      <div className="brand" style={{ fontSize: 24, margin: "14px 0 8px" }}><span className="dot" /> X-LABO</div>
      <h1 style={{ fontSize: 24 }}>代理店 新規登録</h1>
      <p className="lead" style={{ fontSize: 13.5 }}>紹介コードをお持ちの方の登録フォームです。（　）以外は必須項目です。新規はシルバーランクから開始します。</p>

      <div className="card">
        <div className="stack" style={{ gap: 12 }}>
          <Field label="紹介者氏名 or 紹介コード" v={f.referrer} on={(v) => set("referrer", v)} placeholder="例：XL-A123 / RUBY-001" />
          {f.referrer.trim() && (
            parent ? (
              <div className="pill green" style={{ alignSelf: "flex-start" }}>
                紹介元：{parent.no}・{parent.name}（{parent.kind === "ruby" ? "ルビー" : "個人代理店"}）
              </div>
            ) : (
              <div className="pill orange" style={{ alignSelf: "flex-start" }}>紹介コードを確認できません</div>
            )
          )}

          <Field label="氏名" v={f.name} on={(v) => set("name", v)} placeholder="山田 太郎" />
          <Field label="フリガナ" v={f.furigana} on={(v) => set("furigana", v)} placeholder="ヤマダ タロウ" />
          <Field label="生年月日" v={f.birthday} on={(v) => set("birthday", v)} type="date" />
          <Field label="メールアドレス" v={f.email} on={(v) => set("email", v)} type="email" placeholder="taro@example.com" />
          <Field label="電話番号" v={f.phone} on={(v) => set("phone", v)} type="tel" placeholder="090-0000-0000" />
          <Field label="郵便番号（任意）" v={f.zip} on={(v) => set("zip", v)} placeholder="104-0045" optional />
          <Field label="住所" v={f.address} on={(v) => set("address", v)} placeholder="東京都中央区..." />

          <div className="label" style={{ marginTop: 2 }}>報酬振込口座</div>
          <div className="grid2" style={{ gap: 10 }}>
            <Field label="金融機関名" v={f.bankName} on={(v) => set("bankName", v)} placeholder="○○銀行" />
            <Field label="支店名" v={f.branch} on={(v) => set("branch", v)} placeholder="△△支店" />
          </div>
          <div className="grid3" style={{ gap: 10 }}>
            <div className="field">
              <label>預金種目 <span style={{ color: "var(--red)" }}>*</span></label>
              <select className="input" value={f.acctType} onChange={(e) => set("acctType", e.target.value)}>
                <option value="普通">普通</option><option value="当座">当座</option><option value="貯蓄">貯蓄</option>
              </select>
            </div>
            <Field label="口座番号" v={f.acctNo} on={(v) => set("acctNo", v)} placeholder="1234567" />
            <Field label="口座名義" v={f.acctHolder} on={(v) => set("acctHolder", v)} placeholder="ヤマダ タロウ" />
          </div>

          {err && <div className="pill red" style={{ alignSelf: "flex-start" }}>{err}</div>}
          <button className="btn ruby" onClick={submit}>この内容で登録する</button>
        </div>
      </div>

      <p className="note">紹介コードは、上位代理店・ルビー代理店のマイページから発行・共有されます。ご不明な場合は紹介元にご確認ください。</p>
    </div>
  );
}

function Field({ label, v, on, type = "text", placeholder, optional }: { label: string; v: string; on: (v: string) => void; type?: string; placeholder?: string; optional?: boolean }) {
  return (
    <div className="field">
      <label>{label} {!optional && <span style={{ color: "var(--red)" }}>*</span>}</label>
      <input className="input" type={type} value={v} placeholder={placeholder} onChange={(e) => on(e.target.value)} />
    </div>
  );
}
