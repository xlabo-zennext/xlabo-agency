-- ============================================================
-- 権限（行レベルセキュリティ RLS）— X-LABO / Supabase / PostgreSQL
-- Phase 0 設計。schema.sql の後に実行する。
-- 役割（本部指定 #8）：
--   admin  … 運営管理者（全データ閲覧・編集）
--   agency … 個人代理店（自分に紐づくユーザー/案件/pt/報酬のみ）
--   ruby   … 法人代理店（自分が紹介した代理店の"実績のみ"。配下ユーザーの個人情報は不可＝ID/代理店名のみ）
-- すべての変更は audit_log に記録（誰が・いつ・何を）。
-- ============================================================

-- ---------- 現在のユーザーの role / agent を返すヘルパー ----------
create or replace function current_role_name() returns user_role
  language sql stable security definer as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function current_agent_id() returns text
  language sql stable security definer as $$
  select agent_id from profiles where id = auth.uid();
$$;

-- 自分が紹介した代理店（ルビーの実績閲覧対象）か
create or replace function is_referred_by_me(target text) returns boolean
  language sql stable security definer as $$
  select exists (select 1 from agents where id = target and referrer_id = current_agent_id());
$$;

-- ============================================================
-- RLS 有効化
-- ============================================================
alter table profiles       enable row level security;
alter table agents         enable row level security;
alter table members        enable row level security;
alter table cases          enable row level security;
alter table leads          enable row level security;
alter table reward_payouts enable row level security;
alter table audit_log      enable row level security;

-- ============================================================
-- admin（運営管理者・全権）：すべてのテーブルを全操作
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['profiles','agents','members','cases','leads','reward_payouts','audit_log']
  loop
    execute format('create policy admin_all on %I for all
      using (current_role_name() = ''admin'') with check (current_role_name() = ''admin'');', t);
  end loop;
end $$;

-- 自分のプロフィールは本人のみ閲覧
create policy self_profile on profiles for select using (id = auth.uid());

-- ============================================================
-- agency（個人代理店）：自分に紐づくデータのみ SELECT（編集不可）
-- ============================================================
create policy agency_self on agents for select
  using (current_role_name() = 'agency' and id = current_agent_id());
create policy agency_members on members for select
  using (current_role_name() = 'agency' and agent_id = current_agent_id());
create policy agency_cases on cases for select
  using (current_role_name() = 'agency' and agent_id = current_agent_id());
create policy agency_leads on leads for select
  using (current_role_name() = 'agency' and agent_id = current_agent_id());
create policy agency_payouts on reward_payouts for select
  using (current_role_name() = 'agency' and agent_id = current_agent_id());

-- ============================================================
-- ruby（法人代理店）：自分＋紹介先代理店の "実績" を SELECT。
--   ・agents  … 自分＋紹介先（ただし紹介先の個人情報/口座は下記マスクビューで隠す）
--   ・members … 自分の会員のみ（紹介先の会員＝個人情報は閲覧不可）
--   ・cases/leads/payouts … 自分の分のみ（紹介報酬は自分のpayoutに計上）
-- ============================================================
create policy ruby_agents on agents for select
  using (current_role_name() = 'ruby' and (id = current_agent_id() or referrer_id = current_agent_id()));
create policy ruby_members on members for select
  using (current_role_name() = 'ruby' and agent_id = current_agent_id());
create policy ruby_cases on cases for select
  using (current_role_name() = 'ruby' and agent_id = current_agent_id());
create policy ruby_leads on leads for select
  using (current_role_name() = 'ruby' and agent_id = current_agent_id());
create policy ruby_payouts on reward_payouts for select
  using (current_role_name() = 'ruby' and agent_id = current_agent_id());

-- ログインユーザーは自分の操作を audit_log に追記可能（閲覧は admin のみ＝上の admin_all）
create policy audit_insert_self on audit_log for insert
  with check (auth.uid() is not null and (actor = auth.uid() or actor is null));

-- ============================================================
-- 代理店/ルビー向け マスク済みビュー（紹介先の個人情報・口座を隠す）
--   自分の行は実データ、紹介先の行は氏名以外の個人情報/口座をNULLに。
--   → ルビーは「ID・代理店名・実績（人数/pt/報酬の数字）」のみ閲覧可（#8）。
--   アプリの該当画面は agents ではなく agents_view を参照する。
-- ============================================================
create or replace view agents_view
with (security_invoker = true) as
  select
    id, no, name, kind, rank, referrer_id, category, code, base_pt, join_date, status,
    active_users, month_active_pt, month_case_pt, referral_pt, month_pt,
    honnin_reward, ruby_reward, total_reward, cumulative_pt,
    -- 個人情報・口座：自分の行のみ表示、紹介先はNULL
    case when id = current_agent_id() then email       else null end as email,
    case when id = current_agent_id() then phone       else null end as phone,
    case when id = current_agent_id() then address     else null end as address,
    case when id = current_agent_id() then acct_no     else null end as acct_no,
    case when id = current_agent_id() then acct_holder else null end as acct_holder
  from agents;

-- 会員（members）は「担当代理店本人＋admin」のみ閲覧可（RLSで担保）。
-- ルビーは紹介先の会員個票を閲覧できない（実績の数字は agents_view の集計列で把握）。
