/** @type {import('next').NextConfig} */

// 配信先によってURLの先頭に付く共通パス。
//   GitHub Pages（/<リポジトリ名>/ 配下） → NEXT_PUBLIC_BASE_PATH=/xlabo-agency
//   自社ドメイン（ルート配信）へ移行時      → 未設定（空文字）
// 同じ値を lib/basePath.ts も読む（素の <img src="/..."> と申込リンク用）。
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  output: 'export',              // 静的サイトとして書き出し（out/）※退職サポートと同方式
  images: { unoptimized: true }, // 静的書き出し用
  trailingSlash: true,           // 各ページを /path/ で出力（静的ホスト互換）
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
