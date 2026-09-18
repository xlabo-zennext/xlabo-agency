#!/bin/bash
# X-LABO 代理店管理アプリ — Mac用 起動スクリプト
# Finderでこのファイルをダブルクリックすると開発サーバーが立ち上がります。
# 初回だけ: ターミナルで  chmod +x dev-launch.command  を実行してください。

set -e

# このスクリプトが置かれているフォルダへ移動（PCやユーザー名が違ってもOK）
cd "$(dirname "$0")"

# Homebrew版Nodeにもパスを通す（Finderから起動すると PATH が細くなるため）
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v npm >/dev/null 2>&1; then
  echo "‼ Node.js が見つかりません。"
  echo "  https://nodejs.org/ja から LTS版をインストールするか、"
  echo "  ターミナルで  brew install node  を実行してください。"
  echo ""
  read -r -p "Enterキーで閉じます..."
  exit 1
fi

# 依存パッケージが未インストールなら自動で入れる
if [ ! -d node_modules ]; then
  echo "▶ 初回セットアップ中（npm install）..."
  npm install
fi

# サーバー起動後にブラウザを開く
( sleep 4; open "http://localhost:3360" >/dev/null 2>&1 || true ) &

echo "▶ 開発サーバーを起動します → http://localhost:3360"
echo "  （停止するには Control + C）"
npm run dev
