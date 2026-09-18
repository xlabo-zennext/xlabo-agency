"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase, supabaseReady } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────
// 本番（Supabase接続時）：メール＋パスワードの本格ログイン
// デモ（未接続時）：役割別 簡易パスワードゲート（運営／代理店）
//   ※実際のロール別アクセス制御は Supabase の RLS（supabase/rls.sql）で強制。
// ─────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  width: "100%", maxWidth: 360, background: "#fff", borderRadius: 14,
  boxShadow: "0 4px 24px rgba(0,0,0,.08)", padding: "34px 28px", textAlign: "center",
};
const wrapStyle: React.CSSProperties = {
  minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
  background: "#eef1f7", padding: 20, fontFamily: '"Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif',
};
const inputStyle = (err: boolean): React.CSSProperties => ({
  width: "100%", boxSizing: "border-box", padding: "11px 13px", fontSize: 15,
  border: `1px solid ${err ? "#e0245e" : "#d5dce4"}`, borderRadius: 8, marginBottom: 10, outline: "none",
});
const btnStyle: React.CSSProperties = {
  width: "100%", padding: "11px 0", fontSize: 15, fontWeight: 700, color: "#fff",
  background: "#10203f", border: "none", borderRadius: 8, cursor: "pointer",
};
const Brand = () => (
  <div style={{ fontSize: 20, fontWeight: 900, color: "#10203f", letterSpacing: -0.5 }}>
    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#e0245e", marginRight: 7 }} />X-LABO
  </div>
);

export default function AuthGate({ children }: { children: React.ReactNode }) {
  if (supabaseReady) return <SupabaseGate>{children}</SupabaseGate>;
  return <DemoGate>{children}</DemoGate>;
}

// ========== 本番：Supabase Auth ==========
function SupabaseGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  // パスワード変更
  const [pwOpen, setPwOpen] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return null;

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (error) setErr("メールアドレスまたはパスワードが違います");
  };
  const logout = () => supabase.auth.signOut();

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw1.length < 8) return setPwMsg("パスワードは8文字以上にしてください");
    if (pw1 !== pw2) return setPwMsg("確認用パスワードと一致しません");
    setPwBusy(true); setPwMsg("");
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setPwBusy(false);
    if (error) { setPwMsg("変更に失敗しました：" + error.message); return; }
    setPwMsg("パスワードを変更しました ✓");
    setPw1(""); setPw2("");
    setTimeout(() => { setPwOpen(false); setPwMsg(""); }, 1400);
  };

  if (!session) {
    return (
      <div style={wrapStyle}>
        <form onSubmit={login} style={cardStyle}>
          <Brand />
          <h1 style={{ fontSize: 18, color: "#10203f", margin: "10px 0 4px" }}>代理店管理アプリ</h1>
          <p style={{ fontSize: 12.5, color: "#7c889a", margin: "0 0 20px" }}>メールアドレスとパスワードでログイン</p>
          <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} placeholder="メールアドレス" autoComplete="username" style={inputStyle(!!err)} />
          <input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(""); }} placeholder="パスワード" autoComplete="current-password" style={inputStyle(!!err)} />
          {err && <div style={{ color: "#c0392b", fontSize: 12.5, marginBottom: 10 }}>{err}</div>}
          <button type="submit" disabled={busy} style={{ ...btnStyle, opacity: busy ? 0.6 : 1 }}>{busy ? "確認中…" : "ログイン"}</button>
        </form>
      </div>
    );
  }

  return (
    <>
      {children}
      <div style={badgeStyle}>
        <span>🔐 {session.user.email}</span>
        <button onClick={() => { setPwOpen(true); setPwMsg(""); }} style={logoutBtn}>パスワード変更</button>
        <span style={{ opacity: 0.4 }}>|</span>
        <button onClick={logout} style={logoutBtn}>ログアウト</button>
      </div>

      {pwOpen && (
        <div style={{ ...wrapStyle, position: "fixed", inset: 0, zIndex: 10000, background: "rgba(16,32,63,.45)" }}>
          <form onSubmit={changePw} style={cardStyle}>
            <Brand />
            <h1 style={{ fontSize: 17, color: "#10203f", margin: "10px 0 4px" }}>パスワード変更</h1>
            <p style={{ fontSize: 12.5, color: "#7c889a", margin: "0 0 16px" }}>{session.user.email} の新しいパスワードを設定します（8文字以上）</p>
            <input type="password" value={pw1} onChange={(e) => { setPw1(e.target.value); setPwMsg(""); }} placeholder="新しいパスワード" autoComplete="new-password" style={inputStyle(false)} />
            <input type="password" value={pw2} onChange={(e) => { setPw2(e.target.value); setPwMsg(""); }} placeholder="新しいパスワード（確認）" autoComplete="new-password" style={inputStyle(false)} />
            {pwMsg && <div style={{ color: pwMsg.includes("✓") ? "#18a86b" : "#c0392b", fontSize: 12.5, marginBottom: 10 }}>{pwMsg}</div>}
            <button type="submit" disabled={pwBusy} style={{ ...btnStyle, opacity: pwBusy ? 0.6 : 1 }}>{pwBusy ? "変更中…" : "変更する"}</button>
            <button type="button" onClick={() => { setPwOpen(false); setPw1(""); setPw2(""); setPwMsg(""); }} style={{ marginTop: 10, background: "none", border: "none", color: "#8a97a8", fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}>キャンセル</button>
          </form>
        </div>
      )}
    </>
  );
}

