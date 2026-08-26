# Mac セットアップ手順（X-LABO 代理店管理アプリ）

このアプリを **会社Mac で開発・確認・運用できるようにする** ための手順です。
上から順にやれば完了します。所要時間の目安は **20〜30分**。

> **このアプリの現状（2026-08）**
> - コードは GitHub に保管されています（`maedaakio0325-boop/xlabo-agency`・Private）
> - **Mac には Node.js が未導入**でした。そのため従来は「開発・起動は Windows 側で」という
>   運用になっていました。本手順で Mac に Node.js を入れて、その制約を解消します
> - まだ Supabase 未接続の「デモモード」で動きます（データは保存されません）。
>   本番接続は下のステップ5から

> ⚠️ **持ち込んではいけないもの**
> Windows 側の `node_modules` フォルダをコピーしないでください。OSごとに中身が違うため
> 必ず起動に失敗します。Mac では `npm install` で入れ直します（本手順に含まれています）。

---

## セットアップ チェックリスト

- [ ] ステップ1：Mac に Node.js と Git を入れる
- [ ] ステップ2：コードを GitHub から取ってくる
- [ ] ステップ3：起動して動作確認（デモモード）
- [ ] ステップ4：Claude Code を入れる（コード修正用・任意）
- [ ] ステップ5：本番接続（Supabase）— 本番運用するときだけ
- [ ] ステップ6：スプレッドシート連携 — 使うときだけ

---

## ステップ1：Mac に Node.js と Git を入れる

Mac の「ターミナル」を開きます（Command + スペース →「ターミナル」と入力）。

**1-1. コマンドラインツール（Git を含む）**

```
xcode-select --install
```

案内に従ってインストール（数分）。

**1-2. Node.js**

Homebrew を使う場合：

```
brew install node
```

Homebrew が入っていない場合は、https://nodejs.org/ja から **LTS版（推奨）** の
macOS インストーラー（.pkg）をダウンロードして実行してください。

**1-3. 確認**

```
node -v
```

`v20` 以上（最低 v18）が表示されれば OK です。続けて：

```
npm -v
```

```
git --version
```

どちらもバージョン番号が出れば準備完了です。

---

## ステップ2：コードを GitHub から取ってくる

```
mkdir -p ~/dev
```

```
cd ~/dev
```

```
git clone https://github.com/maedaakio0325-boop/xlabo-agency.git
```

```
cd xlabo-agency
```

```
npm install
```

初回だけ2〜3分かかります。

> **GitHub のログインを求められたら**：パスワードではなく「パーソナルアクセストークン」が必要です。
> 楽なのは GitHub CLI を使う方法です。
> ```
> brew install gh
> ```
> ```
> gh auth login
> ```
> （GitHub.com → HTTPS → ブラウザでログイン、を選んでください）

> **Mac に古いコピーが残っている場合**：GitHub 側が正データです。古いフォルダは消さずに
> 名前を `xlabo-agency-old` などに変えて残しておき、動作確認が済んでから削除してください。

---

## ステップ3：起動して動作確認（デモモード）

Finder で `~/dev/xlabo-agency` を開き、**`dev-launch.command` をダブルクリック**します。

初回だけ「開けません（開発元を確認できないため）」と出ることがあります。その場合：

```
chmod +x ~/dev/xlabo-agency/dev-launch.command
```

を一度実行し、それでもブロックされるときは **右クリック →「開く」→「開く」** を選んでください。

ターミナル派の方は、これだけでも起動します：

```
npm run dev
```

ブラウザで **http://localhost:3360** を開いて、次を確認します。

- [ ] ログイン画面が出る
- [ ] 運営用パスワード `honbu2026` で `/admin` に入れる
- [ ] 代理店用パスワード `agent2026` で `/agent` に入れる
- [ ] ダッシュボードに数字とランキングが表示される

停止するには、ターミナルで **Control + C**。

