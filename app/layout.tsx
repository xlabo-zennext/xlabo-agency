import "./globals.css";
import type { Metadata, Viewport } from "next";
import { StoreProvider } from "@/lib/store";
import AuthGate from "./AuthGate";

export const metadata: Metadata = {
  title: "X-LABO 代理店管理",
  description: "代理店ランク・アクティブユーザー・ポイント・ランキング・報酬を一元管理（プロトタイプ）",
};

export const viewport: Viewport = {
  themeColor: "#10203f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AuthGate>
          <StoreProvider>{children}</StoreProvider>
        </AuthGate>
      </body>
    </html>
  );
}
