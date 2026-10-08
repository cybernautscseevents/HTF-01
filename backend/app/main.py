from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.routes import router
from app.core.config import CORS_ORIGINS
from app.core.store import DataStore
from app.data.synthetic_generator import generate_synthetic_banking_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: preload simulated demo dataset in memory so endpoints are immediately active
    store = DataStore()
    if not store.is_loaded:
        txn_df, acc_df = generate_synthetic_banking_data()
        store.process_and_load(txn_df, acc_df)
        print("FinGuard Engine initialized: Demo synthetic banking dataset loaded in-memory.")
    yield
    # Shutdown logic if any


app = FastAPI(
    title="FinGuard API — MuleTrace Intelligence Engine",
    description="Deterministic 100-Point Rule Engine & XGBoost ML Mule Account Detection Engine",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js / Vite / React frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All API Routes
app.include_router(router)


@app.get("/")
def root():
    return {
        "engine": "FinGuard MuleTrace Engine",
        "status": "operational",
        "database": "In-Memory CSV Stream Pipeline (No DB Required)",
        "model": "XGBClassifier (Account-Level)",
        "rules": "100-Point Deterministic Heuristic Engine with GST Mitigation",
        "endpoints": {
            "upload_csv": "POST /api/upload",
            "load_demo": "POST /api/demo/load",
            "list_accounts": "GET /api/accounts",
            "account_risk": "GET /api/accounts/{id}/risk",
            "ego_network": "GET /api/accounts/{id}/network",
            "money_trail": "GET /api/transactions/{id}/trail",
            "next_hops": "GET /api/accounts/{id}/next-hops",
            "full_graph": "GET /api/graph/full",
            "stats": "GET /api/stats",
            "tune_alpha": "POST /api/config/alpha",
            "docs": "/docs"
        }
    }


@app.get("/health")
def health_check():
    store = DataStore()
    if not store.is_loaded:
        txn_df, acc_df = generate_synthetic_banking_data()
        store.process_and_load(txn_df, acc_df)
    return {
        "status": "healthy",
        "is_data_loaded": store.is_loaded,
        "accounts_count": len(store.scores_cache),
        "transactions_count": len(store.transactions_df)
    }