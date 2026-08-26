"use client";

// アプリ全体の状態（ダミーDB）。本部の操作が代理店画面に即反映される。
// 本番はここをスプレッドシート双方向同期／DB＋認証・権限（RLS）に置き換える。

import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { Agent, Case, CaseStatus, IndivRank, User, Lead, LeadStatus, AuditLog, Role } from "./types";
import { AGENTS, CASES, USERS, LEADS, INITIAL_LOGS, INITIAL_PAID } from "./mock";
import { buildStats, rewardItems } from "./calc";
import { casePoints, rankLabelOf, MONTHLY_FEE } from "./config";
import { supabase, supabaseReady } from "./supabase";
import {
  pushRows, caseToRow, agentToRow, userToRow, sheetSyncEnabled,
  TAB_CASES, TAB_AGENTS, TAB_USERS, SyncResult,
} from "./sheetSync";

const OPERATOR = "運営管理者";
const today = () => new Date().toISOString().slice(0, 10);

interface Store {
  agents: Agent[];
  cases: Case[];
  users: User[];
  leads: Lead[];
  logs: AuditLog[];
  viewAgentId: string;
  setViewAgentId: (id: string) => void;

  // 案件
  addCase: (c: Omit<Case, "id" | "caseNo">) => void;
  setCaseStatus: (id: string, status: CaseStatus) => void;
  setShotReward: (id: string, amount: number) => void;
  setCasePoints: (id: string, points: number) => void;

  // 会員（アクティブユーザー）
  addUser: (u: Omit<User, "id" | "memberNo" | "status">) => void;
  cancelUser: (id: string, cancelDate: string) => void;
  reactivateUser: (id: string) => void;

  // 見込み客（申込）
  addLead: (l: Omit<Lead, "id" | "leadNo" | "status" | "date">) => void; // 公開フォームから
  setLeadStatus: (id: string, status: LeadStatus) => void;
  convertLead: (id: string, opts?: { payMethod?: string }) => void; // 会員化（登録・決済完了）

  // ランク・代理店
  setRank: (id: string, rank: IndivRank) => void;
  addAgent: (a: Omit<Agent, "id" | "no" | "basePt" | "code">) => void;

  // 報酬支払
  paid: Record<string, { amount: number; date: string }>;
  payReward: (p: { key: string; agentId: string; amount: number; date: string }) => void;

  // スプレッドシート反映
  syncEnabled: boolean;
  pushActiveUsers: () => Promise<SyncResult>;

  stats: ReturnType<typeof buildStats>;
  rewards: ReturnType<typeof rewardItems>;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // 未接続（デモ）＝mock、Supabase接続時＝DBから読込（下の useEffect）
  const [baseAgents, setBaseAgents] = useState<Agent[]>(supabaseReady ? [] : AGENTS);
  const [cases, setCases] = useState<Case[]>(supabaseReady ? [] : CASES);
  const [users, setUsers] = useState<User[]>(supabaseReady ? [] : USERS);
  const [leads, setLeads] = useState<Lead[]>(supabaseReady ? [] : LEADS);
  const [logs, setLogs] = useState<AuditLog[]>(supabaseReady ? [] : INITIAL_LOGS);
  const [paid, setPaid] = useState<Record<string, { amount: number; date: string }>>(supabaseReady ? {} : INITIAL_PAID);
  const [viewAgentId, setViewAgentId] = useState<string>(supabaseReady ? "" : "003");

