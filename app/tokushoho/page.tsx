import Link from "next/link";

export default function Tokushoho() {
  return (
    <div className="legal">
      <Link href="/" className="back">‹ トップへ戻る</Link>
      <h1>特定商取引法に基づく表記</h1>
      <p className="updated">最終更新日：2026年8月4日</p>

      <table className="tkbl" style={{ marginTop: 12 }}>
        <tbody>
          <tr><th>販売事業者</th><td>X-LABO</td></tr>
          <tr><th>運営統括責任者</th><td>（本番リリース時に記載）</td></tr>
          <tr><th>所在地</th><td>（本番リリース時に記載）</td></tr>
          <tr><th>お問い合わせ</th><td>本サービス運営事務局（メール）。お問い合わせは原則メールにて受け付けます。</td></tr>
          <tr><th>販売価格</th><td>各サービス・プランのご案内ページに表示する金額（税込）。</td></tr>
          <tr><th>代金の支払時期・方法</th><td>クレジットカード／銀行振込等。支払時期は各申込時にご案内します。</td></tr>
          <tr><th>役務の提供時期</th><td>所定の手続き完了後、速やかに提供します。</td></tr>
          <tr><th>返品・キャンセル</th><td>役務の性質上、提供開始後の返品はお受けできない場合があります。詳細は個別契約に従います。</td></tr>
          <tr><th>代理店報酬について</th><td>報酬は当社規定に基づき、月末締め・翌月15日を目安に登録口座へ振り込みます。ポイントはランキング・ランク判定に用いるもので、報酬（金銭）とは異なります。</td></tr>
        </tbody>
      </table>

      <p className="note">※ 本ページはプロトタイプの記載例です。実際の記載内容は本番リリース前に確定します。</p>
    </div>
  );
}
