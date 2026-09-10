"use client";

// アプリ全体の状態（DB＝Supabase / 未接続時はインメモリのデモ）。
// 本部の操作が代理店画面に即反映される。Supabase接続時は入力がDBに永続化される（Phase 2）。

import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { Agent, Case, CaseStatus, IndivRank, User, Lead, LeadStatus, AuditLog, Role } from "./types";
import { AGENTS, CASES, USERS, LEADS, INITIAL_LOGS, INITIAL_PAID } from "./mock";
import { buildStats, rewardItems, honninKey, shotKey, rubyKey } from "./calc";
import { casePoints, rankLabelOf, MONTHLY_FEE, CURRENT_MONTH } from "./config";
import { supabase, supabaseReady } from "./supabase";
import {
  pushRows, caseToRow, agentToRow, userToRow, sheetSyncEnabled,
  TAB_CASES, TAB_AGENTS, TAB_USERS, SyncResult,
} from "./sheetSync";

const OPERATOR = "運営管理者";
const today = () => new Date().toISOString().slice(0, 10);

// ── Supabaseへの書き込み（未接続時は no-op・失敗してもUIは止めない） ──
function push(p: PromiseLike<unknown> | undefined) {
  if (supabaseReady && p) Promise.resolve(p).then(() => {}, () => {});
}
const caseDb = (c: Case) => ({ id: c.id, case_no: c.caseNo, agent_id: c.agentId, type: c.type, customer: c.customer, status: c.status, points: c.points ?? null, shot_reward: c.shotReward ?? null, staff: c.staff ?? null, note: c.note ?? null, date: c.date });
const userDb = (u: User) => ({ id: u.id, member_no: u.memberNo, agent_id: u.agentId, name: u.name, phone: u.phone ?? null, line_name: u.lineName ?? null, email: u.email ?? null, pref: u.pref ?? null, join_date: u.joinDate ?? null, start_date: u.startDate ?? null, cancel_date: u.cancelDate ?? null, monthly_fee: u.monthlyFee, pay_method: u.payMethod ?? null, pay_status: u.payStatus ?? null, status: u.status, note: u.note ?? null });
const leadDb = (l: Lead) => ({ id: l.id, lead_no: l.leadNo, agent_id: l.agentId, name: l.name, phone: l.phone ?? null, line_name: l.lineName ?? null, email: l.email ?? null, pref: l.pref ?? null, message: l.message ?? null, status: l.status, date: l.date, converted_member_id: l.convertedUserId ?? null });
const agentDb = (a: Agent) => ({ id: a.id, no: a.no, name: a.name, kind: a.kind, rank: a.rank, referrer_id: a.referrerId, category: a.category, code: a.code, base_pt: a.basePt, join_date: a.joinDate, phone: a.phone ?? null, email: a.email ?? null, address: a.address ?? null });

interface Store {
  agents: Agent[];
  cases: Case[];
  users: User[];
  leads: Lead[];
  logs: AuditLog[];
  viewAgentId: string;
  setViewAgentId: (id: string) => void;

  addCase: (c: Omit<Case, "id" | "caseNo">) => void;
  setCaseStatus: (id: string, status: CaseStatus) => void;
  setShotReward: (id: string, amount: number) => void;
  setCasePoints: (id: string, points: number) => void;

  addUser: (u: Omit<User, "id" | "memberNo" | "status">) => void;
  cancelUser: (id: string, cancelDate: string) => void;
  reactivateUser: (id: string) => void;

  addLead: (l: Omit<Lead, "id" | "leadNo" | "status" | "date">) => void;
  setLeadStatus: (id: string, status: LeadStatus) => void;
  convertLead: (id: string, opts?: { payMethod?: string }) => void;

  setRank: (id: string, rank: IndivRank) => void;
  addAgent: (a: Omit<Agent, "id" | "no" | "basePt" | "code">) => void;

  paid: Record<string, { amount: number; date: string }>;
  payReward: (p: { key: string; agentId: string; amount: number; date: string }) => void;

  syncEnabled: boolean;
  pushActiveUsers: () => Promise<SyncResult>;