// ========== デモ：役割別 簡易パスワード ==========
const HONBU_PW = "honbu2026";
const AGENT_PW = "agent2026";
const KEY = "xlabo_role";
// 公開ページ（未ログインでも表示）：申込フォーム・法務
const PUBLIC_PREFIXES = ["/apply", "/join", "/privacy", "/tokushoho", "/login"];

function DemoGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    try { const r = localStorage.getItem(KEY); if (r === "honbu" || r === "agent") setRole(r); } catch {}
    setReady(true);
  }, []);
  if (!ready) return null;

  // 公開ページはゲートを通さない（見込み客の申込フォーム等）
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return <>{children}</>;

  const logout = () => { try { localStorage.removeItem(KEY); } catch {} setRole(null); setInput(""); };

  if (!role) {
    const submit = (e: React.FormEvent) => {
      e.preventDefault();
      if (input === HONBU_PW) { try { localStorage.setItem(KEY, "honbu"); } catch {} setRole("honbu"); }
      else if (input === AGENT_PW) { try { localStorage.setItem(KEY, "agent"); } catch {} setRole("agent"); }
      else setError(true);
    };
    return (
      <div style={wrapStyle}>
        <form onSubmit={submit} style={cardStyle}>
          <Brand />
          <h1 style={{ fontSize: 18, color: "#10203f", margin: "10px 0 4px" }}>代理店管理アプリ</h1>
          <p style={{ fontSize: 12.5, color: "#7c889a", margin: "0 0 20px" }}>運営用／代理店用のパスワードでログイン（デモ）</p>
          <input type="password" value={input} onChange={(e) => { setInput(e.target.value); setError(false); }} placeholder="パスワードを入力" autoFocus style={inputStyle(error)} />
          {error && <div style={{ color: "#c0392b", fontSize: 12.5, marginBottom: 10 }}>パスワードが違います</div>}
          <button type="submit" style={btnStyle}>ログイン</button>
          <p style={{ fontSize: 11, color: "#9aa6b5", margin: "14px 0 0" }}>※本番は Supabase 認証＋RLS（ロール別アクセス制御）に切替。</p>
        </form>
      </div>
    );
  }

  // 代理店ロールは運営管理画面(/admin)に入れない
  if (role === "agent" && pathname.startsWith("/admin")) {
    return (
      <div style={wrapStyle}>
        <div style={{ ...cardStyle, maxWidth: 380 }}>
          <div style={{ fontSize: 30 }}>🔒</div>
          <h1 style={{ fontSize: 17, color: "#10203f", margin: "8px 0 6px" }}>アクセス権限がありません</h1>
          <p style={{ fontSize: 13, color: "#7c889a", margin: "0 0 18px" }}>運営管理画面は「運営用」でログインした方のみご利用いただけます。</p>
          <a href="/agent/" style={{ display: "inline-block", padding: "10px 18px", fontSize: 14, fontWeight: 700, color: "#fff", background: "#10203f", borderRadius: 8, textDecoration: "none" }}>代理店ページへ</a>
          <div style={{ marginTop: 14 }}><button onClick={logout} style={{ fontSize: 12, color: "#8a97a8", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>ログアウト</button></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <div style={badgeStyle}>
        <span>{role === "honbu" ? "🏢 運営モード" : "📱 代理店モード"}</span>
        <button onClick={logout} style={logoutBtn}>ログアウト</button>
      </div>
    </>
  );
}

const badgeStyle: React.CSSProperties = {
  position: "fixed", right: 12, bottom: 12, zIndex: 9999, display: "flex", gap: 8, alignItems: "center",
  background: "rgba(16,32,63,.92)", color: "#fff", borderRadius: 20, padding: "6px 12px", fontSize: 12,
  fontFamily: '"Hiragino Kaku Gothic ProN", sans-serif', boxShadow: "0 2px 10px rgba(0,0,0,.15)",
};
const logoutBtn: React.CSSProperties = { color: "#cfe0f5", background: "none", border: "none", cursor: "pointer", fontSize: 12, textDecoration: "underline" };
