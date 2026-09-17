# X-LABO 代理店管理アプリ — 作業ガイド（AI開発者向け）

このリポジトリで作業する Claude / 開発者への案内です。運用担当者はこのファイルを Claude に読ませれば、
逐一の指示なしで「起動・確認・修正・公開」まで進められます。

## これは何か
- X-LABO の代理店・本部管理 Webアプリ。Next.js 15（App Router）＋ TypeScript。
- **静的書き出し**（`output: export`）で、**GitHub Pages** に自動公開（退職サポートと同方式）。
- データ・認証・権限は **Supabase**（未接続時はデモのインメモリで動作）。

## ローカルで動かす
```
npm install
npm run dev
```
→ http://localhost:3360 （npm run dev を動かしている間だけ開けます）
デモのログイン：運営 `honbu2026` ／ 代理店 `agent2026`（Supabase未接続時のみ）

## 本番公開（GitHub Pages・push するだけ）
- `main` に push すると `.github/workflows/pages.yml` が自動でビルド＆公開。
- 公開先：https://xlabo-zennext.github.io/xlabo-agency/
- **前提**：リポジトリの Secrets（Settings → Secrets and variables → Actions）に
  `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` が必要。
  未設定だと「デモを公開しない」ため Actions は意図的に失敗する（正常な安全装置）。
- 将来、自社ドメイン（例 `xlabo.zennext-inc.com`）へ移行する場合は Pages にカスタムドメインを設定し、
  ビルド時の `NEXT_PUBLIC_BASE_PATH` を空にする（`lib/basePath.ts` / `next.config.mjs` 参照）。

## Supabase（本番DB・認証・権限）
1. Supabase でプロジェクト作成（東京リージョン・アカウントは会社共通）
2. SQL Editor で `supabase/schema.sql` → `supabase/rls.sql` を実行
3. Project Settings → API の URL・anon キーを、ローカルは `.env.local`、本番は GitHub Secrets に設定
4. Authentication → Users でログイン作成 → `profiles` に `role`（admin/agency/ruby）と `agent_id`
- 権限（誰が何を見られるか）は `supabase/rls.sql` が担保：運営=全権／代理店=自分の分のみ／ルビー=紹介先の実績のみ（会員個人情報は不可）。

## 変更するときの約束（重要）
- **本番反映は一人（一経路）に絞る**。前田さんのMac か 運用担当のClaude か、どちらか一方が push を持つ。
  複数から同時に push すると代理店の重複・エラーが起きた前例あり（同一リポを複数セッションで同時に触らない）。
- push する前に必ず `git pull`。作業後は必ず GitHub に push（ローカルだけで放置しない）。
- 制度・ポイント・報酬のルールは `lib/config.ts` に集約。ロジックは `lib/calc.ts`。UIは `app/`。
- 申込・紹介の外部URLは `lib/basePath.ts` の `absoluteUrl('/apply/?ref=…')` を使う（末尾スラッシュ必須）。
- 「動作確認済み」と言うのは、実際に動かして通ったときだけ。

## 主な画面
- 本部 `/admin`：ダッシュボード／見込み・申込／会員管理／実績入力／案件管理／報酬支払管理／組織・代理店管理／操作ログ
- 代理店 `/agent`：ホーム／ランキング／報酬／マイページ（紹介URL・QR）
- 公開：`/apply?ref=<紹介コード>`（見込み客の申込フォーム）