  stats: ReturnType<typeof buildStats>;
  rewards: ReturnType<typeof rewardItems>;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [baseAgents, setBaseAgents] = useState<Agent[]>(supabaseReady ? [] : AGENTS);
  const [cases, setCases] = useState<Case[]>(supabaseReady ? [] : CASES);
  const [users, setUsers] = useState<User[]>(supabaseReady ? [] : USERS);
  const [leads, setLeads] = useState<Lead[]>(supabaseReady ? [] : LEADS);
  const [logs, setLogs] = useState<AuditLog[]>(supabaseReady ? [] : INITIAL_LOGS);
  const [paid, setPaid] = useState<Record<string, { amount: number; date: string }>>(supabaseReady ? {} : INITIAL_PAID);
  const [viewAgentId, setViewAgentId] = useState<string>(supabaseReady ? "" : "003");

  // アクティブユーザー数 = 「有効」会員数（会員登録・解約から自動算出）
  const agents = useMemo(
    () => baseAgents.map((a) => ({ ...a, activeUsers: users.filter((u) => u.agentId === a.id && u.status === "有効").length })),
    [baseAgents, users]
  );

  const stats = useMemo(() => buildStats(agents, cases, paid), [agents, cases, paid]);
  const rewards = useMemo(() => rewardItems(agents, cases), [agents, cases]);

  const agentNoOf = (id: string) => agents.find((a) => a.id === id)?.no || id;
  const referrerNoOf = (id: string | null) => (id ? agents.find((a) => a.id === id)?.no : undefined);

  // ── Supabase接続時：初回にDBから読み込む ──
  useEffect(() => {
    if (!supabaseReady) return;
    supabase.from("agents").select("*").then(({ data }) => {
      if (!data) return;
      const rows: Agent[] = data.map((r: any) => ({
        id: r.id, no: r.no ?? r.id, name: r.name, kind: r.kind, rank: r.rank,
        referrerId: r.referrer_id ?? null, category: r.category, code: r.code ?? r.id,
        bank: r.bank ?? "", joinDate: r.join_date ?? "", basePt: r.base_pt ?? 0, activeUsers: 0,
        phone: r.phone, email: r.email, address: r.address,
      }));
      setBaseAgents(rows);
      if (rows[0]) setViewAgentId((v) => v || rows[0].id);
    });
    supabase.from("members").select("*").limit(5000).then(({ data }) => {
      if (!data) return;
      setUsers(data.map((r: any) => ({
        id: r.id, memberNo: r.member_no, agentId: r.agent_id, name: r.name, phone: r.phone,
        lineName: r.line_name, email: r.email, pref: r.pref, joinDate: r.join_date, startDate: r.start_date,
        cancelDate: r.cancel_date, monthlyFee: r.monthly_fee ?? MONTHLY_FEE, payMethod: r.pay_method,
        payStatus: r.pay_status, status: r.status, note: r.note,
      })));
    });
    supabase.from("cases").select("*").limit(5000).then(({ data }) => {
      if (!data) return;
      setCases(data.map((r: any) => ({
        id: r.id, caseNo: r.case_no, date: r.date, agentId: r.agent_id, type: r.type, customer: r.customer,
        status: r.status, points: r.points, shotReward: r.shot_reward, staff: r.staff, note: r.note,
      })));
    });
    supabase.from("leads").select("*").limit(5000).then(({ data }) => {
      if (!data) return;
      setLeads(data.map((r: any) => ({
        id: r.id, leadNo: r.lead_no, agentId: r.agent_id, name: r.name, phone: r.phone, lineName: r.line_name,
        email: r.email, pref: r.pref, message: r.message, status: r.status, date: r.date, convertedUserId: r.converted_member_id,
      })));
    });
    supabase.from("reward_payouts").select("*").limit(5000).then(({ data }) => {
      if (!data) return;
      const p: Record<string, { amount: number; date: string }> = {};
      for (const r of data as any[]) {
        const key = r.kind === "ショット報酬" ? shotKey(r.ref_id)
          : r.kind === "本人報酬" ? honninKey(r.agent_id, r.month)
          : rubyKey(r.agent_id, r.month);
        p[key] = { amount: r.amount, date: r.paid_date };
      }
      setPaid(p);
    });
    supabase.from("audit_log").select("*").order("at", { ascending: false }).limit(500).then(({ data }) => {
      if (!data) return;
      setLogs(data.map((r: any) => ({ id: String(r.id), time: r.at, actor: r.actor_name ?? "", role: r.role ?? "運営管理者", action: r.action, detail: r.detail ?? "" })));
    });
  }, []);

  // 操作ログ（ローカル追記＋Supabaseへ永続化）
  const addLog = (action: string, detail: string, actor = OPERATOR, role: Role = "運営管理者") => {
    setLogs((prev) => [{ id: `log-${prev.length + 1}`, time: new Date().toISOString(), actor, role, action, detail }, ...prev]);
    push(supabase.from("audit_log").insert({ actor_name: actor, role, action, detail }));
  };

