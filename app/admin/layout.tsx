"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "ダッシュボード", ico: "📊" },
  { href: "/admin/leads", label: "見込み・申込", ico: "📨" },
  { href: "/admin/users", label: "会員管理", ico: "👥" },
  { href: "/admin/entry", label: "実績入力", ico: "📝" },
  { href: "/admin/cases", label: "案件管理", ico: "🗂️" },
  { href: "/admin/rewards", label: "報酬支払管理", ico: "💰" },
  { href: "/admin/org", label: "組織・代理店管理", ico: "🌳" },
  { href: "/admin/logs", label: "操作ログ", ico: "📜" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="admin">
      <aside className="side">
        <h1 style={{ margin: "2px 6px 16px" }}>
          <span className="brand" style={{ color: "#fff", fontSize: 18 }}><span className="dot" /> X-LABO</span>
          <div style={{ fontSize: 12, color: "#9fb0d6", fontWeight: 700, marginTop: 4 }}>
            <span className="txt">本店 管理画面</span>
          </div>
        </h1>
        {items.map((it) => {
          const active = path === it.href;
          return (
            <Link key={it.href} href={it.href} className={active ? "active" : ""}>
              <span style={{ fontSize: 17 }}>{it.ico}</span>
              <span className="txt">{it.label}</span>
            </Link>
          );
        })}
        <Link href="/" style={{ marginTop: 18 }}>
          <span style={{ fontSize: 17 }}>↩︎</span>
          <span className="txt">トップへ戻る</span>
        </Link>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
