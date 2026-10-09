import io
import pandas as pd
import numpy as np
from typing import Tuple, Optional, Dict, Any
from datetime import datetime

# Flexible column alias mappings
TRANSACTION_COLUMN_MAP = {
    # transaction_id
    "transaction_id": "transaction_id",
    "txn_id": "transaction_id",
    "tx_id": "transaction_id",
    "id": "transaction_id",
    "reference_id": "transaction_id",
    "ref_id": "transaction_id",
    
    # timestamp
    "timestamp": "timestamp",
    "datetime": "timestamp",
    "tx_time": "timestamp",
    "txn_time": "timestamp",
    "date": "timestamp",
    "time": "timestamp",
    "created_at": "timestamp",
    "time_sent": "sent_at",
    "sent_time": "sent_at",
    "sent_at": "sent_at",
    "time_received": "received_at",
    "received_time": "received_at",
    "received_at": "received_at",
    
    # sender_id
    "sender_id": "sender_id",
    "sender": "sender_id",
    "from_account": "sender_id",
    "source_id": "sender_id",
    "source_account": "sender_id",
    "origin_account": "sender_id",
    "from": "sender_id",
    "payer": "sender_id",
    "sender_account_no": "sender_id",
    "sender_account_number": "sender_id",
    
    # receiver_id
    "receiver_id": "receiver_id",
    "receiver": "receiver_id",
    "to_account": "receiver_id",
    "destination_id": "receiver_id",
    "dest_account": "receiver_id",
    "destination_account": "receiver_id",
    "to": "receiver_id",
    "payee": "receiver_id",
    "receiver_account_no": "receiver_id",
    "receiver_account_number": "receiver_id",
    
    # amount
    "amount": "amount",
    "txn_amount": "amount",
    "tx_amount": "amount",
    "value": "amount",
    "sum": "amount",
    
    # channel
    "channel": "channel",
    "payment_channel": "channel",
    "method": "channel",
    "payment_method": "channel",
    "txn_channel": "channel",
    
    # transaction_type
    "transaction_type": "transaction_type",
    "type": "transaction_type",
    "txn_type": "transaction_type",
    
    # status
    "status": "status",
    "txn_status": "status",
    "state": "status",
    "transfer_status": "status",
    "transfer_success": "status",
    "gst": "is_gst_registered",
    "gst_registered": "is_gst_registered",
    "is_gst_registered": "is_gst_registered",
}

ACCOUNT_COLUMN_MAP = {
    "account_id": "account_id",
    "acc_id": "account_id",
    "id": "account_id",
    "customer_id": "account_id",
    
    "account_type": "account_type",
    "type": "account_type",
    "customer_segment": "account_type",
    
    "is_gst_registered": "is_gst_registered",
    "gst_registered": "is_gst_registered",
    "has_gst": "is_gst_registered",
    "gstin": "gstin",
    
    "gst_active": "gst_active",
    "is_active": "gst_active",
    
    "account_age_days": "account_age_days",
    "age_days": "account_age_days",
    "age": "account_age_days",
    
    "kyc_status": "kyc_status",
    "kyc_verified": "kyc_status",
    "verified": "kyc_status",
    
    "baseline_daily_volume": "baseline_daily_volume",
    "business_category": "business_category",
}