  const value: Store = {
    agents, cases, users, leads, logs, viewAgentId, setViewAgentId, stats, rewards, paid,
    syncEnabled: sheetSyncEnabled(),

    pushActiveUsers: () => {
      addLog("スプレッドシート反映", `代理店マスタ ${agents.length}件を反映`);
      return pushRows(
        TAB_AGENTS,
        agents.map((a) => agentToRow({
          no: a.no, name: a.name, phone: a.phone, kind: a.kind,
          referrerNo: referrerNoOf(a.referrerId), joinDate: a.joinDate,
          rankLabel: rankLabelOf(a).label, activeUsers: a.activeUsers, bank: a.bank,
        })),
        "upsert", "代理店ID"
      );
    },

    addCase: (c) => {
      const n = cases.length + 1;
      const rec: Case = { ...c, id: `new-${n}-${c.agentId}`, caseNo: "C-" + String(n).padStart(4, "0") };
      setCases((prev) => [rec, ...prev]);
      push(supabase.from("cases").insert(caseDb(rec)));
      addLog("案件登録", `${rec.caseNo} ${rec.customer}（${rec.type}・${agentNoOf(c.agentId)}）`);
      void pushRows(TAB_CASES, [caseToRow({
        caseNo: rec.caseNo, agentNo: agentNoOf(c.agentId), customer: rec.customer, type: rec.type,
        status: rec.status, date: rec.date, staff: rec.staff, points: casePoints(rec), shotReward: rec.shotReward,
      })], "append");
    },

    setCaseStatus: (id, status) => {
      setCases((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
      push(supabase.from("cases").update({ status }).eq("id", id));
      const c = cases.find((x) => x.id === id);
      addLog("案件ステータス変更", `${c?.caseNo || id} → ${status}`);
    },

    setShotReward: (id, amount) => {
      setCases((prev) => prev.map((c) => (c.id === id ? { ...c, shotReward: amount } : c)));
      push(supabase.from("cases").update({ shot_reward: amount }).eq("id", id));
      const c = cases.find((x) => x.id === id);
      addLog("ショット報酬変更", `${c?.caseNo || id} → ${amount.toLocaleString()}円`);
    },

    setCasePoints: (id, points) => {
      const v = Math.max(0, Math.floor(points));
      setCases((prev) => prev.map((c) => (c.id === id ? { ...c, points: v } : c)));
      push(supabase.from("cases").update({ points: v }).eq("id", id));
      const c = cases.find((x) => x.id === id);
      addLog("付与ポイント変更", `${c?.caseNo || id} → ${v.toLocaleString()}pt`);
    },

    addUser: (u) => {
      const n = users.length + 1;
      const rec: User = { ...u, id: `u-new-${n}`, memberNo: "U-" + String(n).padStart(4, "0"), monthlyFee: u.monthlyFee || MONTHLY_FEE, status: "有効" };
      setUsers((prev) => [rec, ...prev]);
      push(supabase.from("members").insert(userDb(rec)));
      addLog("会員登録", `${rec.memberNo} ${rec.name}（${agentNoOf(rec.agentId)}）`);
      void pushRows(TAB_USERS, [userToRow({ ...rec, agentNo: agentNoOf(rec.agentId) })], "upsert", "ユーザーID");
    },

    cancelUser: (id, cancelDate) => {
      let rec: User | undefined;
      setUsers((prev) => prev.map((u) => (u.id === id ? (rec = { ...u, status: "解約", cancelDate, payStatus: "停止" }) : u)));
      push(supabase.from("members").update({ status: "解約", cancel_date: cancelDate, pay_status: "停止" }).eq("id", id));
      const u = users.find((x) => x.id === id);
      addLog("会員解約", `${u?.memberNo || id} ${u?.name || ""}（${u ? agentNoOf(u.agentId) : ""}）`);
      if (rec) void pushRows(TAB_USERS, [userToRow({ ...rec, agentNo: agentNoOf(rec.agentId) })], "upsert", "ユーザーID");
    },

    reactivateUser: (id) => {
      let rec: User | undefined;
      setUsers((prev) => prev.map((u) => (u.id === id ? (rec = { ...u, status: "有効", cancelDate: undefined, payStatus: "入金済" }) : u)));
      push(supabase.from("members").update({ status: "有効", cancel_date: null, pay_status: "入金済" }).eq("id", id));
      const u = users.find((x) => x.id === id);
      addLog("会員 再有効化", `${u?.memberNo || id} ${u?.name || ""}`);
      if (rec) void pushRows(TAB_USERS, [userToRow({ ...rec, agentNo: agentNoOf(rec.agentId) })], "upsert", "ユーザーID");
    },

    addLead: (l) => {
      const n = leads.length + 1;
      const rec: Lead = { ...l, id: `lead-new-${n}`, leadNo: "L-" + String(n).padStart(4, "0"), status: "申込", date: today() };
      setLeads((prev) => [rec, ...prev]);
      push(supabase.from("leads").insert(leadDb(rec)));
      addLog("申込受付", `${rec.leadNo} ${rec.name}（紹介元 ${agentNoOf(rec.agentId)}）`, rec.name, "申込フォーム");
    },

    setLeadStatus: (id, status) => {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      push(supabase.from("leads").update({ status }).eq("id", id));
      const l = leads.find((x) => x.id === id);
      addLog("申込ステータス変更", `${l?.leadNo || id} → ${status}`);
    },

    convertLead: (id, opts) => {
      const lead = leads.find((l) => l.id === id);
      if (!lead) return;
      const n = users.length + 1;
      const urec: User = {
        id: `u-new-${n}`, memberNo: "U-" + String(n).padStart(4, "0"),
        agentId: lead.agentId, name: lead.name, phone: lead.phone, lineName: lead.lineName,
        email: lead.email, pref: lead.pref, joinDate: today(), startDate: today(),
        monthlyFee: MONTHLY_FEE, payMethod: opts?.payMethod || "クレジットカード", payStatus: "入金済", status: "有効",
      };
      setUsers((prev) => [urec, ...prev]);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: "登録完了", convertedUserId: urec.id } : l)));
      push(supabase.from("members").insert(userDb(urec)));
      push(supabase.from("leads").update({ status: "登録完了", converted_member_id: urec.id }).eq("id", id));
      addLog("会員化（申込→登録完了）", `${lead.leadNo} ${lead.name} → ${urec.memberNo}（${agentNoOf(lead.agentId)}へ紐付け）`);
      void pushRows(TAB_USERS, [userToRow({ ...urec, agentNo: agentNoOf(lead.agentId) })], "upsert", "ユーザーID");
    },

    setRank: (id, rank) => {
      setBaseAgents((prev) => prev.map((a) => (a.id === id ? { ...a, rank } : a)));
      push(supabase.from("agents").update({ rank }).eq("id", id));
      addLog("ランク変更", `${agentNoOf(id)} → ${rank}`);
    },

    addAgent: (a) => {
      const n = baseAgents.length + 1;
      const isRuby = a.kind === "ruby";
      const sameKind = baseAgents.filter((x) => (x.kind === "ruby") === isRuby).length + 1;
      const no = (isRuby ? "RUBY-" : "XL-") + String(sameKind).padStart(3, "0");
      const code = isRuby ? no : "XL-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      const rec: Agent = { ...a, id: `ag-${n}`, no, basePt: 0, code };
      setBaseAgents((prev) => [...prev, rec]);
      push(supabase.from("agents").insert(agentDb(rec)));
      addLog("代理店登録", `${rec.no} ${rec.name}（${isRuby ? "ルビー" : "個人"}）`);
      void pushRows(TAB_AGENTS, [agentToRow({
        no: rec.no, name: rec.name, phone: rec.phone, kind: rec.kind,
        referrerNo: referrerNoOf(rec.referrerId), joinDate: rec.joinDate,
        rankLabel: rankLabelOf(rec).label, activeUsers: 0, bank: rec.bank,
      })], "upsert", "代理店ID");
    },

    payReward: ({ key, agentId, amount, date }) => {
      if (amount <= 0) return;
      setPaid((prev) => ({ ...prev, [key]: { amount, date } }));
      const kind = key.startsWith("shot::") ? "ショット報酬" : key.startsWith("ruby::") ? "ルビー紹介報酬" : "本人報酬";
      const parts = key.split("::");
      const ref_id = kind === "ショット報酬" ? parts[1] : null;
      const month = kind === "ショット報酬" ? null : (parts[2] || CURRENT_MONTH);
      push(supabase.from("reward_payouts").insert({ agent_id: agentId, kind, amount, month, ref_id, paid_date: date }));
      addLog("報酬振込", `${agentNoOf(agentId)} へ ${amount.toLocaleString()}円（${date}）`);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used within StoreProvider");
  return c;
}
