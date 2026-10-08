from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from typing import Optional, Dict, Any, List
import pandas as pd
from pydantic import BaseModel

from app.core.store import DataStore
from app.data.csv_parser import parse_transactions_csv, parse_accounts_csv
from app.data.synthetic_generator import generate_synthetic_banking_data

router = APIRouter(prefix="/api", tags=["Investigation API"])
store = DataStore()


class AlphaConfigRequest(BaseModel):
    alpha: float


@router.post("/upload")
async def upload_csv(
    transactions_file: UploadFile = File(...),
    accounts_file: Optional[UploadFile] = File(None)
):
    """
    Ingests CSV transaction logs and optional account profiles.
    Parses schemas, extracts 28 features, runs XGBoost + Rule Engine, and loads state in-memory.
    """
    try:
        txn_bytes = await transactions_file.read()
        txn_df = parse_transactions_csv(txn_bytes)

        acc_df = None
        if accounts_file:
            acc_bytes = await accounts_file.read()
            acc_df = parse_accounts_csv(acc_bytes)

        store.process_and_load(txn_df, acc_df)

        stats = store.get_stats()
        return {
            "status": "success",
            "message": f"Successfully ingested {len(txn_df)} transactions across {stats.get('total_accounts', 0)} accounts.",
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process CSV files: {str(e)}")


@router.post("/demo/load")
def load_demo_data():
    """
    Instantly generates and ingests a realistic synthetic banking dataset with
    hard negatives (GST merchants) and authentic fraud typologies (rapid forwarding,
    fan-in, dispersal, layering, circular loops).
    """
    txn_df, acc_df = generate_synthetic_banking_data()
    store.process_and_load(txn_df, acc_df)
    return {
        "status": "success",
        "message": "Loaded demo banking environment with synthetic scam trails and merchants.",
        "stats": store.get_stats()
    }


@router.get("/stats")
def get_dashboard_stats():
    """
    Returns global system KPIs for top KPI dashboard strip.
    """
    if not store.is_loaded:
        # Load demo dataset automatically if empty
        txn_df, acc_df = generate_synthetic_banking_data()
        store.process_and_load(txn_df, acc_df)

    return store.get_stats()


@router.get("/accounts")
def list_accounts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    search: Optional[str] = None,
    risk_filter: Optional[str] = Query("ALL", pattern="^(ALL|CRITICAL|HIGH|MEDIUM|LOW)$"),
    sort_by: str = Query("final_score"),
    sort_order: str = Query("desc")
):
    """
    Lists accounts with pagination, search, risk level filtering, and sorting.
    """
    if not store.is_loaded:
        txn_df, acc_df = generate_synthetic_banking_data()
        store.process_and_load(txn_df, acc_df)

    return store.get_accounts(
        skip=skip,
        limit=limit,
        search=search,
        risk_filter=risk_filter,
        sort_by=sort_by,
        sort_order=sort_order
    )


@router.get("/accounts/{account_id}/risk")
def get_account_risk(account_id: str):
    """
    Returns deep account risk evidence payload:
    - Final hybrid risk score & classification
    - Rule-based score & 6 dimension breakdown
    - ML probability & score
    - Top contributing features
    - Structured factor evidence & investigator explanations
    - Recent transactions and predicted next hops
    """
    if not store.is_loaded:
        txn_df, acc_df = generate_synthetic_banking_data()
        store.process_and_load(txn_df, acc_df)

    detail = store.get_account_detail(account_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Account '{account_id}' not found")
    return detail


@router.get("/accounts/{account_id}/network")
def get_account_network(account_id: str, depth: int = Query(1, ge=1, le=3)):
    """
    Returns ego-network subgraph (nodes & directed links) surrounding the account.
    """
    if not store.is_loaded:
        txn_df, acc_df = generate_synthetic_banking_data()
        store.process_and_load(txn_df, acc_df)

    return store.get_subgraph(account_id, depth=depth)


@router.get("/transactions/{transaction_id}/trail")
def get_transaction_money_trail(transaction_id: str):
    """
    Traces sequential downstream money movement starting from a reported scam transaction.
    """
    if not store.is_loaded:
        txn_df, acc_df = generate_synthetic_banking_data()
        store.process_and_load(txn_df, acc_df)

    trail_res = store.get_money_trail_txn(transaction_id)
    if "error" in trail_res:
        raise HTTPException(status_code=404, detail=trail_res["error"])
    return trail_res


@router.get("/accounts/{account_id}/trail")
def get_account_money_trail(account_id: str):
    """
    Traces downstream money movement starting from an account.
    """
    if not store.is_loaded:
        txn_df, acc_df = generate_synthetic_banking_data()
        store.process_and_load(txn_df, acc_df)

    trail_res = store.get_money_trail_acc(account_id)
    if "error" in trail_res:
        raise HTTPException(status_code=404, detail=trail_res["error"])
    return trail_res


@router.get("/accounts/{account_id}/next-hops")
def get_next_hops(account_id: str):
    """
    Returns ranked downstream candidate accounts with transparent explainability signals.
    """
    if not store.is_loaded:
        txn_df, acc_df = generate_synthetic_banking_data()
        store.process_and_load(txn_df, acc_df)

    return {
        "account_id": account_id,
        "next_hops": store.get_next_hops(account_id)
    }


@router.get("/graph/full")
def get_full_graph(max_nodes: int = Query(250, ge=10, le=1000)):
    """
    Returns global network graph for the central interactive canvas visualization.
    """
    if not store.is_loaded:
        txn_df, acc_df = generate_synthetic_banking_data()
        store.process_and_load(txn_df, acc_df)

    return store.get_full_graph(max_nodes=max_nodes)


@router.post("/config/alpha")
def update_alpha(req: AlphaConfigRequest):
    """
    Dynamically tunes the hybrid alpha weight between Rule Engine and ML Model:
    final_score = alpha * rule_score + (1 - alpha) * ml_score
    """
    store.set_alpha(req.alpha)
    return {
        "status": "success",
        "new_alpha": store.alpha,
        "message": f"Hybrid alpha weight updated to {store.alpha:.2f}"
    }


@router.get("/activity-trend")
def get_activity_trend():
    """
    Returns time-series transaction trend (normal vs suspicious) for the dashboard chart.
    """
    if not store.is_loaded:
        txn_df, acc_df = generate_synthetic_banking_data()
        store.process_and_load(txn_df, acc_df)

    return store.get_activity_trend()
