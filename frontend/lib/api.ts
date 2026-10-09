const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export interface DashboardStats {
  total_transactions: number;
  total_volume: number;
  total_accounts: number;
  critical_accounts: number;
  high_risk_accounts: number;
  medium_risk_accounts: number;
  low_risk_accounts: number;
  flagged_accounts: number;
  gst_merchants: number;
  transaction_networks: number;
  immediate_transactions: number;
  alpha_weight: number;
}

export interface NetworkCase {
  network_id: string;
  case_id: string;
  reported_date: string;
  amount: number;
  people_involved: number;
  member_accounts: string[];
  transaction_count: number;
  immediate_transaction_count: number;
  immediate_transaction_ratio: number;
  risk_score: number;
  status: "Critical" | "High" | "Medium" | "Low";
  classification: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  role: string;
  ordered_accounts?: string[];
  transaction_ids?: string[];
}

export interface DashboardSnapshot {
  stats: DashboardStats;
  activity: ActivityTrendPoint[];
  top_accounts: AccountSummary[];
  network_cases: NetworkCase[];
}

export interface AiAnalysisSummary {
  summary: string;
  key_findings: string[];
  high_priority_networks: Array<{
    case_id: string;
    network_id: string;
    risk_score: number;
    reason: string;
  }>;
  limitations: string[];
}

export interface AccountSummary {
  account_id: string;
  network_id?: string;
  final_score: number;
  rule_score: number;
  ml_score: number;
  mule_probability: number;
  classification: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  classification_source?: "risk_score" | "manual";
  original_classification?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  is_flagged: boolean;
  is_mule: boolean;
  account_type: string;
  is_gst_registered: boolean;
  incoming_amount: number;
  outgoing_amount: number;
  forwarding_ratio: number;
  median_holding_time_hours: number;
  unique_senders: number;
  unique_receivers: number;
  cycle_count: number;
  layering_depth: number;
  top_reasons: string[];
}

export interface RuleFactor {
  key: string;
  name: string;
  dimension: string;
  points: number;
  severity: string;
  raw_value: number;
  detail: string;
}

export interface AccountDetail extends AccountSummary {
  dimension_scores: Record<string, number>;
  rule_factors: RuleFactor[];
  top_ml_features: Array<{
    feature: string;
    value: number;
    model_importance: number;
    impact: number;
  }>;
  recent_transactions: Array<{
    transaction_id: string;
    timestamp: string;
    sender_id: string;
    receiver_id: string;
    amount: number;
    channel: string;
    direction: "INCOMING" | "OUTGOING";
    counterparty: string;
  }>;
  next_hops: Array<{
    candidate_account: string;
    next_hop_score: number;
    receiver_risk_score: number;
    receiver_classification: string;
    transfer_count: number;
    last_transfer_amount: number;
    reasons: string[];
  }>;
}

export interface GraphNode {
  id: string;
  label: string;
  risk_score: number;
  rule_score?: number;
  ml_score?: number;
  classification: string;
  is_mule: boolean;
  account_type: string;
  is_gst_registered: boolean;
  in_degree: number;
  out_degree: number;
  is_focus?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  amount: number;
  count: number;
  is_risky: boolean;
}

export interface NetworkGraphData {
  focus_node?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes?: number;
  total_edges?: number;
}

export interface TrailHop {
  hop: number;
  transaction_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  timestamp: string;
  holding_time_seconds: number;
  channel: string;
  receiver_risk_score: number;
  receiver_classification: string;
  receiver_is_mule: boolean;
  action: string;
  type?: "Incoming" | "Outgoing";
  note?: string;
}

export interface MoneyTrailData {
  origin_transaction_id: string;
  total_hops: number;
  origin_amount: number;
  trail: TrailHop[];
  ordered_accounts?: string[];
  network_id?: string;
  case_id?: string;
  network_status?: "Critical" | "High" | "Medium" | "Low";
  network_role?: string;
  transaction_ids?: string[];
  account_risk?: Record<string, {
    risk_score: number;
    classification: string;
    is_mule: boolean;
  }>;
}

