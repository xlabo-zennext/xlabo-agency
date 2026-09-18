/** @type {import('next').NextConfig} */

// 配信先を1つのコードで両対応：
//   GitHub Pages（サブパス配信）: NEXT_PUBLIC_BASE_PATH=/xlabo-agency を渡す
//     → 静的書き出し(output:export)＋basePath で out/ を生成（pages.yml がこの形）
//   Vercel（ルート配信・商用/本番）: NEXT_PUBLIC_BASE_PATH を渡さない
//     → Next.js ネイティブビルド（basePathなし・ルート）。環境変数だけ設定すればそのまま動く
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  images: { unoptimized: true }, // 静的書き出し・画像最適化なしでどちらでも動く
  trailingSlash: true,           // /path/ 形式（静的ホスト互換・Vercelでも可）
  ...(basePath
    ? { output: 'export', basePath, assetPrefix: basePath } // GitHub Pages 用
    : {}),                                                    // Vercel はネイティブビルド
};

export default nextConfig;
