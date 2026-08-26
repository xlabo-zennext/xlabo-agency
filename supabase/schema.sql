-- ============================================================
-- X-LABO 代理店管理アプリ — 本番DBスキーマ（Supabase / PostgreSQL）
-- Phase 0 設計。Supabase の SQL Editor で上から順に実行する。
-- 方針：
--   * 本部の管理スプレッドシート（代理店マスタ／会員／案件／申込／台帳）を保持
--   * 代理店ID(XL-xxx/RUBY-xxx)・会員ID(U-xxxx)・案件ID(C-xxxx)は現行値をそのまま主キーに
--   * 権限は Supabase Auth + 行レベルセキュリティ(RLS)。ポリシーは rls.sql 参照
--   * ポイント・報酬の計算はアプリ側（lib/calc.ts）と同一ロジック。DBは元データ＋月次スナップショットを保持
-- ============================================================

-- ---------- ENUM 型 ----------
create type user_role   as enum ('admin', 'agency', 'ruby');            -- 運営管理者 / 個人代理店 / ルビー(法人)代理店
create type agent_kind  as enum ('individual', 'ruby');
create type indiv_rank  as enum ('silver', 'gold', 'platinum');
create type agent_cat   as enum ('法人', '一般');
create type member_status as enum ('有効', '停止', '解約');
create type case_type   as enum ('給付', '税務法務');
create type case_status as enum ('対応中', '成約', 'キャンセル');
create type lead_status as enum ('申込', '対応中', '登録完了', '見送り');
create type reward_kind as enum ('本人報酬', 'ショット報酬', 'ルビー紹介報酬');

-- ============================================================
-- 1. profiles … ログインユーザー（Supabase auth.users を拡張）
-- ============================================================
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  email      text not null,
  role       user_role not null default 'agency',
  agent_id   text,                       -- role='agency'/'ruby' のとき、その代理店ID
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. agents … 代理店マスタ（「代理店マスタ」タブ由来）
--    個人代理店（silver/gold/platinum）＋ 法人代理店（ruby・招待制）
--    今月〜列 は月次スナップショット（毎月1日集計・ルビーの実績閲覧＆ランク判定に使用）
-- ============================================================
create table agents (
  id          text primary key,          -- 代理店ID（XL-001 / RUBY-001）
  no          text,                       -- 表示番号（=id）
  name        text not null,
  kind        agent_kind not null default 'individual',
  rank        indiv_rank not null default 'silver',   -- 当月適用ランク
  referrer_id text references agents(id),               -- 紹介元（ルビー等）
  category    agent_cat not null default '一般',
  code        text,                       -- 紹介コード（申込URLの ?ref= に使用）
  base_pt     bigint not null default 0,  -- 移行前の累計pt
  join_date   date,
  status      text default '稼働中',
  -- 月次スナップショット（=「代理店マスタ」タブの 今月〜列）
  active_users     int   default 0,       -- 今月アクティブ数（有効会員数）
  month_active_pt  bigint default 0,      -- 今月アクティブpt
  month_case_pt    bigint default 0,      -- 今月案件pt
  referral_pt      bigint default 0,      -- 紹介代理店10%pt
  month_pt         bigint default 0,      -- 今月累計pt
  honnin_reward    bigint default 0,      -- 今月本人報酬
  ruby_reward      bigint default 0,      -- 今月ルビー報酬
  total_reward     bigint default 0,      -- 今月総報酬
  cumulative_pt    bigint default 0,      -- 通算累計pt
  -- 個人情報・口座（ルビー＝紹介先の分は非表示。マスク済みビュー経由で提供）
  furigana text, birthday date, email text, phone text, zip text, address text,
  bank_name text, branch text, acct_type text, acct_no text, acct_holder text,
  created_at timestamptz not null default now()
);
create index on agents(referrer_id);

-- ============================================================
-- 3. members … 会員（アクティブユーザー・「ユーザー・アクティブ会員管理」タブ由来）
--    月額会員（既定7,980円）。status='有効' の人数が代理店のアクティブ数。※個人情報
-- ============================================================
create table members (
  id          text primary key,          -- 会員ID（U-0001）
  member_no   text,
  agent_id    text not null references agents(id),  -- 担当代理店
  name        text not null,
  phone       text,
  line_name   text,
  email       text,
  pref        text,                       -- 住所/都道府県
  join_date   date,
  start_date  date,                       -- 利用開始日
  cancel_date date,                       -- 解約日
  monthly_fee bigint not null default 7980,
  pay_method  text,
  pay_status  text,
  status      member_status not null default '有効',
  note        text,
  created_at  timestamptz not null default now()
);
create index on members(agent_id);
create index on members(status);

-- ============================================================
-- 4. cases … 案件（給付サポート成約 / 税務・法務案件・「進行中案件」タブ由来）
--    成約でポイント確定。給付はショット報酬あり。付与ptは案件ごとに可変。
-- ============================================================
create table cases (
  id          text primary key,          -- 案件ID（C-0001）
  case_no     text,
  agent_id    text not null references agents(id),
  member_id   text references members(id),
  type        case_type not null,
  customer    text,                       -- 対象者名
  status      case_status not null default '対応中',
  points      bigint,                     -- 付与ポイント（案件ごと・成約で有効）
  shot_reward bigint,                     -- 給付のみ：ショット報酬
  staff       text,
  note        text,
  date        date,                       -- 受付日
  created_at  timestamptz not null default now()
);
create index on cases(agent_id);

-- ============================================================
-- 5. leads … 見込み客（申込・トスアップ）。代理店の紹介URL/QRから受付。
--    運営が「会員化」→ members に登録し converted_member_id を記録。
-- ============================================================
create table leads (
  id            text primary key,        -- 申込ID（L-0001）
  lead_no       text,
  agent_id      text not null references agents(id),  -- 紹介元代理店
  name          text not null,
  phone         text,
  line_name     text,
  email         text,
  pref          text,
  message       text,
  status        lead_status not null default '申込',
  date          date,
  converted_member_id text references members(id),
  created_at    timestamptz not null default now()
);
create index on leads(agent_id);

-- ============================================================
-- 6. reward_payouts … 報酬の振込単位・支払履歴（「報酬台帳」タブ由来）
--    本人報酬・ショット報酬・ルビー紹介報酬を、代理店×月/案件ごとに記録。
-- ============================================================
create table reward_payouts (
  id         bigint generated always as identity primary key,
  agent_id   text references agents(id),
  kind       reward_kind not null,
  amount     bigint not null,
  month      text,                        -- 対象月（YYYY-MM）
  ref_id     text,                        -- 案件ID（ショット）等
  paid_date  date not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index on reward_payouts(agent_id);

-- ============================================================
-- 7. audit_log … 操作ログ（誰が・いつ・何を）
-- ============================================================
create table audit_log (
  id         bigint generated always as identity primary key,
  actor      uuid references profiles(id),
  actor_name text,
  role       text,
  action     text not null,               -- 案件登録 / 会員化 / 会員解約 / ランク変更 / 報酬振込 など
  table_name text,
  record_id  text,
  detail     jsonb,
  at         timestamptz not null default now()
);
create index on audit_log(at desc);
