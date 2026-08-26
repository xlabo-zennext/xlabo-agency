"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

const tabs = [
  { href: "/agent", label: "ホーム", ico: "🏠" },
  { href: "/agent/ranking", label: "ランキング", ico: "🏆" },
  { href: "/agent/rewards", label: "報酬", ico: "💰" },
  { href: "/agent/mypage", label: "マイページ", ico: "👤" },
];

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { agents, viewAgentId, setViewAgentId } = useStore();

  return (
    <div className="app">
      <div className="center" style={{ marginBottom: 10 }}>
        <span className="brand" style={{ fontSize: 22 }}><span className="dot" /> X-LABO</span>
      </div>
      {/* プロトタイプ用：どの代理店として見るか切替 */}
      <div className="row between" style={{ marginBottom: 14 }}>
        <Link href="/" className="muted" style={{ fontSize: 12, fontWeight: 700 }}>‹ トップ</Link>
        <div className="row" style={{ gap: 6 }}>
          <span className="label">表示中の代理店：</span>
          <select
            className="input"
            style={{ width: "auto", padding: "6px 10px", fontSize: 12 }}
            value={viewAgentId}
            onChange={(e) => setViewAgentId(e.target.value)}
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.no}・{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {children}

      <nav className="nav">
        {tabs.map((t) => {
          const active = path === t.href;
          return (
            <Link key={t.href} href={t.href} className={active ? "active" : ""}>
              <span className="ico">{t.ico}</span>
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