def parse_transactions_csv(content: bytes) -> pd.DataFrame:
    """
    Parses transactions CSV with flexible schema detection and data cleaning.
    """
    df = pd.read_csv(io.BytesIO(content))
    
    # Normalize column names: lowercase and stripped
    col_mapping = {}
    for col in df.columns:
        norm = col.strip().lower().replace(" ", "_").replace("-", "_")
        if norm in TRANSACTION_COLUMN_MAP:
            col_mapping[col] = TRANSACTION_COLUMN_MAP[norm]
        else:
            col_mapping[col] = norm
            
    df = df.rename(columns=col_mapping)
    
    # Ensure required columns exist
    # A bank feed may provide separate send and receive times. The backend keeps
    # both for latency/immediate-forwarding analysis and derives a common
    # timestamp for existing graph and trend consumers.
    if "sent_at" in df.columns:
        df["sent_at"] = pd.to_datetime(df["sent_at"], errors="coerce")
    if "received_at" in df.columns:
        df["received_at"] = pd.to_datetime(df["received_at"], errors="coerce")
    if "timestamp" not in df.columns:
        if "received_at" in df.columns:
            df["timestamp"] = df["received_at"]
        elif "sent_at" in df.columns:
            df["timestamp"] = df["sent_at"]

    required_cols = ["transaction_id", "sender_id", "receiver_id"]
    if "timestamp" not in df.columns:
        raise ValueError("CSV must contain timestamp, time_sent, or time_received")
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"CSV is missing essential transaction columns: {missing}. Available: {list(df.columns)}")
        
    # Optional columns defaults
    if "amount" not in df.columns:
        raise ValueError("CSV must contain the transferred amount column")
    if "channel" not in df.columns:
        df["channel"] = "UPI"
    if "transaction_type" not in df.columns:
        df["transaction_type"] = "transfer"
    if "status" not in df.columns:
        df["status"] = "success"
        
    # Cast types
    df["transaction_id"] = df["transaction_id"].astype(str)
    df["sender_id"] = df["sender_id"].astype(str).str.strip()
    df["receiver_id"] = df["receiver_id"].astype(str).str.strip()
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
    
    # Parse timestamps and fill one-sided feeds without fabricating a different
    # transaction time.
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    if "sent_at" not in df.columns:
        df["sent_at"] = df["timestamp"]
    if "received_at" not in df.columns:
        df["received_at"] = df["timestamp"]
    df["sent_at"] = df["sent_at"].fillna(df["timestamp"])
    df["received_at"] = df["received_at"].fillna(df["sent_at"])
    df["timestamp"] = df["timestamp"].fillna(df["received_at"]).fillna(df["sent_at"])
    if df["timestamp"].isna().any():
        raise ValueError("CSV contains rows without a valid transaction time")

    df["status"] = df["status"].astype(str).str.strip().str.lower()
    df["is_successful"] = df["status"].isin(
        ["success", "succeeded", "completed", "complete", "settled", "true", "1", "yes", "y"]
    )
    df["transfer_latency_seconds"] = (
        (df["received_at"] - df["sent_at"]).dt.total_seconds().clip(lower=0).fillna(0.0)
    )
    if "is_gst_registered" in df.columns:
        df["is_gst_registered"] = (
            df["is_gst_registered"].astype(str).str.strip().str.lower()
            .isin(["true", "1", "yes", "y"])
        )
        
    # Sort chronologically
    df = df.sort_values("timestamp").reset_index(drop=True)
    return df


def parse_accounts_csv(content: bytes) -> pd.DataFrame:
    """
    Parses accounts metadata CSV.
    """
    df = pd.read_csv(io.BytesIO(content))
    
    col_mapping = {}
    for col in df.columns:
        norm = col.strip().lower().replace(" ", "_").replace("-", "_")
        if norm in ACCOUNT_COLUMN_MAP:
            col_mapping[col] = ACCOUNT_COLUMN_MAP[norm]
        else:
            col_mapping[col] = norm
            
    df = df.rename(columns=col_mapping)
    
    if "account_id" not in df.columns:
        raise ValueError("Accounts CSV must contain an 'account_id' column")
        
    df["account_id"] = df["account_id"].astype(str).str.strip()
    
    # Boolean conversions for GST
    if "is_gst_registered" in df.columns:
        df["is_gst_registered"] = df["is_gst_registered"].astype(str).str.lower().isin(["true", "1", "yes", "y"])
    else:
        df["is_gst_registered"] = False
        
    if "gst_active" in df.columns:
        df["gst_active"] = df["gst_active"].astype(str).str.lower().isin(["true", "1", "yes", "y", "active"])
    else:
        df["gst_active"] = df["is_gst_registered"]
        
    if "account_type" not in df.columns:
        df["account_type"] = "individual"
        
    if "account_age_days" in df.columns:
        df["account_age_days"] = pd.to_numeric(df["account_age_days"], errors="coerce").fillna(180.0)
    else:
        df["account_age_days"] = 180.0
        
    if "kyc_status" not in df.columns:
        df["kyc_status"] = "VERIFIED"
        
    return df


def synthesize_accounts_from_transactions(txn_df: pd.DataFrame) -> pd.DataFrame:
    """
    If no accounts CSV is provided, automatically derives account metadata
    from unique senders and receivers in transactions.
    """
    unique_accounts = sorted(list(set(txn_df["sender_id"]).union(set(txn_df["receiver_id"]))))
    
    # Calculate initial observation span per account
    earliest_time = txn_df["timestamp"].min()
    
    rows = []
    for acc in unique_accounts:
        acc_str = str(acc)
        is_merchant = "MERCHANT" in acc_str.upper() or "STORE" in acc_str.upper() or "BIZ" in acc_str.upper()
        
        gst_in_feed = False
        if "is_gst_registered" in txn_df.columns:
            gst_in_feed = bool(
                txn_df.loc[
                    (txn_df["sender_id"] == acc) | (txn_df["receiver_id"] == acc),
                    "is_gst_registered",
                ].any()
            )
        rows.append({
            "account_id": acc,
            "account_type": "merchant" if is_merchant else "individual",
            "is_gst_registered": is_merchant or gst_in_feed,
            "gst_active": is_merchant or gst_in_feed,
            "account_age_days": 365.0 if is_merchant else 180.0,
            "kyc_status": "VERIFIED",
            "business_category": "Retail & Trade" if is_merchant else "Personal"
        })
        
    return pd.DataFrame(rows)
