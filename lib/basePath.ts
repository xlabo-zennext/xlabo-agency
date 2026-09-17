// 配信先によってURLの先頭に付く共通パス。
//   GitHub Pages（/<リポジトリ名>/ 配下） → "/xlabo-agency"
//   自社ドメイン（ルート配信）へ移行時      → 空文字
// ビルド時に NEXT_PUBLIC_BASE_PATH で切り替える（next.config.mjs も同じ値を読む）。
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// public/ 配下のファイルを指すURLを作る。
// next/link や next/router は basePath を自動で付けるが、素の <img src="/logo.png">
// には付かないため、画像などはこれを通す。
export const asset = (path: string) => `${BASE_PATH}${path}`;

// 申込リンク・紹介URLなど、アプリ外に渡す絶対URLを作る。
// ★ /apply/?ref=… のように必ず末尾スラッシュを付けること（静的ホスト互換）。
export const absoluteUrl = (path: string) =>
  typeof window === "undefined" ? `${BASE_PATH}${path}` : `${window.location.origin}${BASE_PATH}${path}`;
