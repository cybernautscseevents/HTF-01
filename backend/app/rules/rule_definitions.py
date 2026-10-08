from typing import Dict, Any

# Dimension Maximum Weights
MAX_WEIGHTS = {
    "pass_through": 25,
    "temporal_anomaly": 20,
    "counterparty_anomaly": 15,
    "network_topology": 25,
    "circular_flow": 10,
    "context_consistency": 5,
}

# Rule Descriptions for Investigator Explainability
RULE_DESCRIPTIONS = {
    "forwarding_ratio": {
        "name": "High Forwarding Ratio",
        "dimension": "pass_through",
        "description": "Measures the proportion of received funds that are immediately drained outward.",
        "typology": "Pass-through conduit; mule retains minimal funds as illicit commission."
    },
    "fund_retention": {
        "name": "Depleted Fund Retention",
        "dimension": "pass_through",
        "description": "Calculates the net balance retained from incoming transfers.",
        "typology": "Capital drain; near-zero balance retention indicates non-consumption conduit."
    },
    "rapid_forwarding": {
        "name": "Rapid Forwarding & Holding Time",
        "dimension": "temporal_anomaly",
        "description": "Identifies outgoing transactions dispatched within minutes of credit arrival.",
        "typology": "Panic forwarding to beat interbank cyber freeze requests."
    },
    "transaction_velocity": {
        "name": "Transaction Velocity Burst",
        "dimension": "temporal_anomaly",
        "description": "Unusually high transaction frequency compared to temporal span.",
        "typology": "Automated or scripted burst laundering."
    },
    "fan_in_funnel": {
        "name": "Multiple Unrelated Senders (Fan-In)",
        "dimension": "counterparty_anomaly",
        "description": "Account aggregates payments from multiple distinct originating sources.",
        "typology": "Funneling / smurfing aggregation hub collecting scam victim credits."
    },
    "fan_out_dispersal": {
        "name": "Dispersal Pattern (Fan-Out)",
        "dimension": "counterparty_anomaly",
        "description": "Account receives lump sums and scatters them to multiple downline entities.",
        "typology": "Dispersal conduit routing funds to multiple cash-out runners."
    },
    "network_contagion": {
        "name": "Suspicious Counterparty Contagion",
        "dimension": "network_topology",
        "description": "Direct transactional connectivity with accounts already identified as high-risk.",
        "typology": "Syndicate clustering; mules operate within connected criminal rings."
    },
    "layering_depth": {
        "name": "Layering Chain Depth",
        "dimension": "network_topology",
        "description": "Position within a multi-hop sequential transaction chain.",
        "typology": "Layering phase of money laundering to obscure source of illicit funds."
    },
    "betweenness_centrality": {
        "name": "Network Bridge Centrality",
        "dimension": "network_topology",
        "description": "Account functions as a critical topological routing bridge.",
        "typology": "Chokepoint intermediary channeling transfers across distinct network clusters."
    },
    "circular_pattern": {
        "name": "Circular Flow / Round-Tripping",
        "dimension": "circular_flow",
        "description": "Participation in directed transactional loops (A -> B -> C -> A).",
        "typology": "Round-tripping to inflate volume or create jurisdiction confusion."
    },
    "gst_mitigation": {
        "name": "GST Verified Merchant Mitigation",
        "dimension": "context_consistency",
        "description": "Verified commercial tax registration and active commercial status.",
        "typology": "Legitimate business justification for high fan-in and volume; reduces false positives."
    },
    "maturity_mitigation": {
        "name": "Longitudinal Maturity Credit",
        "dimension": "context_consistency",
        "description": "Long-standing account history with established baseline behavior.",
        "typology": "Established account profile mitigates sudden anomaly suspicion."
    },
    "new_account_spike": {
        "name": "New Account High-Volume Anomaly",
        "dimension": "context_consistency",
        "description": "Newly created account immediately exhibiting high velocity or large funds.",
        "typology": "Disposable burner mule account activated specifically for fraud proceeds."
    }
}
