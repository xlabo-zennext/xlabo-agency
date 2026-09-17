"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { statOf } from "@/lib/calc";
import { RANKS, pt, rankLabelOf, RUBY } from "@/lib/config";
import { Qr } from "@/components/Qr";
import { absoluteUrl } from "@/lib/basePath";

export default function MyPage() {
  const { stats, agents, viewAgentId, leads } = useStore();
  const me = statOf(stats, viewAgentId)!;
  const a = me.agent;
  const isRuby = a.kind === "ruby";
  const referrer = agents.find((x) => x.id === a.referrerId);
  const referred = agents.filter((x) => x.referrerId === a.id);
  const rl = rankLabelOf(a);
  const [copied, setCopied] = useState(false);

  // 紹介URL（申込フォーム）※配信先のbasePathも自動で付く（Pages配下でも正しいURLになる）
  const [applyUrl, setApplyUrl] = useState("");
  useEffect(() => { setApplyUrl(absoluteUrl(`/apply/?ref=${a.code}`)); }, [a.code]);

  // 自分の申込状況（自分に紐づく見込み客のみ）
  const myLeads = leads.filter((l) => l.agentId === a.id);
  const leadCnt = (s: string) => myLeads.filter((l) => l.status === s).length;

  const copy = () => {
    navigator.clipboard?.writeText(applyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="stack" style={{ gap: 14 }}>
      <h2 style={{ margin: "4px 2px", fontSize: 20 }}>👤 マイページ</h2>

      <div className="card">
        <div className="row between">
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{a.name}</div>
            <div className="label">{a.no}・{isRuby ? "法人代理店（ルビー）" : "個人代理店"}・{a.category}・登録 {a.joinDate}</div>
          </div>
          <div className={"rankbadge" + (isRuby ? " ruby" : "")}>{rl.emoji} {rl.label}</div>
        </div>
      </div>

      <div className="card">
        <div className="label">あなたの専用紹介URL / QR</div>
        <p className="muted" style={{ fontSize: 12, margin: "6px 0 10px", lineHeight: 1.7 }}>
          見込みのお客様へこのURL（またはQR）を送るだけ。お客様が簡単フォームで申し込むと、以降の登録・決済案内は<b>X-LABO運営が対応</b>。完了後、あなたの<b>アクティブ会員として自動で紐付き</b>、pt・報酬に反映されます。
        </p>
        <div className="row" style={{ gap: 14, alignItems: "center" }}>
          <Qr text={applyUrl} size={120} />
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="input" style={{ fontSize: 12, wordBreak: "break-all", background: "var(--card2)" }}>{applyUrl}</div>
            <button className="btn sm" style={{ marginTop: 8 }} onClick={copy}>{copied ? "コピー済 ✓" : "URLをコピー"}</button>
            <div className="label" style={{ marginTop: 8 }}>紹介コード：{a.code}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row between" style={{ marginBottom: 8 }}>
          <strong>あなたの申込状況</strong>
          <span className="label">計 {myLeads.length}件</span>
        </div>
        <div className="grid3" style={{ gap: 10 }}>
          <div className="card tight center"><div className="kpi-num ruby">{leadCnt("申込") + leadCnt("対応中")}</div><div className="label">対応中</div></div>
          <div className="card tight center"><div className="kpi-num green">{leadCnt("登録完了")}</div><div className="label">会員登録済</div></div>
          <div className="card tight center"><div className="kpi-num">{leadCnt("見送り")}</div><div className="label">見送り</div></div>
        </div>
        <p className="muted" style={{ fontSize: 11, margin: "8px 0 0" }}>※ 登録・決済の手続きは運営が対応します。あなたはURLを送るだけでOKです。</p>
      </div>

      <div className="card">
        <strong>紹介関係</strong>
        <div className="stack" style={{ gap: 6, marginTop: 10 }}>
          {referrer && <div className="label">紹介元：{referrer.no}・{referrer.name}（{referrer.kind === "ruby" ? "ルビー" : "個人"}）</div>}
          <div className="rankrow me">
            <span>📍</span>
            <div className="grow"><strong>{a.name}（{a.no}）</strong></div>
            <span className="label">{pt(me.monthPt)}</span>
          </div>
          {referred.map((c) => {
            const cs = statOf(stats, c.id)!;
            return (
              <div key={c.id} className="rankrow" style={{ marginLeft: 18 }}>
                <span>↳</span>
                <div className="grow">{c.name}（{c.no}）</div>
                <span className="label">{pt(cs.monthPt)}</span>
              </div>
            );
          })}
          {referred.length === 0 && !referrer && <div className="muted" style={{ fontSize: 13 }}>紹介関係はまだありません。</div>}
          {isRuby && referred.length > 0 && (
            <div className="note-box" style={{ marginTop: 4 }}>紹介先 {referred.length}社の<b>アクティブユーザーptの50%が報酬</b>、月間総ptの<b>10%が加算pt</b>として反映されます。</div>
          )}
        </div>
      </div>

      <div className="card">
        <strong>口座情報</strong>
        <div className="label" style={{ marginTop: 8 }}>振込先：{a.bank}</div>
      </div>

      <div className="card">
        <strong>ランク早見表（保有pt・毎月1日判定／昇格・降格あり）</strong>
        <div className="stack" style={{ gap: 6, marginTop: 10 }}>
          {RANKS.map((r) => (
            <div key={r.key} className="row between" style={{ opacity: !isRuby && a.rank === r.key ? 1 : 0.6 }}>
              <span>{r.emoji} {r.label}（{r.rate}pt/人・{r.usersGuide}）</span>
              <span className="label">
                {pt(r.min)}{r.max ? `〜${r.max.toLocaleString()}` : "〜"}
                {!isRuby && a.rank === r.key && <span className="ruby"> 現在</span>}
              </span>
            </div>
          ))}
          <div className="row between" style={{ opacity: isRuby ? 1 : 0.6, borderTop: "1px solid var(--line)", paddingTop: 6 }}>
            <span>{RUBY.emoji} {RUBY.label}（法人・招待制）</span>
            <span className="label">ランキング・ランク判定 対象外{isRuby && <span className="ruby"> 現在</span>}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
