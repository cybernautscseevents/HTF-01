import json
from typing import Any, Dict, List
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.config import (
    OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL,
    OPENROUTER_MODEL,
)


SYSTEM_PROMPT = """You are FinGuard's banking risk investigation summarizer.
You must be strictly grounded in the JSON evidence supplied by the backend.
Do not invent accounts, transactions, amounts, dates, GST status, risk scores,
rule factors, ML predictions, network IDs, or explanations.
Do not claim that a person committed a crime. Use "risk signal", "suspicious
pattern", or "requires investigation".
If a requested fact is missing, say "Not available in the analyzed data".
Treat rule_score, ml_score, mule_probability, final_score, classification,
network cases, timing, forwarding ratio, and GST values as authoritative
computed evidence; do not recalculate or override them.
Separate observed evidence from an analyst interpretation.
Return valid JSON only with exactly these keys:
summary (string), key_findings (array of strings), high_priority_networks
(array of objects with case_id, network_id, risk_score, reason), limitations
(array of strings).
Keep the response concise and suitable for a bank analyst."""


class SummaryServiceError(RuntimeError):
    """A user-actionable error from the OpenRouter summarizer."""


def _build_evidence(store: Any) -> Dict[str, Any]:
    with store.lock:
        if not store.is_loaded:
            raise SummaryServiceError("Upload and analyze a bank CSV before requesting an AI summary.")

        accounts: List[Dict[str, Any]] = []
        for account in store.scores_cache.values():
            accounts.append({
                "account_id": account.get("account_id"),
                "final_score": account.get("final_score"),
                "classification": account.get("classification"),
                "rule_score": account.get("rule_score"),
                "ml_score": account.get("ml_score"),
                "mule_probability": account.get("mule_probability"),
                "is_mule": account.get("is_mule"),
                "is_gst_registered": account.get("is_gst_registered"),
                "rule_factors": account.get("rule_factors", []),
                "top_reasons": account.get("top_reasons", []),
                "forwarding_ratio": account.get("forwarding_ratio"),
                "median_holding_time_hours": account.get("median_holding_time_hours"),
                "incoming_count": account.get("incoming_count"),
                "outgoing_count": account.get("outgoing_count"),
                "incoming_amount": account.get("incoming_amount"),
                "outgoing_amount": account.get("outgoing_amount"),
                "unique_senders": account.get("unique_senders"),
                "unique_receivers": account.get("unique_receivers"),
                "cycle_count": account.get("cycle_count"),
                "layering_depth": account.get("layering_depth"),
            })

        transaction_count = len(store.transactions_df)
        total_amount = float(store.transactions_df["amount"].sum()) if transaction_count else 0.0
        immediate_count = int(
            store.transactions_df["transfer_latency_seconds"].le(60).sum()
        ) if "transfer_latency_seconds" in store.transactions_df.columns else 0

        return {
            "dashboard_stats": store.get_stats(),
            "network_cases": store.get_network_cases(limit=1000),
            "accounts": accounts,
            "transaction_summary": {
                "transaction_count": transaction_count,
                "total_amount": total_amount,
                "immediate_transfer_count": immediate_count,
            },
        }


def generate_summary(store: Any) -> Dict[str, Any]:
    if not OPENROUTER_API_KEY:
        raise SummaryServiceError(
            "OpenRouter is not configured. Add OPENROUTER_API_KEY to backend/.env and restart the backend."
        )

    evidence = _build_evidence(store)
    payload = {
        "model": OPENROUTER_MODEL,
        "temperature": 0,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    "Analyze only this completed FinGuard evidence. "
                    "Do not use outside knowledge or assumptions.\n\n"
                    + json.dumps(evidence, ensure_ascii=True, default=str)
                ),
            },
        ],
        "response_format": {"type": "json_object"},
    }

    request = Request(
        f"{OPENROUTER_BASE_URL}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "FinGuard",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=60) as response:
            raw = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise SummaryServiceError(f"OpenRouter request failed ({exc.code}): {detail}") from exc
    except URLError as exc:
        raise SummaryServiceError(f"Could not reach OpenRouter: {exc.reason}") from exc
    except TimeoutError as exc:
        raise SummaryServiceError("OpenRouter request timed out.") from exc

    try:
        content = raw["choices"][0]["message"]["content"]
        result = json.loads(content) if isinstance(content, str) else content
    except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
        raise SummaryServiceError("OpenRouter returned an invalid summary response.") from exc

    required_keys = {"summary", "key_findings", "high_priority_networks", "limitations"}
    if not isinstance(result, dict) or not required_keys.issubset(result):
        raise SummaryServiceError("OpenRouter returned a summary with an unexpected shape.")
    return result