> この時点では Supabase 未接続なので、入力したデータは保存されません（デモモード）。
> 画面と動きの確認用です。

---

## ステップ4：Claude Code を入れる（任意）

日本語で指示してコードを修正するツールです。運用担当者が修正まで行う場合に入れてください。

```
npm install -g @anthropic-ai/claude-code
```

アプリのフォルダの中で `claude` と打つと起動します。初回はブラウザで Anthropic アカウントの
ログインを求められます。

日々の修正の流れ：

```
git pull
```
→ `claude` を起動して日本語で修正を依頼 → `npm run dev` で確認 →
```
git add -A
```
```
git commit -m "変更内容の説明"
```
```
git push
```

**必ず「ローカル（localhost）で確認 → OKなら push」の順番を守ってください。**

---

## ステップ5：本番接続（Supabase）

実際にデータを保存して運用する段階になったら実施します。詳細な設計は
[`supabase/DESIGN.md`](./supabase/DESIGN.md) を参照してください。

1. https://supabase.com でプロジェクト作成（リージョンは **Tokyo (ap-northeast-1)**）
2. SQL Editor で [`supabase/schema.sql`](./supabase/schema.sql) →
   [`supabase/rls.sql`](./supabase/rls.sql) の順に実行
3. 接続情報をアプリに設定：

```
cd ~/dev/xlabo-agency
```

```
cp .env.local.example .env.local
```

```
nano .env.local
```

| 変数名 | 入れるもの | 取得先 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public キー | 同上 |
| `NEXT_PUBLIC_SHEET_WEBAPP_URL` | Apps Script の `/exec` URL | ステップ6で取得（任意） |

**Control + O → Enter → Control + X** で保存して閉じます。

4. 開発サーバーを再起動（Control + C → もう一度起動）
   → ログインが **メール＋パスワード方式** に切り替わります

> ⚠️ **`service_role`（secret）キーは絶対に設定しないでください。** このアプリが使うのは
> `anon public` キーだけです。権限は Supabase 側の RLS で守られます。
>
> ⚠️ `.env.local` は Git 管理外です（`.gitignore` で除外済み）。GitHub には上がりませんし、
> **上げてはいけません。** チャットやメールにも貼らないでください。

---

## ステップ6：スプレッドシート連携（任意）

アプリの入力内容を Google スプレッドシートへ反映する機能です。手順は README の
「Googleスプレッドシート連携」節にあります。取得した `/exec` URL を、ステップ5の
`.env.local` に `NEXT_PUBLIC_SHEET_WEBAPP_URL` として追記し、サーバーを再起動してください。

---

## よくあるトラブル

| 症状 | 対処 |
|---|---|
| ダブルクリックで一瞬で閉じる | ターミナルで `cd ~/dev/xlabo-agency && npm run dev` を実行し、エラー内容を確認 |
| `command not found: npm` | ステップ1の Node.js が未導入。`brew install node` |
| `permission denied: ./dev-launch.command` | `chmod +x dev-launch.command` |
| `Error: listen EADDRINUSE :3360` | ポート使用中。`lsof -ti:3360 \| xargs kill` で解放 |
| 起動はするがデータが保存されない | Supabase 未接続（デモモード）です。ステップ5を実施 |
| `.env.local` を直したのに反映されない | 開発サーバーの再起動が必要です（Control + C → 起動し直し） |
| ビルド時に `sharp` などのエラー | Windows の `node_modules` を持ち込んだのが原因。`rm -rf node_modules && npm install` |

---

## 複数の端末で作業する場合

どの PC でも、**作業開始前に必ず**：

```
git pull
```

作業が終わったら：

```
git add -A
```
```
git commit -m "変更内容の説明"
```
```
git push
```

これを守れば、端末間で中身がズレることはありません。

> 💡 ターミナルへ貼り付けるときは **1行ずつ**にしてください。複数行をまとめて貼ると
> 改行が消えてコマンドが繋がり、意図しない場所で実行されることがあります。
