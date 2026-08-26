// Supabase クライアント（ブラウザから直接DBへ）。
// 接続情報は環境変数（.env.local）から読み込む。どちらも公開前提の値：
//   NEXT_PUBLIC_SUPABASE_URL       … プロジェクトURL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY  … anon public キー（RLSで保護）
// ※ service_role（secret）キーはフロントには絶対に置かない。

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// 接続情報が未設定でもビルドは通る（未接続時はデモのインメモリで動作）
export const supabaseReady = Boolean(url && anon);
export const supabase = createClient(url || "https://placeholder.supabase.co", anon || "placeholder-anon-key");
