import Link from "next/link";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ maxWidth: 760, width: "100%" }}>
        <div className="center" style={{ marginBottom: 28 }}>
          <div className="brand" style={{ fontSize: 34, marginBottom: 14 }}>
            <span className="dot" /> X-LABO
          </div>
          <div className="pill" style={{ marginBottom: 14 }}>PROTOTYPE ・ ダミーデータ</div>
          <h1 style={{ fontSize: 26, margin: "0 0 8px" }}>代理店管理アプリ</h1>
          <p className="muted" style={{ margin: 0 }}>
            アクティブユーザー獲得 → ランク別pt自動集計 → ランキング → 報酬の支払管理までを一元管理
          </p>
        </div>

        <div className="grid2" style={{ gap: 18 }}>
          <Link href="/agent" className="card" style={{ display: "block" }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>📱</div>
            <h2 style={{ margin: "0 0 6px", fontSize: 19 }}>代理店アプリ</h2>
            <p className="muted" style={{ margin: "0 0 14px", fontSize: 13, lineHeight: 1.7 }}>
              シルバー〜プラチナ／ルビー代理店がスマホで見る画面。当月の保有pt・ランク・ランキング・報酬（ショット報酬など）を確認。
            </p>
            <span className="btn sm">代理店として開く →</span>
          </Link>

          <Link href="/admin" className="card" style={{ display: "block" }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>🏢</div>
            <h2 style={{ margin: "0 0 6px", fontSize: 19 }}>本店 管理画面</h2>
            <p className="muted" style={{ margin: "0 0 14px", fontSize: 13, lineHeight: 1.7 }}>
              本店（管理側）のバックオフィス。KPI・アクティブユーザー入力・案件登録・ポイント集計・報酬支払管理・組織/ルビー管理。
            </p>
            <span className="btn ruby sm">本店として開く →</span>
          </Link>
        </div>

        <div className="center" style={{ marginTop: 18 }}>
          <Link href="/join" className="btn ghost sm">🤝 代理店 新規登録フォーム</Link>
          <Link href="/apply?ref=XL-A1A7" className="btn ghost sm" style={{ marginLeft: 8 }}>📨 見込み客 申込フォーム（デモ）</Link>
          <Link href="/login" className="btn ghost sm" style={{ marginLeft: 8 }}>🔐 ログイン（二段階認証）</Link>
        </div>

        <div className="info-box" style={{ marginTop: 22 }}>
          <b>ポイントと報酬は別管理です（ポイント≠報酬）。</b> ポイントはランキング・ランク判定に使い、報酬（お金）はショット報酬・ルビー紹介報酬として支払管理します。
        </div>

        <p className="muted center" style={{ fontSize: 12, marginTop: 18, lineHeight: 1.8 }}>
          ※ ログイン/権限（本店・代理店）・二段階認証・スプレッドシート双方向同期などは本番版で実装します。<br />
          このプロトタイプは挙動と計算ロジックの確認用です（操作は即時に反映されます）。
        </p>

        <div className="row center" style={{ justifyContent: "center", gap: 16, marginTop: 22, borderTop: "1px solid var(--line)", paddingTop: 18 }}>
          <Link href="/privacy" className="muted" style={{ fontSize: 12, fontWeight: 700 }}>プライバシーポリシー</Link>
          <span className="muted" style={{ fontSize: 12 }}>|</span>
          <Link href="/tokushoho" className="muted" style={{ fontSize: 12, fontWeight: 700 }}>特定商取引法に基づく表記</Link>
        </div>
        <p className="muted center" style={{ fontSize: 11, marginTop: 10 }}>© X-LABO</p>
      </div>
    </div>
  );
}
