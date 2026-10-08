# MuleTrace — Comprehensive Rule Engine Specification & Detection Framework

> **Operational Classification**: Hybrid Deterministic Heuristics & Supervised Machine Learning Pipeline for Financial Crime & Money Mule Detection.  
> **Target Environment**: High-Throughput UPI / Banking Transaction Feeds & CSV Batch Ingestion (Zero-Database Architecture).

---

## 1. Executive Summary & Regulatory Typology

Money mule networks represent the primary mechanism by which organized cyber syndicates, investment fraudsters, and phishing rings launder illicit proceeds out of the banking system before victims report unauthorized debits (e.g., via India's National Cyber Crime Reporting Portal / Helpline 1930 or bank stop-payment mechanisms).

According to typologies established by the **Financial Action Task Force (FATF)**, the **Reserve Bank of India (RBI)**, and the **Financial Intelligence Unit (FIU-IND)**, mule accounts exhibit distinctive structural and temporal anomalies that diverge sharply from regular retail customers:
1. **Ephemeral Pass-Through**: Money rarely settles; incoming credits are forwarded outward within minutes, leaving minimal balance retention.
2. **Funneling (Fan-In)**: Multiple unrelated originating accounts (scam victims or feeder mules) aggregate funds into a central consolidation mule.
3. **Dispersal (Fan-Out)**: A consolidated sum is divided into micro-transfers sent to multiple downline runners or ATM cashout cards (smurfing).
4. **Layering Chains**: Sequential transfers across multiple intermediate accounts (Victim $\to$ Mule A $\to$ Mule B $\to$ Mule C $\to$ Cashout) to break the direct audit trail.
5. **Round-Tripping**: Circular transactional loops ($A \to B \to C \to A$) used to artificially simulate volume or confuse automated freeze orders.

However, a naive rule engine creates high False Positive Rates on legitimate merchants (e.g., supermarkets, e-commerce sellers, kiranas) who naturally have **high fan-in** (hundreds of customers paying UPI). **MuleTrace resolves this through a robust 100-point deterministic engine featuring Active GST Registration Mitigations, coupled with an XGBoost binary classifier in a calibrated hybrid scoring matrix.**

---

## 2. System Architecture & Zero-Database Pipeline

```
+───────────────────────────────────────────────────────────+
|               CSV Ingestion / Transaction Feed            |
|       (transactions.csv  +  optional accounts.csv)         |
+─────────────────────────────┬─────────────────────────────+
                              │
                              ▼
+───────────────────────────────────────────────────────────+
|       Fuzzy Schema Alignment & In-Memory Data Store       |
|    - Maps transaction_id, timestamp, sender, receiver, amt |
|    - Synthesizes account metadata & GST profiles          |
+─────────────────────────────┬─────────────────────────────+
                              │
                              ▼
+───────────────────────────────────────────────────────────+
|        NetworkX Directed Multi-Graph Engine               |
|    - Directed MultiDiGraph (preserves individual txns)    |
|    - Condensed DiGraph (aggregated weights & flows)       |
|    - Computes PageRank, Betweenness, Cycles & Layering    |
+──────────────┬─────────────────────────────┬──────────────+
               │                             │
               ▼                             ▼
+──────────────────────────────+ +──────────────────────────+
|  28-D ML Feature Extractor   | | Two-Pass Rule Engine     |
|  - Holding times (approx)    | | Pass 1: Intrinsic Scores |
|  - Forwarding & Retention    | |   (Pass-through, Burst,  |
|  - Fan-in / Fan-out          | |    Cycles, GST Credit)   |
|  - Graph centrality & cycles | | Pass 2: Network Contagion|
+──────────────┬───────────────+ +─────────────┬────────────+
               │                               │
               ▼                               ▼
+──────────────────────────────+ +──────────────────────────+
| XGBoost Classifier (ML/...)  | | 100-Point Rule Score     |
| mule_probability ∈ [0.0, 1.0]| | Range: 0 to 100 pts      |
| ml_score = prob * 100        | | Structured Evidence      |
+──────────────┬───────────────+ +─────────────┬────────────+
               │                               │
               └───────────────┬───────────────┘
                               │
                               ▼
+───────────────────────────────────────────────────────────+
|               Hybrid Risk Fusion Engine                   |
|       Final Score = α · Rule Score + (1 - α) · ML Score   |
|           (Default α = 0.50, dynamically tunable)         |
+──────────────────────────────┬─────────────────────────────+
                               │
                               ▼
+───────────────────────────────────────────────────────────+
|               Investigation & Graph UI API                |
|  - Account Risk Cards & Explanations (/api/accounts/{id})  |
|  - Ego-Network Subgraphs (/api/accounts/{id}/network)     |
|  - Full Network Graph Canvas (/api/graph/full)            |
|  - Downstream Money Trail (/api/transactions/{id}/trail)  |
|  - Explainable Next-Hop Ranking (/api/accounts/{id}/hops) |
+───────────────────────────────────────────────────────────+
```

---

## 3. The Deterministic Rule Engine (100 Points Framework)

The deterministic rule score evaluates **6 independent risk dimensions**. The maximum potential score is 100 points, with positive penalty points for suspicious behaviors and negative credit points for verifiable mitigating factors.

```
Raw Score = Σ Dimension Points
Rule Score = min(max(Raw Score, 0.0), 100.0)
```

---

### Dimension 1: Pass-Through Behaviour & Capital Drainage
- **Maximum Dimension Weight**: 25 Points
- **Regulatory Typology**: Retail accounts consume or store wealth (rent, bills, groceries, investments). Mules operate purely as high-speed conduits, retaining only a tiny illicit commission (typically 2% to 8%).

#### Rule 1.1: Outbound Forwarding Ratio
Calculates the proportion of total received funds that are forwarded out:
$$\text{Forwarding Ratio} = \min\left(\max\left(\frac{\sum \text{Amount}_{\text{out}}}{\sum \text{Amount}_{\text{in}} + 1.0}, 0.0\right), 10.0\right)$$

| Condition | Points Awarded | Severity | Investigative Reasoning |
| :--- | :---: | :---: | :--- |
| $\text{Forwarding Ratio} \ge 92.0\%$ | **+15 pts** | CRITICAL | Critical pass-through conduit; drains almost all inflows immediately. |
| $80.0\% \le \text{Ratio} < 92.0\%$ | **+10 pts** | HIGH | Elevated outbound forwarding; minimal funds held. |
| $65.0\% \le \text{Ratio} < 80.0\%$ | **+5 pts** | MODERATE | Moderate pass-through conduit. |
| $\text{Ratio} < 65.0\%$ | **0 pts** | NONE | Normal capital retention and consumption. |

#### Rule 1.2: Depleted Capital Retention Ratio
Evaluates the net retained balance relative to inflows:
$$\text{Retention Ratio} = \min\left(\max\left(\frac{\sum \text{Amount}_{\text{in}} - \sum \text{Amount}_{\text{out}}}{\sum \text{Amount}_{\text{in}} + 1.0}, -10.0\right), 1.0\right)$$

| Condition | Points Awarded | Severity | Investigative Reasoning |
| :--- | :---: | :---: | :--- |
| $\text{Retention Ratio} \le 0.05$ ($\le 5\%$ retained) | **+10 pts** | HIGH | Near-zero account retention; capital is drained completely. |
| $0.05 < \text{Retention Ratio} \le 0.15$ ($5\% - 15\%$) | **+5 pts** | MODERATE | Abnormally low fund retention for retail account. |
| $\text{Retention Ratio} > 0.15$ ($> 15\%$ retained) | **0 pts** | NONE | Normal balance retention. |

---

### Dimension 2: Temporal Anomaly & Rapid Forwarding
- **Maximum Dimension Weight**: 20 Points
- **Regulatory Typology**: Fraud proceeds are exposed to immediate clawback or freeze requests once the victim reports the crime (e.g., Indian cyber helpline 1930 / I4C). Criminal syndicates enforce rapid forwarding rules on their mules to push money into cash-out sinks before interbank freezes occur.

#### Rule 2.1: Rapid Forwarding Frequency & Holding Time
For each outgoing transaction $t_{\text{out}}$, we compute the holding time relative to the latest preceding incoming transaction $t_{\text{in}}$:
$$\Delta t = t_{\text{out}} - t_{\text{in}}$$
An outgoing transfer is flagged as **rapid** if $\Delta t \le 1.0 \text{ hour}$ (3,600 seconds).

| Condition | Points Awarded | Severity | Investigative Reasoning |
| :--- | :---: | :---: | :--- |
| $\text{Median Holding Time} < 120\text{s}$ **OR** ($\text{Rapid Ratio} \ge 70\%$ and $N_{\text{out}} \ge 2$) | **+15 pts** | CRITICAL | Panic forwarding: funds drained within 2 minutes of arrival. |
| $\text{Median Holding Time} < 300\text{s}$ (5 min) **OR** $\text{Rapid Ratio} \ge 40\%$ | **+10 pts** | HIGH | Rapid pass-through: funds drained within 5 minutes. |
| $\text{Median Holding Time} \le 1.0\text{ hr}$ (60 min) | **+5 pts** | MODERATE | Short intermediate holding period. |
| $\text{Median Holding Time} > 1.0\text{ hr}$ | **0 pts** | NONE | Normal holding baseline ($\ge 7$ days default). |

#### Rule 2.2: Transaction Velocity Bursts
Calculates transaction intensity over the observation span:
$$\text{Velocity} = \frac{N_{\text{transactions}}}{\max(\text{Active Span in Days}, 1.0)}$$

| Condition | Points Awarded | Severity | Investigative Reasoning |
| :--- | :---: | :---: | :--- |
| $\text{Velocity} \ge 8.0\text{ txns/day}$ | **+5 pts** | HIGH | Burst frequency indicative of automated or high-pressure laundering. |
| $4.0 \le \text{Velocity} < 8.0\text{ txns/day}$ | **+3 pts** | MODERATE | Elevated transaction velocity. |
| $\text{Velocity} < 4.0\text{ txns/day}$ | **0 pts** | NONE | Normal human transaction pace. |

---

### Dimension 3: Counterparty Anomaly & Topology (Fan-In / Fan-Out)
- **Maximum Dimension Weight**: 15 Points
- **Regulatory Typology**: Detects smurfing and funneling architectures. Funnel mules receive multiple victim credits (high fan-in); dispersal mules fragment large sums into micro-payments to downline mules (high fan-out).

#### Rule 3.1: Funneling / Fan-In Aggregation
Measures concentration of incoming payments from distinct originators:
$$\text{Fan-In Ratio} = \frac{\text{Unique Senders}}{\text{Unique Receivers} + 1.0}$$

| Condition | Points Awarded | Severity | Investigative Reasoning |
| :--- | :---: | :---: | :--- |
| $\text{Unique Senders} \ge 5$ **AND** $\text{Fan-In} \ge 2.5$ | **+10 pts** | HIGH | Funnel node aggregating credits from multiple independent victims. |
| $\text{Unique Senders} \ge 3$ **AND** $\text{Fan-In} \ge 1.5$ | **+6 pts** | MODERATE | Moderate aggregation point. |
| $\text{Unique Senders} \ge 2$ | **+3 pts** | LOW | Slight counterparty concentration. |
| $\text{Unique Senders} \le 1$ | **0 pts** | NONE | 1-to-1 or isolated relationship. |

#### Rule 3.2: Rapid Dispersal / Fan-Out
Measures outbound fragmentation of funds:
$$\text{Fan-Out Ratio} = \frac{\text{Unique Receivers}}{\text{Unique Senders} + 1.0}$$

| Condition | Points Awarded | Severity | Investigative Reasoning |
| :--- | :---: | :---: | :--- |
| $\text{Unique Receivers} \ge 4$ **AND** $\text{Fan-Out} \ge 2.5$ **AND** $\text{Forwarding Ratio} \ge 70\%$ | **+5 pts** | HIGH | Dispersal hub smurfing consolidated funds to multiple downline mules. |
| $\text{Unique Receivers} \ge 3$ **AND** $\text{Fan-Out} \ge 1.5$ | **+2 pts** | LOW | Moderate outward dispersal. |
| Otherwise | **0 pts** | NONE | Standard outbound fan-out. |

---

### Dimension 4: Network Contagion & Topology
- **Maximum Dimension Weight**: 25 Points
- **Regulatory Typology**: Criminal syndicates operate in clusters. An account transacting directly with already-flagged entities or embedded within a deep multi-hop layering chain has high network complicity.

#### Rule 4.1: Direct Exposure to High-Risk Counterparties (Contagion)
Evaluated during **Pass 2** of the scoring engine using **Pass 1 preliminary scores** ($> 50.0$ pts):
$$\text{Suspicious Neighbors} = \{ u \in \text{Pred}(v) \cup \text{Succ}(v) \mid \text{Pass1Score}(u) \ge 50.0 \}$$

| Condition | Points Awarded | Severity | Investigative Reasoning |
| :--- | :---: | :---: | :--- |
| $|\text{Suspicious Neighbors}| \ge 2$ | **+12 pts** | CRITICAL | Direct connectivity to multiple high-risk/flagged entities in the syndicate. |
| $|\text{Suspicious Neighbors}| = 1$ | **+6 pts** | MODERATE | 1-hop direct connection to a known high-risk counterparty. |
| $|\text{Suspicious Neighbors}| = 0$ | **0 pts** | NONE | Transacting exclusively with clean accounts. |

#### Rule 4.2: Layering Chain Depth
Measures the number of successive, time-respecting forwarding hops feeding into this account:
$$\text{Layering Depth} \in [0, 6]$$

| Condition | Points Awarded | Severity | Investigative Reasoning |
| :--- | :---: | :---: | :--- |
| $\text{Layering Depth} \ge 3\text{ hops}$ | **+8 pts** | CRITICAL | Embedded deep in a multi-hop laundering chain to obscure fund origin. |
| $\text{Layering Depth} = 2\text{ hops}$ | **+4 pts** | MODERATE | Intermediate layering conduit. |
| $\text{Layering Depth} \le 1$ | **0 pts** | NONE | Origin or baseline entity. |

#### Rule 4.3: Network Betweenness Centrality
Quantifies the account's role as a shortest-path topological routing bridge:
$$C_B(v) = \sum_{s \neq v \neq t} \frac{\sigma_{st}(v)}{\sigma_{st}}$$

| Condition | Points Awarded | Severity | Investigative Reasoning |
| :--- | :---: | :---: | :--- |
| $C_B \ge 0.15$ | **+5 pts** | HIGH | Strategic bridge / chokepoint intermediary channeling transfers across clusters. |
| $0.05 \le C_B < 0.15$ | **+2 pts** | MODERATE | Moderate routing presence. |
| $C_B < 0.05$ | **0 pts** | NONE | Peripheral retail node. |

---

### Dimension 5: Circular Flow Patterns (Round-Tripping)
- **Maximum Dimension Weight**: 10 Points
- **Regulatory Typology**: Circular transaction loops ($A \to B \to C \to A$) are explicit signatures of round-tripping money laundering used to disguise the ultimate source of wealth or artificially fabricate commercial transactions.

#### Rule 5.1: Participation in Directed Cycle
Detected using NetworkX cycle algorithms on 2-cycles and 3-cycles:

| Condition | Points Awarded | Severity | Investigative Reasoning |
| :--- | :---: | :---: | :--- |
| $\text{Cycle Count} \ge 1$ | **+10 pts** | CRITICAL | Explicit participation in directed money loops (round-tripping). |
| $\text{Cycle Count} = 0$ | **0 pts** | NONE | Clean acyclic fund movement. |

---

### Dimension 6: Customer Context & Verifiable GST Mitigation
- **Dimension Weight**: Base +5 Points Penalty / **-10 Points Mitigating Credit**
- **Regulatory & Business Justification**:
  In modern payment systems (e.g., India's UPI), legitimate merchants (grocery stores, retail outlets, e-commerce vendors) receive hundreds of incoming payments daily. **Treating high fan-in alone as fraud creates devastating false positive rates for banks.**
  An entity possessing an **Active Goods and Services Tax Identification Number (GSTIN)** has:
  1. Undergone government PAN, biometric, and banking verification.
  2. A physical registered commercial premises subject to state audits.
  3. Mandatory monthly tax filings (GSTR-1, GSTR-3B) and e-way bill generation.
  4. Legal accountability and clear commercial justification for accepting numerous third-party payments.

#### Mitigating Rule 6.1: Active GST Registered Entity Mitigation
| Condition | Points Awarded | Severity | Investigative Reasoning |
| :--- | :---: | :---: | :--- |
| **Active GST Registered Merchant** (and acyclic flow, no extreme rapid drain) | **-10 pts** | CREDIT | Verified commercial tax registration and legal standing; strongly mitigates merchant fan-in false positives. |
| **Active GST Merchant** (but exhibits circular flow or $> 95\%$ rapid drain) | **-5 pts** | CREDIT | Tax-registered business, but elevated transactional risk partially overrides tax mitigation. |
| Individual / Non-GST Account | **0 pts** | NONE | Standard retail account profile. |

#### Mitigating Rule 6.2: Longitudinal Account Tenure
| Condition | Points Awarded | Severity | Investigative Reasoning |
| :--- | :---: | :---: | :--- |
| $\text{Account Age} \ge 365\text{ days}$ | **-5 pts** | CREDIT | Mature account tenure with established baseline history. |
| $\text{Account Age} < 365\text{ days}$ | **0 pts** | NONE | Standard or newer account. |

#### Penalty Rule 6.3: New Account High-Volume Anomaly (Burner Mule)
| Condition | Points Awarded | Severity | Investigative Reasoning |
| :--- | :---: | :---: | :--- |
| $\text{Account Age} < 30\text{ days}$ **AND** $\text{Total Volume} > ₹50,000$ | **+5 pts** | HIGH | Disposable burner mule pattern: newly opened account suddenly handling large turnover. |
| Otherwise | **0 pts** | NONE | Normal volume for account maturity. |

---

## 4. Multi-Pass Scoring Algorithm (Preventing Circular Dependency)

To avoid circular feedback loops where Account A's score depends on Account B's score and vice versa:

```python
# Pass 1: Compute intrinsic behavioral & structural factors
for account in accounts:
    pass1_score[account] = sum(
        pass_through_points(account),
        temporal_anomaly_points(account),
        counterparty_anomaly_points(account),
        intrinsic_graph_points(account),  # Layering + Centrality
        circular_flow_points(account),
        gst_mitigation_credit(account),
        maturity_credit(account),
        burner_account_penalty(account)
    )

# Pass 2: Ingest Pass 1 neighbor risks to compute network contagion
for account in accounts:
    contagion_points[account] = evaluate_neighbors(
        account.neighbors, pass1_scores
    )
    final_rule_score[account] = clamp(pass1_score[account] + contagion_points[account], 0, 100)
```

---

## 5. Machine Learning Integration (XGBoost 28-D Classifier)

The backend features an account-level **XGBClassifier** trained on 28 structured behavioral and graph features:
- **Model File**: `ML/mule_xgb_model.json`
- **Output**: `mule_probability ∈ [0.0, 1.0]` and `ml_score = mule_probability * 100`

### Zero-Drift 28 Features Schema:
```json
[
  "incoming_count", "outgoing_count", "incoming_amount", "outgoing_amount",
  "unique_senders", "unique_receivers", "in_degree", "out_degree",
  "weighted_in_degree", "weighted_out_degree", "fan_in", "fan_out",
  "forwarding_ratio", "rapid_forwarding_ratio", "median_holding_time",
  "average_holding_time", "transaction_velocity", "amount_retention_ratio",
  "account_transaction_count", "average_transaction_amount",
  "median_transaction_amount", "max_transaction_amount", "account_age_days",
  "graph_degree", "betweenness_centrality", "pagerank", "cycle_count",
  "layering_depth"
]
```

---

## 6. Hybrid Risk Fusion & Risk Classification Matrix

The hybrid score combines deterministic explainability with statistical pattern discovery:
$$\text{Final Score} = \alpha \cdot \text{Rule Score} + (1 - \alpha) \cdot \text{ML Score}$$
*(Default $\alpha = 0.50$, dynamically tunable via `POST /api/config/alpha`)*

### Risk Classification Thresholds:

| Score Bracket | Classification | Visual Badge | Status | Automated Recommended Action |
| :---: | :---: | :---: | :---: | :--- |
| **75 – 100** | `CRITICAL` | Crimson Coral (`#ef4444`) | `FLAGGED` | Trigger emergency alert; immediate simulated debit freeze; trace downstream money trail. |
| **50 – 74** | `HIGH` | Crisp Orange (`#f97316`) | `SUSPICIOUS` | Escalate to Senior AML Investigator queue; monitor next-hop candidates. |
| **25 – 49** | `MEDIUM` | Warm Amber (`#f59e0b`) | `NORMAL` | Place on elevated watchlist; periodic transaction sampling. |
| **0 – 24** | `LOW` | Slate Grey (`#475569`) | `NORMAL` | Baseline legitimate retail or GST merchant activity. |

---

## 7. Downstream Money-Trail Tracing & Next-Hop Ranking

### 7.1 Forward Money-Trail Tracing
Given a reported fraud transaction $T_0$, the engine traces the flow through successive hops:
1. Identifies first receiving account $A_1$.
2. Searches for outgoing transactions from $A_1$ occurring within 48 hours of $T_0$ matching similar amounts.
3. Computes the holding time $\Delta t$ at each hop.
4. Attaches each receiving node's hybrid risk score and classification.
5. Continues downstream until a cashout runner or dead-end is reached.

### 7.2 Explainable Next-Hop Ranking
For any active account $A$, the engine ranks candidate next hops using transparent heuristic signals:
$$\text{Next-Hop Score} = 0.35 \cdot \text{Risk}_{\text{receiver}} + 0.25 \cdot \text{Freq}_{\text{norm}} + 0.20 \cdot \text{Recency} + 0.20 \cdot \text{AmtSimilarity}$$

Investigators receive plain-text rationales (e.g., *"Frequent receiver (2 past transfers), recent activity within 3 hours, elevated counterparty risk (82.0 CRITICAL)"*).

---

## 8. Summary of API Endpoints

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/upload` | `POST` | Ingests `transactions.csv` and optional `accounts.csv`; recomputes all scores. |
| `/api/demo/load` | `POST` | 1-Click generation & loading of synthetic banking dataset with scam trails & merchants. |
| `/api/accounts` | `GET` | Paginated account list with search, sorting, and risk filter (`ALL`, `CRITICAL`, etc.). |
| `/api/accounts/{id}/risk` | `GET` | Deep investigation payload: Rule breakdown, ML features, factor evidence, transactions. |
| `/api/accounts/{id}/network` | `GET` | Ego-network subgraph (nodes & links formatted for interactive graph canvas). |
| `/api/accounts/{id}/trail` | `GET` | Forward money trail starting from specified account. |
| `/api/transactions/{id}/trail`| `GET` | Forward money trail starting from reported transaction ID. |
| `/api/accounts/{id}/next-hops`| `GET` | Ranked next-hop predictions with explainability signals. |
| `/api/graph/full` | `GET` | Full network graph topology with risk annotations and transaction volume. |
| `/api/stats` | `GET` | Global KPI strip: total volume, flagged accounts, merchants, critical nodes. |
| `/api/config/alpha` | `POST` | Dynamically updates hybrid weighting parameter $\alpha$. |
