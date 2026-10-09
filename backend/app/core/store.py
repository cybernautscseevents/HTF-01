import pandas as pd
import numpy as np
import threading
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from app.graph.graph_engine import GraphEngine
from app.graph.trail_tracer import TrailTracer
from app.ml.feature_extractor import extract_account_features, FEATURE_COLUMNS
from app.ml.model_service import ModelService
from app.rules.rule_engine import RuleEngine
from app.data.csv_parser import synthesize_accounts_from_transactions
from app.core.config import DEFAULT_ALPHA, CRITICAL_THRESHOLD, HIGH_THRESHOLD, MEDIUM_THRESHOLD


class DataStore:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(DataStore, cls).__new__(cls)
                cls._instance._init_store()
            return cls._instance

    def _init_store(self):
        self.lock = threading.RLock()
        self.transactions_df = pd.DataFrame()
        self.accounts_df = pd.DataFrame()
        self.features_df = pd.DataFrame()
        
        self.graph_engine = GraphEngine()
        self.model_service = ModelService()
        self.rule_engine = RuleEngine()
        self.trail_tracer = TrailTracer(self.graph_engine)

        self.alpha: float = DEFAULT_ALPHA
        self.scores_cache: Dict[str, Dict[str, Any]] = {}
        self.stats: Dict[str, Any] = {}
        self.network_cases: List[Dict[str, Any]] = []
        self.transaction_case_index: Dict[str, Dict[str, str]] = {}
        self.node_case_index: Dict[str, Dict[str, str]] = {}
        self.manual_classifications: Dict[str, str] = {}
        self.is_loaded: bool = False

    def process_and_load(
        self,
        txn_df: pd.DataFrame,
        accounts_df: Optional[pd.DataFrame] = None
    ):
        """
        Full orchestration pipeline:
        1. Ingest transactions & accounts
        2. Graph construction & topology features
        3. 28-dimensional ML feature extraction
        4. XGBoost inference (mule_probability, ml_score)
        5. Deterministic rule evaluation (with GST mitigation)
        6. Hybrid score fusion & classification
        7. Pre-compute investigator summaries
        """
        with self.lock:
            self.transactions_df = txn_df.copy()
            self.manual_classifications = {}

            if accounts_df is None or accounts_df.empty:
                self.accounts_df = synthesize_accounts_from_transactions(txn_df)
            else:
                self.accounts_df = accounts_df.copy()

            # 1. Graph Construction
            self.graph_engine.build_graph(self.transactions_df)

            # 2. Extract Exact 28 Features
            self.features_df = extract_account_features(
                self.transactions_df,
                self.accounts_df,
                self.graph_engine
            )

            # 3. XGBoost Model Predictions
            ml_results_df = self.model_service.predict(self.features_df)
            ml_dict = {}
            for _, row in ml_results_df.iterrows():
                ml_dict[str(row["account_id"])] = {
                    "mule_probability": float(row["mule_probability"]),
                    "ml_score": float(row["ml_score"]),
                    "ml_prediction": int(row["prediction"])
                }

            # 4. Deterministic Rule Engine Evaluation
            rule_results_dict = self.rule_engine.evaluate_all_accounts(
                self.features_df,
                self.accounts_df,
                self.graph_engine
            )

            # 5. Hybrid Score Fusion & Cache Assembly
            self.scores_cache = {}
            features_row_map = {str(r["account_id"]): r.to_dict() for _, r in self.features_df.iterrows()}

            for acc_id, rule_res in rule_results_dict.items():
                ml_res = ml_dict.get(acc_id, {"mule_probability": 0.0, "ml_score": 0.0, "ml_prediction": 0})
                
                rule_score = float(rule_res["rule_score"])
                ml_score = float(ml_res["ml_score"])
                mule_prob = float(ml_res["mule_probability"])

                # Hybrid Fusion
                final_score = (self.alpha * rule_score) + ((1.0 - self.alpha) * ml_score)
                final_score = round(min(max(final_score, 0.0), 100.0), 1)

                # Classification
                if final_score >= CRITICAL_THRESHOLD:
                    classification = "CRITICAL"
                    is_flagged = True
                elif final_score >= HIGH_THRESHOLD:
                    classification = "HIGH"
                    is_flagged = True
                elif final_score >= MEDIUM_THRESHOLD:
                    classification = "MEDIUM"
                    is_flagged = False
                else:
                    classification = "LOW"
                    is_flagged = False

                # Top ML Features
                f_row = features_row_map.get(acc_id, {})
                top_ml_feats = self.model_service.get_account_top_features(f_row, top_k=5)

                self.scores_cache[acc_id] = {
                    "account_id": acc_id,
                    "final_score": final_score,
                    "rule_score": rule_score,
                    "ml_score": ml_score,
                    "mule_probability": round(mule_prob, 4),
                    "classification": classification,
                    "classification_source": "risk_score",
                    "is_flagged": is_flagged,
                    "is_mule": (classification in ["CRITICAL", "HIGH"]),
                    "alpha_applied": self.alpha,
                    
                    # Context metadata
                    "account_type": rule_res.get("account_type", "individual"),
                    "is_gst_registered": rule_res.get("is_gst_registered", False),
                    
                    # Evidence & Explanations
                    "dimension_scores": rule_res["dimension_scores"],
                    "rule_factors": rule_res["factors"],
                    "top_reasons": rule_res["top_reasons"],
                    "top_ml_features": top_ml_feats,
                    
                    # Fast Transaction Summary
                    "incoming_count": int(f_row.get("incoming_count", 0)),
                    "outgoing_count": int(f_row.get("outgoing_count", 0)),
                    "incoming_amount": float(f_row.get("incoming_amount", 0.0)),
                    "outgoing_amount": float(f_row.get("outgoing_amount", 0.0)),
                    "forwarding_ratio": round(float(f_row.get("forwarding_ratio", 0.0)), 3),
                    "median_holding_time_hours": round(float(f_row.get("median_holding_time", 168.0)), 2),
                    "unique_senders": int(f_row.get("unique_senders", 0)),
                    "unique_receivers": int(f_row.get("unique_receivers", 0)),
                    "cycle_count": int(f_row.get("cycle_count", 0)),
                    "layering_depth": int(f_row.get("layering_depth", 0)),
                }

            # 6. Detect connected transaction networks and score timing risk.
            self.network_cases = self._build_network_cases()
            # A critically risky network must surface at least its highest-risk
            # member as a mule for the dashboard and investigation workflow.
            for case in self.network_cases:
                if case["risk_score"] >= CRITICAL_THRESHOLD and case["member_accounts"]:
                    mule_id = max(
                        case["member_accounts"],
                        key=lambda account_id: self.scores_cache.get(account_id, {}).get("final_score", 0.0),
                    )
                    mule = self.scores_cache.get(mule_id)
                    if mule and mule["final_score"] < CRITICAL_THRESHOLD:
                        mule["final_score"] = float(CRITICAL_THRESHOLD)
                        mule["classification"] = "CRITICAL"
                        mule["is_flagged"] = True
                        mule["is_mule"] = True

            self._refresh_manual_classifications()

            # 7. Global Stats Calculation
            total_accounts = len(self.scores_cache)
            crit_count = sum(1 for a in self.scores_cache.values() if a["classification"] == "CRITICAL")
            high_count = sum(1 for a in self.scores_cache.values() if a["classification"] == "HIGH")
            med_count = sum(1 for a in self.scores_cache.values() if a["classification"] == "MEDIUM")
            low_count = sum(1 for a in self.scores_cache.values() if a["classification"] == "LOW")
            merchant_count = sum(1 for a in self.scores_cache.values() if a["is_gst_registered"])

            self.stats = {
                "total_transactions": len(self.transactions_df),
                "total_volume": float(self.transactions_df["amount"].sum()),
                "total_accounts": total_accounts,
                "critical_accounts": crit_count,
                "high_risk_accounts": high_count,
                "medium_risk_accounts": med_count,
                "low_risk_accounts": low_count,
                "flagged_accounts": crit_count + high_count,
                "gst_merchants": merchant_count,
                "transaction_networks": len(self.network_cases),
                "immediate_transactions": int(
                    (self.transactions_df["transfer_latency_seconds"] <= 60).sum()
                    if "transfer_latency_seconds" in self.transactions_df.columns
                    else 0
                ),
                "alpha_weight": self.alpha
            }

            self.is_loaded = True

    def _build_network_cases(self) -> List[Dict[str, Any]]:
        """Create stable network IDs and case summaries from successful transfers."""
        if self.transactions_df.empty or self.graph_engine.simple_graph.number_of_nodes() == 0:
            return []

        components = list(
            __import__("networkx").weakly_connected_components(self.graph_engine.simple_graph)
        )
        account_to_network: Dict[str, str] = {}
        cases: List[Dict[str, Any]] = []

        for index, members in enumerate(
            sorted(components, key=lambda component: (-len(component), sorted(component)[0]))
        ):
            network_id = f"NET-{datetime.now().strftime('%Y%m%d')}-{index + 1:03d}"
            member_ids = sorted(str(member) for member in members)
            for account_id in member_ids:
                account_to_network[account_id] = network_id

            network_txns = self.transactions_df[
                self.transactions_df["sender_id"].isin(member_ids)
                & self.transactions_df["receiver_id"].isin(member_ids)
                & (
                    self.transactions_df["is_successful"]
                    if "is_successful" in self.transactions_df.columns
                    else True
                )
            ]
            if network_txns.empty:
                continue

            immediate_count = int(
                (network_txns["transfer_latency_seconds"] <= 60).sum()
                if "transfer_latency_seconds" in network_txns.columns
                else 0
            )
            immediate_ratio = immediate_count / max(len(network_txns), 1)
            account_scores = [
                float(self.scores_cache.get(account_id, {}).get("final_score", 0.0))
                for account_id in member_ids
            ]
            account_risk = max(account_scores, default=0.0)
            timing_risk = min(100.0, immediate_ratio * 100.0)
            network_score = round(min(100.0, (account_risk * 0.7) + (timing_risk * 0.3)), 1)

            if network_score >= CRITICAL_THRESHOLD:
                status = "Critical"
            elif network_score >= HIGH_THRESHOLD:
                status = "High"
            elif network_score >= MEDIUM_THRESHOLD:
                status = "Medium"
            else:
                status = "Low"

            cases.append({
                "network_id": network_id,
                "case_id": f"CAS-{datetime.now().strftime('%Y')}-{index + 1:03d}",
                "reported_date": network_txns["timestamp"].max().strftime("%d %b %Y"),
                "amount": round(float(network_txns["amount"].sum()), 2),
                "people_involved": len(member_ids),
                "member_accounts": member_ids,
                "transaction_count": len(network_txns),
                "immediate_transaction_count": immediate_count,
                "immediate_transaction_ratio": round(immediate_ratio, 4),
                "risk_score": network_score,
                "status": status,
                "classification": status.upper(),
                "role": self._network_role(member_ids),
                "ordered_accounts": self._ordered_network_accounts(network_txns, member_ids),
                "transaction_ids": [
                    str(txn_id)
                    for txn_id in network_txns.sort_values("timestamp")["transaction_id"].tolist()
                ],
            })

        cases.sort(key=lambda case: case["risk_score"], reverse=True)
        self.transaction_case_index = {}
        self.node_case_index = {}
        for case in cases:
            for account_id in case["member_accounts"]:
                if account_id in self.scores_cache:
                    self.scores_cache[account_id]["network_id"] = case["network_id"]
                self.node_case_index[account_id] = {
                    "case_id": case["case_id"],
                    "network_id": case["network_id"],
                }
            for transaction_id in case["transaction_ids"]:
                self.transaction_case_index[transaction_id] = {
                    "case_id": case["case_id"],
                    "network_id": case["network_id"],
                }
        return cases

    def _ordered_network_accounts(
        self,
        network_txns: pd.DataFrame,
        member_ids: List[str],
    ) -> List[str]:
        """Persist accounts in a deterministic source-to-downstream order."""
        senders = set(network_txns["sender_id"].astype(str))
        receivers = set(network_txns["receiver_id"].astype(str))
        sources = sorted(
            senders - receivers,
            key=lambda account: network_txns[
                network_txns["sender_id"].astype(str) == account
            ]["timestamp"].min(),
        )
        ordered: List[str] = []
        queue = list(sources)
        adjacency: Dict[str, List[str]] = {}
        for _, row in network_txns.sort_values(["timestamp", "transaction_id"]).iterrows():
            sender = str(row["sender_id"])
            receiver = str(row["receiver_id"])
            adjacency.setdefault(sender, [])
            if receiver not in adjacency[sender]:
                adjacency[sender].append(receiver)

        while queue:
            account = queue.pop(0)
            if account in ordered:
                continue
            ordered.append(account)
            queue.extend(adjacency.get(account, []))

        ordered.extend(account for account in member_ids if account not in ordered)
        return ordered

    def _network_role(self, member_ids: List[str]) -> str:
        """Describe the dominant topology role for a network."""
        if not member_ids:
            return "Unknown"
        max_in = max(self.scores_cache.get(acc, {}).get("unique_senders", 0) for acc in member_ids)
        max_out = max(self.scores_cache.get(acc, {}).get("unique_receivers", 0) for acc in member_ids)
        if max_in > max_out * 1.5:
            return "Aggregator"
        if max_out > max_in * 1.5:
            return "Distributor"
        return "Relay"

    def set_alpha(self, new_alpha: float):
        """
        Dynamically adjusts hybrid alpha weight and updates scores without recalculating features.
        """
        with self.lock:
            self.alpha = min(max(new_alpha, 0.0), 1.0)
            if not self.is_loaded:
                return

            for acc_id, record in self.scores_cache.items():
                rule_score = record["rule_score"]
                ml_score = record["ml_score"]
                final_score = round(min(max((self.alpha * rule_score) + ((1.0 - self.alpha) * ml_score), 0.0), 100.0), 1)

                if final_score >= CRITICAL_THRESHOLD:
                    classification = "CRITICAL"
                    is_flagged = True
                elif final_score >= HIGH_THRESHOLD:
                    classification = "HIGH"
                    is_flagged = True
                elif final_score >= MEDIUM_THRESHOLD:
                    classification = "MEDIUM"
                    is_flagged = False
                else:
                    classification = "LOW"
                    is_flagged = False

                record["final_score"] = final_score
                record["classification"] = classification
                record["is_flagged"] = is_flagged
                record["is_mule"] = (classification in ["CRITICAL", "HIGH"])
                record["alpha_applied"] = self.alpha

            self.stats["alpha_weight"] = self.alpha
            self.stats["critical_accounts"] = sum(1 for a in self.scores_cache.values() if a["classification"] == "CRITICAL")
            self.stats["high_risk_accounts"] = sum(1 for a in self.scores_cache.values() if a["classification"] == "HIGH")
            self.stats["flagged_accounts"] = self.stats["critical_accounts"] + self.stats["high_risk_accounts"]

    def set_manual_classification(self, account_id: str, classification: str) -> Optional[Dict[str, Any]]:
        with self.lock:
            account_key = str(account_id).strip()
            level = classification.upper()
            if account_key not in self.scores_cache:
                return None
            if level not in {"CRITICAL", "HIGH", "MEDIUM", "LOW"}:
                raise ValueError("Classification must be CRITICAL, HIGH, MEDIUM, or LOW")
            self.manual_classifications[account_key] = level
            self._refresh_manual_classifications()
            return self.scores_cache[account_key]

    def _refresh_manual_classifications(self):
        for account_id, classification in self.manual_classifications.items():
            record = self.scores_cache.get(account_id)
            if not record:
                continue
            record["classification"] = classification
            record["classification_source"] = "manual"
            record["is_flagged"] = classification in {"CRITICAL", "HIGH"}
            record["is_mule"] = classification in {"CRITICAL", "HIGH"}

        if self.scores_cache:
            self.stats["critical_accounts"] = sum(
                1 for item in self.scores_cache.values() if item["classification"] == "CRITICAL"
            )
            self.stats["high_risk_accounts"] = sum(
                1 for item in self.scores_cache.values() if item["classification"] == "HIGH"
            )
            self.stats["medium_risk_accounts"] = sum(
                1 for item in self.scores_cache.values() if item["classification"] == "MEDIUM"
            )
            self.stats["low_risk_accounts"] = sum(
                1 for item in self.scores_cache.values() if item["classification"] == "LOW"
            )
            self.stats["flagged_accounts"] = (
                self.stats["critical_accounts"] + self.stats["high_risk_accounts"]
            )

    def get_accounts(
        self,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        risk_filter: Optional[str] = None,
        sort_by: str = "final_score",
        sort_order: str = "desc"
    ) -> Dict[str, Any]:
        with self.lock:
            if not self.is_loaded:
                return {"total": 0, "accounts": []}

            items = list(self.scores_cache.values())

            # Search filter
            if search:
                s_lower = search.strip().lower()
                items = [it for it in items if s_lower in it["account_id"].lower()]

            # Risk classification filter
            if risk_filter and risk_filter.upper() != "ALL":
                rf = risk_filter.upper()
                items = [it for it in items if it["classification"] == rf]

            # Sorting
            reverse = (sort_order.lower() == "desc")
            if sort_by in ["final_score", "rule_score", "ml_score", "incoming_amount", "outgoing_amount", "forwarding_ratio"]:
                items.sort(key=lambda x: x.get(sort_by, 0.0), reverse=reverse)
            else:
                items.sort(key=lambda x: str(x.get("account_id", "")), reverse=reverse)

            total = len(items)
            paginated = items[skip : skip + limit]

            return {
                "total": total,
                "skip": skip,
                "limit": limit,
                "accounts": paginated
            }

    def get_account_detail(self, account_id: str) -> Optional[Dict[str, Any]]:
        with self.lock:
            acc = str(account_id).strip()
            detail = self.scores_cache.get(acc)
            if not detail:
                return None

            # Fetch account's recent transactions
            txns = self.transactions_df[
                (self.transactions_df["sender_id"] == acc) |
                (self.transactions_df["receiver_id"] == acc)
            ].sort_values("timestamp", ascending=False).head(30)

            txn_list = []
            for _, r in txns.iterrows():
                is_incoming = (str(r["receiver_id"]) == acc)
                txn_list.append({
                    "transaction_id": str(r["transaction_id"]),
                    "timestamp": r["timestamp"].isoformat(),
                    "sender_id": str(r["sender_id"]),
                    "receiver_id": str(r["receiver_id"]),
                    "amount": float(r["amount"]),
                    "channel": str(r.get("channel", "UPI")),
                    "direction": "INCOMING" if is_incoming else "OUTGOING",
                    "counterparty": str(r["sender_id"]) if is_incoming else str(r["receiver_id"])
                })

            # Next hop ranking
            next_hops = self.trail_tracer.rank_next_hops(acc, self.transactions_df, self.scores_cache, top_k=5)

            return {
                **detail,
                "recent_transactions": txn_list,
                "next_hops": next_hops
            }

    def get_subgraph(self, account_id: str, depth: int = 1) -> Dict[str, Any]:
        with self.lock:
            if not self.is_loaded:
                return {"focus_node": account_id, "nodes": [], "edges": []}
            return self.graph_engine.get_subgraph(account_id, depth, self.scores_cache)

    def get_full_graph(self, max_nodes: int = 250) -> Dict[str, Any]:
        with self.lock:
            if not self.is_loaded:
                return {"nodes": [], "edges": [], "total_nodes": 0, "total_edges": 0}
            return self.graph_engine.get_full_graph(self.scores_cache, max_nodes=max_nodes)

    def get_money_trail_txn(self, transaction_id: str) -> Dict[str, Any]:
        with self.lock:
            if not self.is_loaded or self.transactions_df.empty:
                return {"error": "No transaction data loaded", "trail": []}
            transaction_key = str(transaction_id).strip()
            result = self.trail_tracer.trace_trail_from_transaction(
                transaction_key,
                self.transactions_df,
                self.scores_cache,
            )
            if "error" in result:
                return result
            case = next(
                (
                    item
                    for item in self.network_cases
                    if transaction_key in item.get("transaction_ids", [])
                ),
                None,
            )
            if case:
                result["case_id"] = case["case_id"]
                result["network_id"] = case["network_id"]
                result["network_status"] = case["status"]
                result["network_role"] = case["role"]
                result["ordered_accounts"] = case.get("ordered_accounts", result.get("ordered_accounts", []))
                result["transaction_ids"] = case.get("transaction_ids", [])
            return result

    def get_money_trail_case(self, case_id: str) -> Dict[str, Any]:
        with self.lock:
            if not self.is_loaded or self.transactions_df.empty:
                return {"error": "No transaction data loaded", "trail": []}

            case_key = str(case_id).strip().upper()
            case = next(
                (item for item in self.network_cases if item["case_id"].upper() == case_key),
                None,
            )
            if not case:
                return {"error": f"Case {case_id} not found", "trail": []}

            transaction_ids = set(case.get("transaction_ids", []))
            case_transactions = self.transactions_df[
                self.transactions_df["transaction_id"].astype(str).isin(transaction_ids)
            ].sort_values(["timestamp", "transaction_id"])
            if case_transactions.empty:
                return {"error": f"Case {case_id} has no transaction records", "trail": []}

            seed_id = str(case_transactions.iloc[0]["transaction_id"])
            result = self.trail_tracer.trace_trail_from_transaction(
                seed_id,
                self.transactions_df,
                self.scores_cache,
            )
            if "error" in result:
                return result
            result["case_id"] = case["case_id"]
            result["network_id"] = case["network_id"]
            result["network_status"] = case["status"]
            result["network_role"] = case["role"]
            result["ordered_accounts"] = case.get("ordered_accounts", [])
            result["transaction_ids"] = case.get("transaction_ids", [])
            return result

    def get_money_trail_acc(self, account_id: str) -> Dict[str, Any]:
        with self.lock:
            if not self.is_loaded or self.transactions_df.empty:
                return {"error": "No transaction data loaded", "trail": []}
            return self.trail_tracer.trace_trail_from_account(account_id, self.transactions_df, self.scores_cache)

    def get_next_hops(self, account_id: str) -> List[Dict[str, Any]]:
        with self.lock:
            if not self.is_loaded or self.transactions_df.empty:
                return []
            return self.trail_tracer.rank_next_hops(account_id, self.transactions_df, self.scores_cache)

    def get_stats(self) -> Dict[str, Any]:
        with self.lock:
            return self.stats

    def get_network_cases(self, limit: int = 10) -> List[Dict[str, Any]]:
        with self.lock:
            return self.network_cases[:limit]

    def get_activity_trend(self) -> List[Dict[str, Any]]:
        with self.lock:
            if not self.is_loaded or self.transactions_df.empty:
                return []

            # Group transactions by day or chronological slice
            df = self.transactions_df.copy()
            df["day"] = df["timestamp"].dt.strftime("%b %d")

            # Identify suspicious accounts
            suspicious_accs = {
                acc_id for acc_id, record in self.scores_cache.items()
                if record.get("final_score", 0) >= 50.0
            }

            results = []
            for day, group in df.groupby("day", sort=False):
                total_cnt = len(group)
                susp_cnt = sum(
                    1 for _, r in group.iterrows()
                    if str(r["sender_id"]) in suspicious_accs or str(r["receiver_id"]) in suspicious_accs
                )
                norm_cnt = max(0, total_cnt - susp_cnt)
                results.append({
                    "date": day,
                    "total": total_cnt,
                    "normal": norm_cnt,
                    "suspicious": susp_cnt,
                    "volume": float(group["amount"].sum())
                })

            return results
