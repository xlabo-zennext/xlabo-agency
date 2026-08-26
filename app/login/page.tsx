"use client";

import { useState } from "react";
import Link from "next/link";

// 二段階認証のUIモック（プロトタイプ）。本番はメール/SMS/認証アプリのワンタイムコードで実装。
export default function Login() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<"admin" | "agent">("agent");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");

  const next1 = () => {
    if (!email.trim()) return setErr("メールアドレスとパスワードを入力してください");
    setErr("");
    setStep(2);
  };
  const next2 = () => {
    if (code.trim().length < 4) return setErr("6桁のワンタイムコードを入力してください");
    setErr("");
    setStep(3);
  };

  return (
    <div className="legal" style={{ maxWidth: 460 }}>
      <Link href="/" className="back">‹ トップへ戻る</Link>
      <div className="brand" style={{ fontSize: 26, margin: "14px 0 4px" }}><span className="dot" /> X-LABO</div>
      <h1 style={{ fontSize: 22 }}>ログイン</h1>
      <p className="lead" style={{ fontSize: 13 }}>二段階認証つきログイン（プロトタイプのため認証は行いません）。</p>

      <div className="card">
        {/* ステップ表示 */}
        <div className="row" style={{ gap: 6, marginBottom: 16 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} className="grow" style={{ height: 5, borderRadius: 999, background: step >= s ? "var(--accent)" : "var(--line)" }} />
          ))}
        </div>

        {step === 1 && (
          <div className="stack" style={{ gap: 12 }}>
            <div className="field"><label>ログインする画面</label>
              <select className="input" value={role} onChange={(e) => setRole(e.target.value as "admin" | "agent")}>
                <option value="agent">代理店として</option>
                <option value="admin">本店（管理者）として</option>
              </select>
            </div>
            <div className="field"><label>メールアドレス</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
            <div className="field"><label>パスワード</label><input className="input" type="password" placeholder="••••••••" /></div>
            {err && <div className="pill red" style={{ alignSelf: "flex-start" }}>{err}</div>}
            <button className="btn" onClick={next1}>次へ（ワンタイムコード送信）</button>
          </div>
        )}

        {step === 2 && (
          <div className="stack" style={{ gap: 12 }}>
            <div className="info-box">登録済みの連絡先に <b>6桁のワンタイムコード</b> を送信しました（プロトタイプでは任意の数字でOK）。</div>
            <div className="field"><label>ワンタイムコード（6桁）</label><input className="input" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" style={{ letterSpacing: 6, fontSize: 20, textAlign: "center" }} /></div>
            {err && <div className="pill red" style={{ alignSelf: "flex-start" }}>{err}</div>}
            <button className="btn" onClick={next2}>認証してログイン</button>
            <button className="btn ghost sm" onClick={() => setStep(1)}>戻る</button>
          </div>
        )}

        {step === 3 && (
          <div className="stack center" style={{ gap: 12 }}>
            <div style={{ fontSize: 40 }}>✅</div>
            <strong>認証に成功しました</strong>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>権限分離：本店は管理画面、代理店は代理店アプリへ進みます。</p>
            <Link href={role === "admin" ? "/admin" : "/agent"} className="btn" style={{ width: "100%" }}>
              {role === "admin" ? "本店 管理画面へ" : "代理店アプリへ"}
            </Link>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <strong style={{ fontSize: 14 }}>権限（ロール）とデータ閲覧範囲</strong>
        <div className="stack" style={{ gap: 8, marginTop: 10 }}>
          <div>
            <div className="row" style={{ gap: 6 }}><span className="pill">代理店</span></div>
            <div className="label" style={{ marginTop: 4, lineHeight: 1.7 }}>自分に紐づくユーザー・案件・pt・報酬のみ閲覧可。</div>
          </div>
          <div>
            <div className="row" style={{ gap: 6 }}><span className="pill ruby">ルビー代理店</span></div>
            <div className="label" style={{ marginTop: 4, lineHeight: 1.7 }}>自分が紹介した代理店の<b>実績のみ</b>閲覧可。配下のユーザー個人情報は不可（<b>ID・代理店名のみ</b>）。</div>
          </div>
          <div>
            <div className="row" style={{ gap: 6 }}><span className="pill green">運営管理者</span></div>
            <div className="label" style={{ marginTop: 4, lineHeight: 1.7 }}>全データを閲覧・編集可。すべての変更は<b>操作ログ</b>に記録（誰が・いつ・何を）。</div>
          </div>
        </div>
      </div>

      <p className="note">※ 本番では二段階認証（メール/SMS/認証アプリ）・上記のロール別アクセス制御（サーバー側で強制）・操作ログの改ざん防止/長期保管を実装します。本プロトタイプは挙動確認用で、代理店切替は動作確認のための簡易機能です。</p>
    </div>
  );
}
