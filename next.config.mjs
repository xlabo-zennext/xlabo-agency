/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',              // 静的サイトとして書き出し（out/）※退職サポートと同方式
  images: { unoptimized: true }, // 静的書き出し用
  trailingSlash: true,           // 各ページを /path/ で出力（静的ホスト互換）
};

export default nextConfig;