export async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE_URL}/stats`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch dashboard stats");
  return res.json();
}

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot | null> {
  const res = await fetch(`${API_BASE_URL}/dashboard`, { cache: "no-store" });
  // A fresh backend has no analyzed dataset yet. That is an expected
  // upload-first state, not a dashboard failure.
  if (res.status === 409) return null;
  if (!res.ok) throw new Error("Failed to fetch dashboard data");
  return res.json();
}

export async function fetchAiAnalysisSummary(): Promise<AiAnalysisSummary> {
  const res = await fetch(`${API_BASE_URL}/analysis/summary`, {
    method: "POST",
    cache: "no-store",
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.detail || "Failed to generate AI analysis summary");
  }
  return payload.summary;
}

export async function fetchAccounts(params: {
  skip?: number;
  limit?: number;
  search?: string;
  risk_filter?: string;
  sort_by?: string;
  sort_order?: string;
} = {}): Promise<{ total: number; accounts: AccountSummary[] }> {
  const query = new URLSearchParams();
  if (params.skip !== undefined) query.set("skip", params.skip.toString());
  if (params.limit !== undefined) query.set("limit", params.limit.toString());
  if (params.search) query.set("search", params.search);
  if (params.risk_filter) query.set("risk_filter", params.risk_filter);
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_order) query.set("sort_order", params.sort_order);

  const res = await fetch(`${API_BASE_URL}/accounts?${query.toString()}`, { cache: "no-store" });
  // The backend starts empty by design. Treat the pre-upload 409 as an
  // empty registry so account-related pages can render their upload guidance.
  if (res.status === 409) return { total: 0, accounts: [] };
  if (!res.ok) throw new Error("Failed to fetch accounts");
  return res.json();
}

export async function fetchAccountRisk(
  accountId: string,
  signal?: AbortSignal,
): Promise<AccountDetail> {
  const res = await fetch(`${API_BASE_URL}/accounts/${encodeURIComponent(accountId)}/risk`, {
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new Error(`Failed to fetch risk for account ${accountId}`);
  return res.json();
}

export async function overrideAccountClassification(
  accountId: string,
  classification: AccountSummary["classification"],
  reason: string = "Manual investigator override",
): Promise<AccountSummary> {
  const res = await fetch(`${API_BASE_URL}/accounts/${encodeURIComponent(accountId)}/classification`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ classification, reason }),
  });
  if (!res.ok) throw new Error("Failed to update account classification");
  const payload = await res.json();
  return payload.account;
}

export async function resetAccountClassification(accountId: string): Promise<AccountSummary> {
  const res = await fetch(`${API_BASE_URL}/accounts/${encodeURIComponent(accountId)}/classification`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ classification: "RESET" }),
  });
  if (!res.ok) throw new Error("Failed to reset account classification");
  const payload = await res.json();
  return payload.account;
}

export async function fetchAccountNetwork(accountId: string, depth: number = 1): Promise<NetworkGraphData> {
  const res = await fetch(`${API_BASE_URL}/accounts/${encodeURIComponent(accountId)}/network?depth=${depth}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch network for account ${accountId}`);
  return res.json();
}

export async function fetchFullGraph(maxNodes: number = 150): Promise<NetworkGraphData> {
  const res = await fetch(`${API_BASE_URL}/graph/full?max_nodes=${maxNodes}`, { cache: "no-store" });
  // No graph exists until a CSV has completed backend analysis.
  if (res.status === 409) return { nodes: [], edges: [], total_nodes: 0, total_edges: 0 };
  if (!res.ok) throw new Error("Failed to fetch full network graph");
  return res.json();
}

export interface ActivityTrendPoint {
  date: string;
  total: number;
  normal: number;
  suspicious: number;
  volume: number;
}

export async function fetchActivityTrend(): Promise<ActivityTrendPoint[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/activity-trend`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    console.error("Error fetching activity trend:", err);
    return [];
  }
}

export async function fetchMoneyTrail(transactionId: string): Promise<MoneyTrailData> {
  const url = `${API_BASE_URL}/transactions/${encodeURIComponent(transactionId)}/trail`;
  const res = await fetch(url, { cache: "no-store" });
  if (res.ok) return res.json();

  const caseUrl = `${API_BASE_URL}/cases/${encodeURIComponent(transactionId)}/trail`;
  const caseRes = await fetch(caseUrl, { cache: "no-store" });
  if (!caseRes.ok) throw new Error(`Transaction or case ${transactionId} was not found`);
  return caseRes.json();
}

export async function fetchAccountTrail(accountId: string): Promise<MoneyTrailData> {
  const res = await fetch(`${API_BASE_URL}/accounts/${encodeURIComponent(accountId)}/trail`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to trace money trail for account ${accountId}`);
  return res.json();
}

export interface UploadResponse {
  status: "success";
  message: string;
  stats: DashboardStats;
  network_cases: NetworkCase[];
}

export async function uploadTransactionsCsv(file: File, accountsFile?: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("transactions_file", file);
  if (accountsFile) {
    formData.append("accounts_file", accountsFile);
  }

  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function loadDemoDataset(): Promise<UploadResponse> {
  const res = await fetch(`${API_BASE_URL}/demo/load`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to load demo dataset");
  return res.json();
}

export async function setAlphaWeight(alpha: number): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/config/alpha`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alpha }),
  });
  if (!res.ok) throw new Error("Failed to update alpha weight");
  return res.json();
}
