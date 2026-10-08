import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Tuple


def generate_synthetic_banking_data(
    num_accounts: int = 120,
    base_transactions: int = 600,
    seed: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Generates a realistic, diverse banking transaction dataset with:
    - Normal retail accounts & salary earners
    - Legitimate high-volume GST registered merchants (hard negatives)
    - Rapid forwarding mules
    - Fan-in aggregation mules
    - Fan-out dispersal mules
    - Circular round-tripping rings
    - Layering chains
    """
    np.random.seed(seed)
    base_time = datetime(2026, 10, 8, 9, 0, 0)

    accounts = []
    transactions = []

    # 1. Legitimate High-Volume GST Merchants (Hard Negatives)
    merchants = ["MERCHANT_SUPERMART_01", "MERCHANT_ELECTRONICS_02", "MERCHANT_PHARMACY_03", "MERCHANT_TEXTILES_04"]
    for m in merchants:
        accounts.append({
            "account_id": m,
            "account_type": "merchant",
            "is_gst_registered": True,
            "gst_active": True,
            "account_age_days": 730.0,
            "kyc_status": "VERIFIED",
            "business_category": "Retail & Commerce"
        })

    # 2. Normal Retail Customers (Victims & regular individuals)
    normal_customers = [f"CUSTOMER_{i:03d}" for i in range(1, 80)]
    for c in normal_customers:
        accounts.append({
            "account_id": c,
            "account_type": "individual",
            "is_gst_registered": False,
            "gst_active": False,
            "account_age_days": float(np.random.randint(180, 1200)),
            "kyc_status": "VERIFIED",
            "business_category": "Personal"
        })

    # 3. Known / Suspected Mule Accounts
    mules = [
        "MULE_RAPID_047", "MULE_FUNNEL_103", "MULE_DISPERSAL_112",
        "MULE_CHAIN_A_201", "MULE_CHAIN_B_202", "MULE_CHAIN_C_203", "MULE_CHAIN_D_204",
        "MULE_CYCLE_X_301", "MULE_CYCLE_Y_302", "MULE_CYCLE_Z_303",
        "MULE_RUNNER_401", "MULE_RUNNER_402", "MULE_RUNNER_403"
    ]
    for m in mules:
        accounts.append({
            "account_id": m,
            "account_type": "individual",
            "is_gst_registered": False,
            "gst_active": False,
            "account_age_days": float(np.random.randint(10, 90)),  # Younger disposable accounts
            "kyc_status": "VERIFIED",
            "business_category": "Personal"
        })

    txn_counter = 1

    # -------------------------------------------------------------------------
    # Scenario A: Legitimate Merchant Transactions (High fan-in, retail purchases)
    # -------------------------------------------------------------------------
    for m in merchants:
        # Many distinct customers paying small/medium amounts over several days
        payer_sample = np.random.choice(normal_customers, size=15, replace=False)
        for payer in payer_sample:
            amt = float(np.random.choice([150, 420, 850, 1200, 2450, 3999]))
            ts = base_time + timedelta(hours=float(np.random.uniform(1, 72)))
            transactions.append({
                "transaction_id": f"TXN_{txn_counter:05d}",
                "timestamp": ts,
                "sender_id": payer,
                "receiver_id": m,
                "amount": amt,
                "channel": "UPI",
                "transaction_type": "payment",
                "status": "success"
            })
            txn_counter += 1
        # Merchant only pays occasional supplier (retains most money)
        supplier_ts = base_time + timedelta(hours=80)
        transactions.append({
            "transaction_id": f"TXN_{txn_counter:05d}",
            "timestamp": supplier_ts,
            "sender_id": m,
            "receiver_id": "CUSTOMER_001",
            "amount": 4500.0,
            "channel": "IMPS",
            "transaction_type": "transfer",
            "status": "success"
        })
        txn_counter += 1

    # -------------------------------------------------------------------------
    # Scenario B: Rapid Forwarding Mule (MULE_RAPID_047)
    # -------------------------------------------------------------------------
    # Scam victim sends ₹50,000
    victim_ts = base_time + timedelta(hours=10)
    transactions.append({
        "transaction_id": f"TXN_{txn_counter:05d}",
        "timestamp": victim_ts,
        "sender_id": "CUSTOMER_010",
        "receiver_id": "MULE_RAPID_047",
        "amount": 50000.0,
        "channel": "UPI",
        "transaction_type": "transfer",
        "status": "success"
    })
    txn_counter += 1

    # Mule forwards ₹48,500 just 72 seconds later (holding time: 72s)
    fwd_ts1 = victim_ts + timedelta(seconds=72)
    transactions.append({
        "transaction_id": f"TXN_{txn_counter:05d}",
        "timestamp": fwd_ts1,
        "sender_id": "MULE_RAPID_047",
        "receiver_id": "MULE_FUNNEL_103",
        "amount": 48500.0,
        "channel": "UPI",
        "transaction_type": "transfer",
        "status": "success"
    })
    txn_counter += 1

    # Second victim sends ₹25,000
    victim_ts2 = base_time + timedelta(hours=12)
    transactions.append({
        "transaction_id": f"TXN_{txn_counter:05d}",
        "timestamp": victim_ts2,
        "sender_id": "CUSTOMER_011",
        "receiver_id": "MULE_RAPID_047",
        "amount": 25000.0,
        "channel": "UPI",
        "transaction_type": "transfer",
        "status": "success"
    })
    txn_counter += 1

    # Rapid forward 90 seconds later
    fwd_ts2 = victim_ts2 + timedelta(seconds=90)
    transactions.append({
        "transaction_id": f"TXN_{txn_counter:05d}",
        "timestamp": fwd_ts2,
        "sender_id": "MULE_RAPID_047",
        "receiver_id": "MULE_FUNNEL_103",
        "amount": 24200.0,
        "channel": "UPI",
        "transaction_type": "transfer",
        "status": "success"
    })
    txn_counter += 1

    # -------------------------------------------------------------------------
    # Scenario C: Funnel Mule (MULE_FUNNEL_103 aggregates from 4 sources)
    # -------------------------------------------------------------------------
    funnel_senders = ["CUSTOMER_012", "CUSTOMER_013", "CUSTOMER_014"]
    for idx, fs in enumerate(funnel_senders):
        fts = base_time + timedelta(hours=13, minutes=idx * 15)
        transactions.append({
            "transaction_id": f"TXN_{txn_counter:05d}",
            "timestamp": fts,
            "sender_id": fs,
            "receiver_id": "MULE_FUNNEL_103",
            "amount": 15000.0,
            "channel": "UPI",
            "transaction_type": "transfer",
            "status": "success"
        })
        txn_counter += 1

    # Funnel mule forwards accumulated balance to dispersal mule
    fwd_funnel_ts = base_time + timedelta(hours=14)
    transactions.append({
        "transaction_id": f"TXN_{txn_counter:05d}",
        "timestamp": fwd_funnel_ts,
        "sender_id": "MULE_FUNNEL_103",
        "receiver_id": "MULE_DISPERSAL_112",
        "amount": 115000.0,
        "channel": "IMPS",
        "transaction_type": "transfer",
        "status": "success"
    })
    txn_counter += 1

    # -------------------------------------------------------------------------
    # Scenario D: Dispersal Mule (MULE_DISPERSAL_112 splits to cash-out runners)
    # -------------------------------------------------------------------------
    runners = ["MULE_RUNNER_401", "MULE_RUNNER_402", "MULE_RUNNER_403"]
    for idx, runner in enumerate(runners):
        rts = fwd_funnel_ts + timedelta(minutes=(idx + 1) * 8)
        transactions.append({
            "transaction_id": f"TXN_{txn_counter:05d}",
            "timestamp": rts,
            "sender_id": "MULE_DISPERSAL_112",
            "receiver_id": runner,
            "amount": 37000.0,
            "channel": "UPI",
            "transaction_type": "transfer",
            "status": "success"
        })
        txn_counter += 1

    # -------------------------------------------------------------------------
    # Scenario E: Deep Layering Chain (MULE_CHAIN_A -> B -> C -> D)
    # -------------------------------------------------------------------------
    chain_nodes = ["MULE_CHAIN_A_201", "MULE_CHAIN_B_202", "MULE_CHAIN_C_203", "MULE_CHAIN_D_204"]
    chain_time = base_time + timedelta(hours=18)
    
    # Origin from victim
    transactions.append({
        "transaction_id": f"TXN_{txn_counter:05d}",
        "timestamp": chain_time,
        "sender_id": "CUSTOMER_015",
        "receiver_id": chain_nodes[0],
        "amount": 80000.0,
        "channel": "NEFT",
        "transaction_type": "transfer",
        "status": "success"
    })
    txn_counter += 1

    for i in range(len(chain_nodes) - 1):
        chain_time += timedelta(minutes=12)
        transactions.append({
            "transaction_id": f"TXN_{txn_counter:05d}",
            "timestamp": chain_time,
            "sender_id": chain_nodes[i],
            "receiver_id": chain_nodes[i + 1],
            "amount": 78000.0 - (i * 1500),
            "channel": "UPI",
            "transaction_type": "transfer",
            "status": "success"
        })
        txn_counter += 1

    # -------------------------------------------------------------------------
    # Scenario F: Circular Flow Loop (MULE_CYCLE_X -> Y -> Z -> X)
    # -------------------------------------------------------------------------
    cycle_time = base_time + timedelta(hours=24)
    # Inflow from customer
    transactions.append({
        "transaction_id": f"TXN_{txn_counter:05d}",
        "timestamp": cycle_time,
        "sender_id": "CUSTOMER_020",
        "receiver_id": "MULE_CYCLE_X_301",
        "amount": 60000.0,
        "channel": "UPI",
        "transaction_type": "transfer",
        "status": "success"
    })
    txn_counter += 1

    cycle_steps = [
        ("MULE_CYCLE_X_301", "MULE_CYCLE_Y_302", 58000.0),
        ("MULE_CYCLE_Y_302", "MULE_CYCLE_Z_303", 57000.0),
        ("MULE_CYCLE_Z_303", "MULE_CYCLE_X_301", 56000.0),
    ]
    for s_id, r_id, amt in cycle_steps:
        cycle_time += timedelta(minutes=15)
        transactions.append({
            "transaction_id": f"TXN_{txn_counter:05d}",
            "timestamp": cycle_time,
            "sender_id": s_id,
            "receiver_id": r_id,
            "amount": amt,
            "channel": "UPI",
            "transaction_type": "transfer",
            "status": "success"
        })
        txn_counter += 1

    # -------------------------------------------------------------------------
    # Scenario G: Regular background peer-to-peer transfers
    # -------------------------------------------------------------------------
    for i in range(base_transactions):
        c1, c2 = np.random.choice(normal_customers, size=2, replace=False)
        ts = base_time + timedelta(hours=float(np.random.uniform(0, 120)))
        amt = float(np.random.choice([100, 250, 500, 1000, 2000, 3500, 5000, 8000]))
        transactions.append({
            "transaction_id": f"TXN_{txn_counter:05d}",
            "timestamp": ts,
            "sender_id": c1,
            "receiver_id": c2,
            "amount": amt,
            "channel": np.random.choice(["UPI", "IMPS", "NEFT"]),
            "transaction_type": "transfer",
            "status": "success"
        })
        txn_counter += 1

    df_txns = pd.DataFrame(transactions).sort_values("timestamp").reset_index(drop=True)
    df_accs = pd.DataFrame(accounts).drop_duplicates(subset=["account_id"]).reset_index(drop=True)

    return df_txns, df_accs