  // ── Supabase 接続時：初回にDBから読み込む（Phase 2：書込みのDB反映を追加予定） ──
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
    supabase.from("audit_log").select("*").order("at", { ascending: false }).limit(500).then(({ data }) => {
      if (!data) return;
      setLogs(data.map((r: any) => ({ id: String(r.id), time: r.at, actor: r.actor_name ?? "", role: r.role ?? "運営管理者", action: r.action, detail: r.detail ?? "" })));
    });
  }, []);

  // アクティブユーザー数 = 「有効」会員数（会員登録・解約から自動算出）
  const agents = useMemo(
    () => baseAgents.map((a) => ({ ...a, activeUsers: users.filter((u) => u.agentId === a.id && u.status === "有効").length })),
    [baseAgents, users]
  );

  const stats = useMemo(() => buildStats(agents, cases, paid), [agents, cases, paid]);
  const rewards = useMemo(() => rewardItems(agents, cases), [agents, cases]);

  const agentNoOf = (id: string) => agents.find((a) => a.id === id)?.no || id;
  const referrerNoOf = (id: string | null) => (id ? agents.find((a) => a.id === id)?.no : undefined);

  const addLog = (action: string, detail: string, actor = OPERATOR, role: Role = "運営管理者") =>
    setLogs((prev) => [{ id: `log-${prev.length + 1}`, time: new Date().toISOString(), actor, role, action, detail }, ...prev]);

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
      addLog("案件登録", `${rec.caseNo} ${rec.customer}（${rec.type}・${agentNoOf(c.agentId)}）`);
      void pushRows(TAB_CASES, [caseToRow({
        caseNo: rec.caseNo, agentNo: agentNoOf(c.agentId), customer: rec.customer, type: rec.type,
        status: rec.status, date: rec.date, staff: rec.staff, points: casePoints(rec), shotReward: rec.shotReward,
      })], "append");
    },

    setCaseStatus: (id, status) => {
      setCases((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
      const c = cases.find((x) => x.id === id);
      addLog("案件ステータス変更", `${c?.caseNo || id} → ${status}`);
    },

    setShotReward: (id, amount) => {
      setCases((prev) => prev.map((c) => (c.id === id ? { ...c, shotReward: amount } : c)));
      const c = cases.find((x) => x.id === id);
      addLog("ショット報酬変更", `${c?.caseNo || id} → ${amount.toLocaleString()}円`);
    },

    setCasePoints: (id, points) => {
      const v = Math.max(0, Math.floor(points));
      setCases((prev) => prev.map((c) => (c.id === id ? { ...c, points: v } : c)));
      const c = cases.find((x) => x.id === id);
      addLog("付与ポイント変更", `${c?.caseNo || id} → ${v.toLocaleString()}pt`);
    },

    addUser: (u) => {
      const n = users.length + 1;
      const rec: User = { ...u, id: `u-new-${n}`, memberNo: "U-" + String(n).padStart(4, "0"), monthlyFee: u.monthlyFee || MONTHLY_FEE, status: "有効" };
      setUsers((prev) => [rec, ...prev]);
      addLog("会員登録", `${rec.memberNo} ${rec.name}（${agentNoOf(rec.agentId)}）`);
      void pushRows(TAB_USERS, [userToRow({ ...rec, agentNo: agentNoOf(rec.agentId) })], "upsert", "ユーザーID");
    },

    cancelUser: (id, cancelDate) => {
      let rec: User | undefined;
      setUsers((prev) => prev.map((u) => (u.id === id ? (rec = { ...u, status: "解約", cancelDate, payStatus: "停止" }) : u)));
      const u = users.find((x) => x.id === id);
      addLog("会員解約", `${u?.memberNo || id} ${u?.name || ""}（${u ? agentNoOf(u.agentId) : ""}）`);
      if (rec) void pushRows(TAB_USERS, [userToRow({ ...rec, agentNo: agentNoOf(rec.agentId) })], "upsert", "ユーザーID");
    },

    reactivateUser: (id) => {
      let rec: User | undefined;
      setUsers((prev) => prev.map((u) => (u.id === id ? (rec = { ...u, status: "有効", cancelDate: undefined, payStatus: "入金済" }) : u)));
      const u = users.find((x) => x.id === id);
      addLog("会員 再有効化", `${u?.memberNo || id} ${u?.name || ""}`);
      if (rec) void pushRows(TAB_USERS, [userToRow({ ...rec, agentNo: agentNoOf(rec.agentId) })], "upsert", "ユーザーID");
    },

    // 公開フォームからの申込（見込み客）
    addLead: (l) => {
      const n = leads.length + 1;
      const rec: Lead = { ...l, id: `lead-new-${n}`, leadNo: "L-" + String(n).padStart(4, "0"), status: "申込", date: today() };
      setLeads((prev) => [rec, ...prev]);
      addLog("申込受付", `${rec.leadNo} ${rec.name}（紹介元 ${agentNoOf(rec.agentId)}）`, rec.name, "申込フォーム");
    },

    setLeadStatus: (id, status) => {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      const l = leads.find((x) => x.id === id);
      addLog("申込ステータス変更", `${l?.leadNo || id} → ${status}`);
    },

    // 会員化（登録・決済完了 → アクティブ会員として紹介元代理店へ紐付け）
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
      addLog("会員化（申込→登録完了）", `${lead.leadNo} ${lead.name} → ${urec.memberNo}（${agentNoOf(lead.agentId)}へ紐付け）`);
      void pushRows(TAB_USERS, [userToRow({ ...urec, agentNo: agentNoOf(lead.agentId) })], "upsert", "ユーザーID");
    },

    setRank: (id, rank) => {
      setBaseAgents((prev) => prev.map((a) => (a.id === id ? { ...a, rank } : a)));
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
