"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { ranking } from "@/lib/calc";
import { pt, yen, CURRENT_MONTH, casePt, RANKS } from "@/lib/config";

export default function AdminDashboard() {
  const { agents, cases, stats } = useStore();

  const month = cases.filter((c) => c.date.startsWith(CURRENT_MONTH));
  const closed = month.filter((c) => c.status === "成約");
  const kyufu = closed.filter((c) => c.type === "給付").length;
  const zeimu = closed.filter((c) => c.type === "税務法務").length;

  const totalActiveUsers = agents.reduce((s, a) => s + a.activeUsers, 0);
  const totalMonthPt = stats.reduce((s, x) => s + x.monthPt, 0);
  const rewardTotal = stats.reduce((s, x) => s + x.rewardTotal, 0);
  const unpaidTotal = stats.reduce((s, x) => s + x.unpaidReward, 0);

  // ランク別 代理店数（個人代理店のみ）
  const byRank = RANKS.map((r) => ({
    r,
    n: agents.filter((a) => a.kind !== "ruby" && a.rank === r.key).length,
  }));
  const rubyCount = agents.filter((a) => a.kind === "ruby").length;

  const corp = ranking(stats, "month", "法人").slice(0, 10);
  const indiv = ranking(stats, "month", "一般").slice(0, 10);

  return (
    <div>
      <h2 className="h2">本店ダッシュボード</h2>
      <p className="sub">{CURRENT_MONTH}・X-LABO 代理店管理（アクティブユーザー・ポイント・報酬・ランキング）</p>

      <div className="grid4">
        <Kpi label="アクティブユーザー総数（当月）" val={totalActiveUsers.toLocaleString() + " 名"} />
        <Kpi label="当月 発行ポイント総数" val={pt(totalMonthPt)} accent="accent" />
        <Kpi label="給付サポート成約（当月）" val={kyufu + " 件"} accent="green" />
        <Kpi label="税務・法務案件（当月）" val={zeimu + " 件"} />
      </div>

      <div className="grid4" style={{ marginTop: 14 }}>
        <Kpi label="当月 報酬合計（お金）" val={yen(rewardTotal)} accent="ruby" />
        <Kpi label="未払い報酬" val={yen(unpaidTotal)} accent="orange" />
        <div className="card">
          <div className="label">個人代理店 ランク別</div>
          <div className="stack" style={{ gap: 3, marginTop: 6 }}>
            {byRank.map((b) => (
              <div key={b.r.key} className="row between" style={{ fontSize: 13 }}>
                <span className="muted">{b.r.emoji} {b.r.label}</span><strong>{b.n}社</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="label">法人代理店（ルビー）</div>
          <div className="kpi-num ruby">{rubyCount}社</div>
          <div className="label" style={{ marginTop: 4 }}>招待制・ランキング対象外</div>
        </div>
      </div>

      <div className="info-box" style={{ marginTop: 14 }}>
        <b>ポイント≠報酬。</b> ポイント（{pt(totalMonthPt)}）はランキング・ランク判定に使用。報酬（{yen(rewardTotal)}）はショット報酬・ルビー紹介報酬として別途支払管理します。
        付与ポイントは案件ごとに変動可（既定：給付サポート成約 {pt(casePt("給付"))}／件・税務法務 {pt(casePt("税務法務"))}／件）。
      </div>

      <div className="grid2" style={{ marginTop: 14 }}>
        <RankCard title="法人ランキング TOP10（当月pt）" list={corp} />
        <RankCard title="個人（一般）ランキング TOP10（当月pt）" list={indiv} />
      </div>

      <div className="row" style={{ gap: 12, marginTop: 14 }}>
        <Link href="/admin/entry" className="btn">＋ 実績を入力する</Link>
        <Link href="/admin/cases" className="btn ghost">案件管理へ</Link>
        <Link href="/admin/rewards" className="btn ghost">報酬支払管理へ</Link>
      </div>
    </div>
  );
}

function Kpi({ label, val, accent }: { label: string; val: string; accent?: string }) {
  const color =
    accent === "red" ? "var(--red)" : accent === "ruby" ? "var(--ruby)" : accent === "green" ? "var(--green)" : accent === "orange" ? "var(--orange)" : accent === "accent" ? "var(--accent)" : "var(--text)";
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="kpi-num" style={{ color }}>{val}</div>
    </div>
  );
}

function RankCard({ title, list }: { title: string; list: any[] }) {
  return (
    <div className="card">
      <strong>{title}</strong>
      <table style={{ marginTop: 10 }}>
        <thead><tr><th>順位</th><th>代理店番号</th><th>ランク</th><th style={{ textAlign: "right" }}>当月pt</th></tr></thead>
        <tbody>
          {list.length === 0 && <tr><td colSpan={4} className="muted">対象なし</td></tr>}
          {list.map((s) => (
            <tr key={s.agent.id}>
              <td><strong>#{s.pos}</strong></td>
              <td>{s.agent.no}</td>
              <td><span className="label">{s.currentRank.emoji} {s.currentRank.label}</span></td>
              <td style={{ textAlign: "right" }} className="ruby"><strong>{pt(s.value)}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
