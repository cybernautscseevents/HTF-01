from fastapi import FastAPI

app = FastAPI(
    title="FinGuard API",
    description="Financial Crime Network Investigation Engine",
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "message": "FinGuard API is running",
        "status": "ok",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }