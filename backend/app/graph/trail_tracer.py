import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Set
from collections import defaultdict
from app.graph.graph_engine import GraphEngine


class TrailTracer:
    def __init__(self, graph_engine: GraphEngine):
        self.graph_engine = graph_engine

    def trace_trail_from_transaction(
        self,
        transaction_id: str,
        txn_df: pd.DataFrame,
        scores_dict: Dict[str, Any],
        max_hops: int = 5,
        max_forward_hours: float = 48.0
    ) -> Dict[str, Any]:
        """
        Traces downstream money trail starting from a reported transaction ID.
        """
        txn_matches = txn_df[txn_df["transaction_id"] == str(transaction_id)]
        if txn_matches.empty:
            return {"error": f"Transaction {transaction_id} not found", "trail": []}

        return self._trace_connected_network(
            str(transaction_id), txn_matches.iloc[0], txn_df, scores_dict
        )

    def _trace_connected_network(
        self,
        transaction_id: str,
        seed_txn: pd.Series,
        txn_df: pd.DataFrame,
        scores_dict: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Return every successful transaction in the seed's connected network."""
        successful = txn_df[
            txn_df["is_successful"] if "is_successful" in txn_df.columns else pd.Series(True, index=txn_df.index)
        ].copy()
        seed_sender = str(seed_txn["sender_id"])
        seed_receiver = str(seed_txn["receiver_id"])
        accounts: Set[str] = {seed_sender, seed_receiver}

        changed = True
        while changed:
            changed = False
            related = successful[
                successful["sender_id"].astype(str).isin(accounts)
                | successful["receiver_id"].astype(str).isin(accounts)
            ]
            discovered = set(related["sender_id"].astype(str)) | set(related["receiver_id"].astype(str))
            if not discovered.issubset(accounts):
                accounts.update(discovered)
                changed = True

        network = successful[
            successful["sender_id"].astype(str).isin(accounts)
            & successful["receiver_id"].astype(str).isin(accounts)
        ].sort_values(["timestamp", "transaction_id"])

        # Assign a stable path depth from the seed sender/receiver for display.
        distances: Dict[str, int] = {seed_sender: 0, seed_receiver: 1}
        for _, row in network.iterrows():
            sender = str(row["sender_id"])
            receiver = str(row["receiver_id"])
            if sender in distances and receiver not in distances:
                distances[receiver] = distances[sender] + 1
            elif receiver in distances and sender not in distances:
                distances[sender] = max(0, distances[receiver] - 1)

        trail = []
        for _, row in network.iterrows():
            sender = str(row["sender_id"])
            receiver = str(row["receiver_id"])
            is_seed = str(row["transaction_id"]) == transaction_id
            sent_at = row.get("sent_at", row["timestamp"])
            received_at = row.get("received_at", row["timestamp"])
            holding_seconds = max(
                0,
                int((received_at - sent_at).total_seconds())
                if pd.notna(received_at) and pd.notna(sent_at)
                else 0,
            )
            receiver_info = scores_dict.get(receiver, {})
            classification = receiver_info.get("classification", "LOW")
            trail.append({
                "hop": distances.get(sender, 0),
                "transaction_id": str(row["transaction_id"]),
                "sender_id": sender,
                "receiver_id": receiver,
                "amount": float(row["amount"]),
                "timestamp": row["timestamp"].isoformat(),
                "holding_time_seconds": holding_seconds,
                "channel": str(row.get("channel", "UPI")),
                "receiver_risk_score": receiver_info.get("final_score", 0.0),
                "receiver_classification": classification,
                "receiver_is_mule": receiver_info.get("is_mule", False),
                "action": "REPORTED_TRANSACTION" if is_seed else "NETWORK_TRANSFER",
                "type": "Incoming" if sender not in accounts or distances.get(sender, 0) < distances.get(receiver, 1) else "Outgoing",
                "note": "Victim transfer" if is_seed else (
                    "Aggregated transfer" if sender in distances and receiver in distances else "Network transfer"
                ),
            })

        ordered_accounts = sorted(
            accounts,
            key=lambda account: (distances.get(account, 999), account),
        )
        account_risk = {
            account: {
                "risk_score": round(float(scores_dict.get(account, {}).get("final_score", 0.0)), 1),
                "classification": scores_dict.get(account, {}).get("classification", "LOW"),
                "is_mule": bool(scores_dict.get(account, {}).get("is_mule", False)),
            }
            for account in ordered_accounts
        }
        return {
            "origin_transaction_id": transaction_id,
            "network_id": None,
            "total_hops": max((hop["hop"] for hop in trail), default=0),
            "origin_amount": float(seed_txn["amount"]),
            "ordered_accounts": ordered_accounts,
            "account_risk": account_risk,
            "trail": trail,
        }
 
        seed_txn = txn_matches.iloc[0]
        seed_sender = str(seed_txn["sender_id"])
        seed_receiver = str(seed_txn["receiver_id"])
        seed_amt = float(seed_txn["amount"])
        seed_time = seed_txn["timestamp"]

        # Hop 0: The originating transaction
        trail = [{
            "hop": 0,
            "transaction_id": str(seed_txn["transaction_id"]),
            "sender_id": seed_sender,
            "receiver_id": seed_receiver,
            "amount": seed_amt,
            "timestamp": seed_time.isoformat(),
            "holding_time_seconds": 0,
            "channel": str(seed_txn.get("channel", "UPI")),
            "receiver_risk_score": scores_dict.get(seed_receiver, {}).get("final_score", 0.0),
            "receiver_classification": scores_dict.get(seed_receiver, {}).get("classification", "LOW"),
            "receiver_is_mule": scores_dict.get(seed_receiver, {}).get("is_mule", False),
            "action": "REPORTED_FRAUD_ORIGIN"
        }]

        current_acc = seed_receiver
        current_time = seed_time
        current_amt = seed_amt
        visited_nodes: Set[str] = {seed_sender, seed_receiver}

        # Progressively follow downstream forwardings
        for hop_idx in range(1, max_hops + 1):
            # Look for outgoing transactions from current_acc occurring after current_time
            out_candidates = txn_df[
                (txn_df["sender_id"] == current_acc) &
                (txn_df["timestamp"] >= current_time) &
                (txn_df["timestamp"] <= current_time + pd.Timedelta(hours=max_forward_hours))
            ].sort_values("timestamp")

            if out_candidates.empty:
                break

            # Select the most likely forwarded transaction:
            # 1. Close in amount (within 30% of incoming amount)
            # 2. Or earliest subsequent outgoing transaction
            best_tx = None
            best_diff = float("inf")

            for _, cand in out_candidates.iterrows():
                cand_receiver = str(cand["receiver_id"])
                if cand_receiver in visited_nodes:
                    continue  # prevent immediate cycle trapping
                amt_diff = abs(float(cand["amount"]) - current_amt)
                if amt_diff < best_diff:
                    best_diff = amt_diff
                    best_tx = cand

            if best_tx is None:
                # Fallback to the first transaction even if visited
                best_tx = out_candidates.iloc[0]

            next_sender = str(best_tx["sender_id"])
            next_receiver = str(best_tx["receiver_id"])
            next_amt = float(best_tx["amount"])
            next_time = best_tx["timestamp"]
            holding_secs = (next_time - current_time).total_seconds()

            visited_nodes.add(next_receiver)

            trail.append({
                "hop": hop_idx,
                "transaction_id": str(best_tx["transaction_id"]),
                "sender_id": next_sender,
                "receiver_id": next_receiver,
                "amount": next_amt,
                "timestamp": next_time.isoformat(),
                "holding_time_seconds": max(0, int(holding_secs)),
                "channel": str(best_tx.get("channel", "UPI")),
                "receiver_risk_score": scores_dict.get(next_receiver, {}).get("final_score", 0.0),
                "receiver_classification": scores_dict.get(next_receiver, {}).get("classification", "LOW"),
                "receiver_is_mule": scores_dict.get(next_receiver, {}).get("is_mule", False),
                "action": "LAYERED_FORWARD"
            })

            current_acc = next_receiver
            current_time = next_time
            current_amt = next_amt

        return {
            "origin_transaction_id": str(transaction_id),
            "total_hops": len(trail) - 1,
            "origin_amount": seed_amt,
            "trail": trail
        }

    def trace_trail_from_account(
        self,
        account_id: str,
        txn_df: pd.DataFrame,
        scores_dict: Dict[str, Any],
        max_hops: int = 5
    ) -> Dict[str, Any]:
        """
        Traces downstream money trail starting from an account's earliest or largest outgoing transaction.
        """
        acc = str(account_id)
        # A victim/account search starts with its earliest incoming transaction.
        # This preserves the complete connected network instead of beginning
        # halfway through the downstream chain.
        in_txs = txn_df[txn_df["receiver_id"] == acc].sort_values("timestamp")
        out_txs = txn_df[txn_df["sender_id"] == acc].sort_values("timestamp")
        if not in_txs.empty:
            seed_tx_id = str(in_txs.iloc[0]["transaction_id"])
        elif not out_txs.empty:
            seed_tx_id = str(out_txs.iloc[0]["transaction_id"])
        else:
            return {"error": f"Account {account_id} has no transaction history", "trail": []}
        return self.trace_trail_from_transaction(seed_tx_id, txn_df, scores_dict, max_hops)

    def rank_next_hops(
        self,
        account_id: str,
        txn_df: pd.DataFrame,
        scores_dict: Dict[str, Any],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Ranks potential next hops from an account based on:
        1. Historical transfer frequency
        2. Recency of transfers
        3. Amount similarity
        4. Receiver's mule risk score
        """
        acc = str(account_id)
        out_txs = txn_df[txn_df["sender_id"] == acc]
        if out_txs.empty:
            return []

        # Latest outgoing reference time
        ref_time = txn_df["timestamp"].max()
        mean_out_amt = out_txs["amount"].mean()

        receiver_stats = defaultdict(lambda: {"count": 0, "total_amt": 0.0, "latest_ts": None, "last_amt": 0.0})

        for _, row in out_txs.iterrows():
            rcv = str(row["receiver_id"])
            amt = float(row["amount"])
            ts = row["timestamp"]

            receiver_stats[rcv]["count"] += 1
            receiver_stats[rcv]["total_amt"] += amt
            receiver_stats[rcv]["last_amt"] = amt
            if receiver_stats[rcv]["latest_ts"] is None or ts > receiver_stats[rcv]["latest_ts"]:
                receiver_stats[rcv]["latest_ts"] = ts

        ranked_candidates = []

        for candidate, stats in receiver_stats.items():
            cand_score_info = scores_dict.get(candidate, {})
            cand_risk = cand_score_info.get("final_score", 10.0)
            cand_class = cand_score_info.get("classification", "LOW")
            
            # Recency factor: hours since last transaction
            if stats["latest_ts"]:
                elapsed_hours = (ref_time - stats["latest_ts"]).total_seconds() / 3600.0
                recency_score = max(0.0, 100.0 - min(elapsed_hours * 2.0, 100.0))
            else:
                recency_score = 10.0

            # Frequency score: normalized count
            freq_score = min(stats["count"] * 25.0, 100.0)

            # Amount similarity score
            amt_diff_ratio = abs(stats["last_amt"] - mean_out_amt) / (mean_out_amt + 1.0)
            amt_sim_score = max(0.0, 100.0 * (1.0 - min(amt_diff_ratio, 1.0)))

            # Weighted next-hop confidence score
            next_hop_score = (
                0.35 * cand_risk +
                0.25 * freq_score +
                0.20 * recency_score +
                0.20 * amt_sim_score
            )

            # Investigator reasoning
            reasons = []
            if stats["count"] >= 2:
                reasons.append(f"Frequent receiver ({stats['count']} past transfers)")
            else:
                reasons.append("Recent downstream recipient")
            if cand_risk >= 50.0:
                reasons.append(f"Elevated counterparty risk score ({cand_risk:.1f} {cand_class})")
            if amt_sim_score >= 70.0:
                reasons.append(f"Similar transfer volume (₹{stats['last_amt']:,.0f})")

            ranked_candidates.append({
                "candidate_account": candidate,
                "next_hop_score": round(next_hop_score, 1),
                "receiver_risk_score": round(cand_risk, 1),
                "receiver_classification": cand_class,
                "transfer_count": stats["count"],
                "last_transfer_amount": round(stats["last_amt"], 2),
                "reasons": reasons
            })

        ranked_candidates.sort(key=lambda x: x["next_hop_score"], reverse=True)
        return ranked_candidates[:top_k]
