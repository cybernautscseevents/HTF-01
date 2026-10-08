import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from collections import defaultdict
from app.graph.graph_engine import GraphEngine

FEATURE_COLUMNS = [
    "incoming_count",
    "outgoing_count",
    "incoming_amount",
    "outgoing_amount",
    "unique_senders",
    "unique_receivers",
    "in_degree",
    "out_degree",
    "weighted_in_degree",
    "weighted_out_degree",
    "fan_in",
    "fan_out",
    "forwarding_ratio",
    "rapid_forwarding_ratio",
    "median_holding_time",
    "average_holding_time",
    "transaction_velocity",
    "amount_retention_ratio",
    "account_transaction_count",
    "average_transaction_amount",
    "median_transaction_amount",
    "max_transaction_amount",
    "account_age_days",
    "graph_degree",
    "betweenness_centrality",
    "pagerank",
    "cycle_count",
    "layering_depth"
]


def extract_account_features(
    txn_df: pd.DataFrame,
    accounts_df: pd.DataFrame,
    graph_engine: GraphEngine,
    rapid_hours: float = 1.0,
    default_holding_hours: float = 168.0
) -> pd.DataFrame:
    """
    Extracts the exact 28 account-level features required by XGBoost.
    Guarantees zero-drift schema and column ordering.
    """
    all_accounts = sorted(list(set(txn_df["sender_id"]).union(set(txn_df["receiver_id"]))))
    
    # Pre-index accounts metadata
    acc_meta_dict = {}
    if not accounts_df.empty:
        for _, row in accounts_df.iterrows():
            acc_meta_dict[str(row["account_id"])] = row.to_dict()

    # Pre-group transactions by sender and receiver
    sent_by_acc = defaultdict(list)
    rcvd_by_acc = defaultdict(list)

    for _, row in txn_df.iterrows():
        if "is_successful" in row and not bool(row["is_successful"]):
            continue
        s = str(row["sender_id"])
        r = str(row["receiver_id"])
        amt = float(row["amount"])
        sent_at = row.get("sent_at", row["timestamp"])
        received_at = row.get("received_at", row["timestamp"])

        sent_by_acc[s].append((sent_at, amt))
        rcvd_by_acc[r].append((received_at, amt))

    feature_rows = []

    for acc in all_accounts:
        acc_str = str(acc)
        in_txns = rcvd_by_acc.get(acc_str, [])
        out_txns = sent_by_acc.get(acc_str, [])

        in_count = len(in_txns)
        out_count = len(out_txns)
        in_amt = sum(t[1] for t in in_txns)
        out_amt = sum(t[1] for t in out_txns)

        # Graph degrees and counterparties
        g_metrics = graph_engine.get_account_metrics(acc_str)
        unique_senders = g_metrics["in_degree"]
        unique_receivers = g_metrics["out_degree"]
        in_degree = unique_senders
        out_degree = unique_receivers
        weighted_in_degree = in_amt
        weighted_out_degree = out_amt

        # Fan In / Fan Out
        fan_in = float(unique_senders) / (float(unique_receivers) + 1.0)
        fan_out = float(unique_receivers) / (float(unique_senders) + 1.0)

        # Forwarding Ratio clipped [0, 10]
        fwd_ratio = min(max(out_amt / (in_amt + 1.0), 0.0), 10.0)

        # Holding Time & Rapid Forwarding
        # Match each outgoing transaction to recent preceding incoming transactions
        holding_times_hours = []
        rapid_forwards_count = 0

        if in_txns and out_txns:
            in_sorted_times = sorted([t[0] for t in in_txns])
            for out_time, _ in out_txns:
                # Find latest incoming transaction prior to out_time
                preceding = [t for t in in_sorted_times if t <= out_time]
                if preceding:
                    delta_seconds = (out_time - preceding[-1]).total_seconds()
                    delta_hours = max(0.0, delta_seconds / 3600.0)
                    holding_times_hours.append(delta_hours)
                    if delta_hours <= rapid_hours:
                        rapid_forwards_count += 1
                else:
                    # No preceding inbound tx, default baseline
                    holding_times_hours.append(default_holding_hours)
        elif out_txns:
            holding_times_hours = [default_holding_hours] * len(out_txns)

        if holding_times_hours:
            median_ht = float(np.median(holding_times_hours))
            avg_ht = float(np.mean(holding_times_hours))
            rapid_fwd_ratio = float(rapid_forwards_count) / float(len(out_txns)) if out_txns else 0.0
        else:
            median_ht = default_holding_hours
            avg_ht = default_holding_hours
            rapid_fwd_ratio = 0.0

        # Account Transaction Count & Velocity
        total_txns = in_count + out_count
        all_times = [t[0] for t in in_txns] + [t[0] for t in out_txns]
        if all_times:
            min_ts = min(all_times)
            max_ts = max(all_times)
            span_days = max((max_ts - min_ts).total_seconds() / 86400.0, 1.0)
        else:
            span_days = 1.0

        txn_velocity = float(total_txns) / float(span_days)

        # Amount Retention Ratio clipped [-10, 1]
        amount_retention_ratio = min(max((in_amt - out_amt) / (in_amt + 1.0), -10.0), 1.0)

        # Amounts Statistics
        all_amts = [t[1] for t in in_txns] + [t[1] for t in out_txns]
        if all_amts:
            avg_txn_amt = float(np.mean(all_amts))
            med_txn_amt = float(np.median(all_amts))
            max_txn_amt = float(np.max(all_amts))
        else:
            avg_txn_amt = 0.0
            med_txn_amt = 0.0
            max_txn_amt = 0.0

        # Account Age Days
        meta = acc_meta_dict.get(acc_str, {})
        account_age_days = float(meta.get("account_age_days", max(span_days, 180.0)))

        # Assemble row dictionary matching EXACT order of FEATURE_COLUMNS
        row_dict = {
            "account_id": acc_str,
            "incoming_count": in_count,
            "outgoing_count": out_count,
            "incoming_amount": float(in_amt),
            "outgoing_amount": float(out_amt),
            "unique_senders": unique_senders,
            "unique_receivers": unique_receivers,
            "in_degree": in_degree,
            "out_degree": out_degree,
            "weighted_in_degree": float(weighted_in_degree),
            "weighted_out_degree": float(weighted_out_degree),
            "fan_in": float(fan_in),
            "fan_out": float(fan_out),
            "forwarding_ratio": float(fwd_ratio),
            "rapid_forwarding_ratio": float(rapid_fwd_ratio),
            "median_holding_time": float(median_ht),
            "average_holding_time": float(avg_ht),
            "transaction_velocity": float(txn_velocity),
            "amount_retention_ratio": float(amount_retention_ratio),
            "account_transaction_count": total_txns,
            "average_transaction_amount": float(avg_txn_amt),
            "median_transaction_amount": float(med_txn_amt),
            "max_transaction_amount": float(max_txn_amt),
            "account_age_days": float(account_age_days),
            "graph_degree": g_metrics["graph_degree"],
            "betweenness_centrality": g_metrics["betweenness_centrality"],
            "pagerank": g_metrics["pagerank"],
            "cycle_count": g_metrics["cycle_count"],
            "layering_depth": g_metrics["layering_depth"],
        }
        feature_rows.append(row_dict)

    df_features = pd.DataFrame(feature_rows)
    return df_features
