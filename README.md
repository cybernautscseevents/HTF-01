# FinGuard

## Explainable Financial Crime and Money Mule Network Intelligence

FinGuard is a bank-analyst dashboard that helps investigators identify suspicious
accounts, trace transaction networks, understand risk factors, and prioritize
cases for review. It combines deterministic rule-based detection, graph
analytics, XGBoost predictions, and an optional grounded OpenRouter summary
assistant.

FinGuard is designed as an investigation and decision-support system. It does
not make a legal finding that an account holder committed a crime, and it does
not automatically freeze a bank account. It surfaces evidence and recommended
actions for a qualified analyst.

---

## 1. Problem Understanding

### The problem

Financial fraud proceeds are often moved through chains of money mule accounts
before a victim reports the incident. A bank may have the transaction records,
but identifying the complete network quickly is difficult when the data is
large, fragmented, and spread across many accounts.

Mule accounts commonly show patterns such as:

- Receiving money and forwarding most of it shortly afterward
- Rapid pass-through transactions with very short holding times
- Many unrelated senders paying into one account
- One account dispersing money to many receivers
- Multi-hop layering chains
- Circular or round-tripping transfers
- High-risk counterparties connected through the same network

Legitimate GST-registered merchants can also receive payments from many
customers. A simple “many incoming payments” rule can therefore generate false
positives and place legitimate businesses under unnecessary investigation.

### Who is affected?

- Bank fraud and AML investigation teams
- Compliance officers and senior investigators
- Customers whose accounts are used as mule accounts
- Legitimate merchants incorrectly flagged by simplistic rules
- Victims whose money needs to be traced quickly

### Why it matters

Slow or opaque detection increases the time available for money to move through
additional accounts. A useful solution must provide more than a risk label: it
must show why an account was flagged, which accounts are connected, where money
went next, and which cases should receive attention first.

### Current real-world gap

Traditional workflows often depend on manual spreadsheet analysis, isolated
alerts, static thresholds, or separate tools for graph inspection and case
review. These approaches can be slow, difficult to explain, and vulnerable to
false positives around high-volume merchants.

---

## 2. Existing Solutions and the Problem Gap

Common approaches include:

1. **Static transaction rules**  
   Useful for known patterns, but brittle when attackers change timing,
   amounts, or account paths.
2. **Account-level ML alerts**  
   Useful for pattern discovery, but often difficult for investigators to
   explain and validate.
3. **Manual spreadsheet and database queries**  
   Flexible, but slow for multi-hop networks and difficult to use consistently.
4. **Graph visualizations without risk evidence**  
   Show connections but do not always prioritize the most important accounts.

FinGuard closes the gap by combining:

- Explainable 100-point behavioral rules
- XGBoost account-level predictions
- A tunable hybrid score
- Directed transaction-network analysis
- GST-aware false-positive mitigation
- Case IDs and network IDs for repeatable investigation
- Money-trail and next-hop explanations
- A grounded LLM summary that can only use backend evidence

---

## 3. Proposed Solution

### Solution overview

The bank analyst uploads transaction data through the dashboard. The CSV is
sent to the FastAPI backend; it is not parsed directly into the dashboard as
the source of truth. The backend normalizes the data, builds the transaction
graph, extracts behavioral features, runs the rule engine and ML model, fuses
the scores, detects connected networks, and stores the analyzed result in the
local in-memory store. The frontend then fetches the completed analysis.

```text
Bank CSV upload
      |
      v
FastAPI ingestion and schema normalization
      |
      +--> Directed transaction graph
      +--> 28 behavioral and graph features
      +--> 100-point deterministic rule engine
      +--> XGBoost mule prediction
      |
      v
Hybrid risk score and account classification
      |
      +--> Transaction network and case detection
      +--> Money trail and next-hop analysis
      +--> Local in-memory investigation store
      |
      v
Next.js dashboard and investigation UI
      |
      v
Optional grounded OpenRouter summary
```

### Input, processing, and output

**Input**

- Transaction CSV
- Optional account-profile CSV

**Processing**

- Schema alignment and validation
- Timestamp and amount normalization
- Directed graph construction
- Rule-based scoring
- XGBoost inference
- Hybrid score fusion
- Network detection and case generation
- GST context and risk classification

**Output**

- Dashboard KPIs
- Risk-distributed account lists
- High-risk network cases
- Interactive graph investigation
- Money-trail timelines
- Explainable risk factors
- Classification and transfer-policy guidance
- Optional AI-generated evidence summary

### Problem statement to implementation mapping

The project is implemented around the practical workflow of a bank fraud or
AML analyst rather than around an isolated machine-learning prediction. Each
part of the problem is addressed by a specific software component:

| Banking problem | FinGuard implementation | Result for the analyst |
| --- | --- | --- |
| Transaction data is large and difficult to inspect manually | Backend CSV ingestion, normalization, aggregation, and feature extraction | A bank can submit one transaction file instead of manually preparing separate reports |
| Mule accounts move money quickly through multiple accounts | Sent/received timestamps, holding-time analysis, immediate-transfer detection, forwarding ratio, and velocity features | Rapid pass-through behavior becomes measurable evidence |
| Fraud proceeds are distributed across account chains | Directed NetworkX transaction graph and connected-network detection | Investigators can see the relationship between accounts instead of reviewing isolated alerts |
| High-risk accounts need prioritization | 100-point rule engine combined with XGBoost probability | Accounts and networks are ranked for review |
| Black-box predictions are difficult to defend | Rule factors, dimension scores, ML score, top features, and transaction evidence are returned by the API | An analyst can explain why an account was flagged |
| Legitimate merchants may look suspicious because of high volume | GST registration metadata and context-aware mitigation | GST-registered accounts are not automatically treated as mule accounts |
| Analysts need to know where funds moved next | Transaction, account, and case money-trail endpoints | The analyst can follow downstream hops and identify likely conduits |
| Different teams need a stable reference for the same investigation | Generated network IDs and case IDs | Cases can be discussed and revisited consistently |
| Risk levels may need expert correction | Classification board with manual category overrides | An analyst can move an account to a different advisory category without changing the raw evidence |
| A narrative summary can hallucinate unsupported facts | Grounded OpenRouter service receives only backend evidence and uses a strict JSON prompt | AI assists interpretation without becoming the source of truth |
| A new backend should not expose a broken dashboard | Upload-first UI treats an empty analysis store as a valid state | The dashboard shows the upload action until processing finishes |

### What happens after a bank uploads a file?

The browser never treats the raw CSV as the final analytical dataset. The
upload is sent to `POST /api/upload` as multipart form data. The backend owns
the complete analysis lifecycle:

1. **Validation and normalization**  
   Required fields are located using supported aliases. Account identifiers
   are normalized, amounts are converted to numeric values, timestamps are
   parsed, and transfer status and GST values are converted to consistent
   internal values. Invalid input is rejected with an actionable API error.
2. **Transaction preparation**  
   Each row becomes a normalized transaction containing an ID, sender,
   receiver, amount, sent time, received time, status, and GST context.
   Transfer latency is calculated when both timestamps are available.
3. **Graph construction**  
   Accounts become nodes and transfers become directed edges. Edge aggregation
   preserves transaction count and total amount while the original
   transactions remain available for trail reconstruction.
4. **Behavioral feature extraction**  
   The backend calculates incoming and outgoing amounts, counterparty counts,
   fan-in and fan-out, forwarding ratios, holding times, rapid-transfer
   ratios, velocity, centrality, cycles, and layering depth.
5. **Rule evaluation**  
   The deterministic engine scores observable evidence across six dimensions.
   It runs intrinsic account checks first and neighbor/network checks second so
   risk propagation is stable and explainable.
6. **ML inference**  
   The XGBoost service evaluates the engineered account and graph features and
   returns an account-level mule probability. The model is used for
   prioritization, not as an automatic legal or operational decision.
7. **Hybrid fusion and classification**  
   Rule and ML values are combined using the configurable `alpha` weight.
   The resulting score is mapped to Low, Medium, High, or Critical.
8. **Network and case generation**  
   Connected suspicious accounts are grouped into networks. The backend assigns
   network and case identifiers, calculates network-level risk, and indexes
   the transactions needed for later investigation.
9. **Snapshot storage**  
   The completed result is stored in the singleton `DataStore`. The frontend
   only requests dashboard and investigation data after this pipeline has
   completed.
10. **Dashboard hydration**  
    The Next.js application requests one consistent dashboard snapshot and
    renders KPIs, charts, cases, accounts, and graph data from backend results.

### How the implementation solves the core mule-account patterns

#### Rapid pass-through and drain behavior

For an account that receives funds and forwards them quickly, FinGuard compares
incoming and outgoing activity, calculates the forwarded-to-received amount
ratio, and measures the time between receipt and onward transfer. A high ratio
combined with a short holding time increases rule evidence and contributes to
the ML feature vector.

#### Fan-in and fan-out behavior

An account receiving money from many unrelated senders is represented as a
high fan-in node. An account forwarding funds to many receivers is represented
as a high fan-out node. These patterns are not judged alone; they are combined
with timing, amounts, counterparty behavior, GST context, and neighboring
account risk.

#### Layering and multi-hop movement

The directed graph makes it possible to follow a transfer from its origin
through intermediate accounts. Layering depth and graph centrality help
prioritize conduit accounts, while the Money Trail view shows the ordered
transaction hops and receiver risk at each step.

#### Circular movement

Graph cycle detection identifies money that returns to an earlier account.
Circular activity contributes evidence to the rule score and is visible in the
account detail and investigation workflows.

#### Legitimate merchant context

GST registration is carried with the transaction and account summaries. It
provides mitigation for ordinary merchant-like activity, but it does not
override extreme evidence such as rapid drain or circular movement. This
keeps the system useful for banks that serve both consumers and businesses.

### Frontend behavior and analyst workflow

The frontend is intentionally separated into stages:

- **Dashboard:** starts with only CSV ingestion. Before analysis exists, API
  `409` responses are treated as the expected empty state rather than shown as
  application errors. After upload, the dashboard displays the completed
  backend snapshot.
- **Accounts:** provides searchable and filterable account summaries, risk
  scores, rule evidence, ML features, GST status, and recent transactions.
- **Investigate:** renders the directed graph, supports account selection and
  investigation scenarios, and highlights only the active simulation hop while
  dimming unrelated activity.
- **Money Trail:** accepts transaction IDs, case IDs, or account IDs and
  reconstructs ordered downstream movement using backend indexes.
- **Classification:** groups accounts into the four advisory categories and
  permits a manual override through a dropdown or drag-and-drop interaction.
- **AI summary:** is available only after backend analysis. It summarizes the
  evidence payload and returns limitations when evidence is incomplete.

The frontend therefore acts as an analyst interface, not as a second copy of
the risk engine. This prevents inconsistent scores caused by parsing or
predicting directly in the browser.

### Example of an investigation decision

Suppose account `A100` receives money from several unrelated accounts, forwards
most of it to `B200` within seconds, and is connected to a circular transfer.
The system can:

1. Record the incoming and outgoing transactions.
2. Calculate a high forwarding ratio and immediate-transfer signal.
3. Detect the account's fan-in/fan-out and cycle relationships.
4. Produce rule factors explaining those observations.
5. Add the XGBoost probability and calculate a hybrid score.
6. Place the account and its connected accounts into a network case.
7. Show the case in the dashboard and graph.
8. Let the analyst open the trail to inspect the next hops.
9. Recommend the appropriate advisory category.
10. Allow the analyst to override the category if additional bank context
    justifies it.

This is an investigation recommendation flow. The prototype does not
automatically freeze accounts, deny transfers, accuse customers, or replace
the bank's compliance approval process.

---

## 4. Innovation and Unique Value Proposition

### What is improved?

FinGuard does not treat a risk score as a black box. Every account can be
reviewed using the underlying rule dimensions, ML score, behavioral metrics,
connected accounts, and transaction trail.

### Unique value proposition

> **One backend pipeline turns raw bank transactions into explainable,
> network-aware, GST-conscious investigation evidence.**

Key differentiators:

- Rules and ML are shown together rather than competing as separate alerts.
- The graph connects account risk to actual transaction movement.
- Network cases receive stable case IDs such as `CAS-2026-002`.
- Transaction networks can be searched using transaction IDs or case IDs.
- GST mitigation reduces false positives for legitimate merchants.
- Critical accounts are advised for investigation or freezing; the prototype
  does not silently freeze them.
- The optional LLM is grounded in computed backend evidence and is instructed
  not to invent facts.

---

## 5. How the Solution Works

### Complete analyst workflow

1. Open the Dashboard.
2. Upload the transaction CSV.
3. Wait while the backend completes parsing, graph construction, rule scoring,
   and ML inference.
4. Review the dashboard KPIs, risk distribution, recent cases, and top
   accounts.
5. Open Accounts to inspect rule factors, ML features, GST status, and
   transaction history.
6. Open Investigate to inspect the directed network graph.
7. Select a node or a quick scenario such as rapid drain, fan-in, circular
   loop, or GST merchant credit.
8. Run the simulation to highlight one transaction hop while dimming unrelated
   graph data.
9. Load Network Details and search by transaction ID or case ID to view the
   ordered money trail.
10. Use Classification to review risk groups and manually move an account to a
    different advisory category when an investigator has additional context.
11. Generate the optional AI summary after the dataset has been analyzed.

### Risk-policy guidance

The Classification page communicates the prototype's advisory transfer policy:

| Classification | Score | Advisory policy |
| --- | ---: | --- |
| Low | `< 25` | Transfers allowed |
| Medium | `25–49` | Transfers up to ₹10,000 |
| High | `50–74` | Transfers up to ₹5,000 |
| Critical | `75–100` | Freeze recommended for investigation |

These are recommendations for analyst review, not automatic account actions.

---

## 6. Technology Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Recharts for dashboard charts
- Cytoscape.js and `cytoscape-fcose` for network visualization
- Lucide React icons

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic
- Pandas and NumPy
- NetworkX
- In-memory `DataStore`

### AI and ML

- XGBoost account-level mule classifier
- 28 behavioral and graph features
- Optional OpenRouter chat-completions integration
- Temperature-zero, JSON-structured, evidence-only LLM prompt

### Data and external services

- CSV batch ingestion
- Local in-memory store for the current analyzed dataset
- OpenRouter API for the optional narrative summary

The current prototype intentionally avoids requiring a database. Restarting
the backend clears the uploaded dataset, network cases, and manual
classification overrides.

---

## 7. System Architecture

```text
                           +----------------------+
                           |  Next.js Analyst UI  |
                           | Dashboard / Graph   |
                           +----------+-----------+
                                      |
                                      | REST/JSON
                                      v
                           +----------------------+
                           |    FastAPI Backend   |
                           | Upload and API routes|
                           +----------+-----------+
                                      |
             +------------------------+------------------------+
             |                        |                        |
             v                        v                        v
       CSV Parser              Graph Engine              DataStore
       normalization           NetworkX graph             snapshots
             |                        |                        |
             +------------------------+------------------------+
                                      |
                    +-----------------+-----------------+
                    |                                   |
                    v                                   v
              Rule Engine                         ML Service
            100-point evidence                 XGBoost probability
                    |                                   |
                    +-----------------+-----------------+
                                      v
                              Hybrid risk fusion
                                      |
                     +----------------+----------------+
                     |                                 |
                     v                                 v
              Network/case APIs                 Optional LLM
              trails and next hops              OpenRouter summary
```

### Core API endpoints

| Endpoint | Method | Purpose |
| --- | :---: | --- |
| `/api/upload` | POST | Analyze transaction and optional account CSV files |
| `/api/demo/load` | POST | Load synthetic banking data |
| `/api/dashboard` | GET | Return one dashboard snapshot |
| `/api/stats` | GET | Return global KPIs |
| `/api/accounts` | GET | Search, filter, sort, and paginate accounts |
| `/api/accounts/{id}/risk` | GET | Return detailed risk evidence |
| `/api/accounts/{id}/network` | GET | Return an account ego-network |
| `/api/accounts/{id}/trail` | GET | Trace downstream movement from an account |
| `/api/accounts/{id}/next-hops` | GET | Rank likely downstream accounts |
| `/api/accounts/{id}/classification` | PATCH | Store a manual classification override |
| `/api/transactions/{id}/trail` | GET | Trace a transaction money trail |
| `/api/cases/{id}/trail` | GET | Retrieve a case's ordered network trail |
| `/api/graph/full` | GET | Return the investigation graph |
| `/api/analysis/summary` | POST | Generate a grounded OpenRouter summary |

---

## 8. Technical Feasibility and Implementation

### Implemented prototype

- Upload-first dashboard flow
- Backend-driven analysis lifecycle
- CSV schema aliases and validation
- Amount, timestamp, transfer-status, and GST support
- Directed transaction graph
- Rule and ML risk scoring
- Network IDs and case IDs
- Money-trail reconstruction
- Critical-risk mule promotion for critical networks
- Risk Classification board with manual overrides
- Full-height collapsible sidebar
- Scenario simulation with active-hop highlighting
- Grounded LLM summary endpoint and dashboard card

### CSV contract

The recommended transaction CSV column order is:

```csv
transaction_id,sender_account_no,receiver_account_no,time_sent,time_received,amount,transfer_status,gst_registered
```

The parser also accepts documented aliases for sender, receiver, timestamps,
amount, status, and GST fields. `amount` is required for risk and network
analysis. `gst_registered` should be `yes` or `no` (boolean equivalents are
also normalized).

### Rule-engine scoring model

The deterministic engine evaluates six independent dimensions:

1. Pass-through behavior and capital drainage — up to 25 points
2. Temporal anomaly and rapid forwarding — up to 20 points
3. Counterparty anomaly and fan-in/fan-out topology — up to 15 points
4. Network contagion and topology — up to 25 points
5. Circular flow patterns — up to 10 points
6. Customer context and GST mitigation

The raw score is clamped to `0–100`. GST registration provides a mitigating
credit when the account does not exhibit extreme rapid drain or circular-flow
behavior.

### Multi-pass rule evaluation

The engine first evaluates intrinsic account behavior and topology. It then
uses those first-pass results to evaluate neighbor contagion. This prevents
unstable circular dependencies where each account's score depends directly on
the other account's unfinished score.

### ML features

The XGBoost model uses 28 features including:

- Incoming and outgoing counts and amounts
- Unique senders and receivers
- In-degree and out-degree
- Weighted graph degree
- Fan-in and fan-out
- Forwarding and rapid-forwarding ratios
- Median and average holding time
- Transaction velocity
- Amount retention
- Account age and transaction amount statistics
- Betweenness centrality and PageRank
- Cycle count and layering depth

### Hybrid score

```text
final_score = alpha * rule_score + (1 - alpha) * ml_score
```

The default `alpha` is `0.50`, giving equal weight to explainable rules and
the ML model. The weighting is designed to be tunable for future calibration.

### AI summary grounding

The optional LLM receives only a backend-created evidence payload containing
dashboard statistics, network cases, account scores, rule factors, ML scores,
transaction aggregates, timing signals, and GST metadata.

The system prompt instructs the model to:

- Use only supplied JSON evidence
- Never invent accounts, transactions, scores, dates, or amounts
- Treat computed rule and ML values as authoritative
- Say when evidence is unavailable
- Avoid legal or criminal conclusions
- Separate observed evidence from interpretation
- Return a fixed JSON shape

The OpenRouter key is loaded from `backend/.env` and is never exposed to the
frontend.

### Development strategy

For a short hackathon build, the implementation prioritizes:

1. A deterministic and reproducible backend pipeline
2. A usable investigator workflow
3. Explainable evidence over opaque automation
4. A local, dependency-light prototype
5. Clear extension points for persistent storage and production deployment

### Major technical challenges and mitigations

| Challenge | Mitigation |
| --- | --- |
| False positives for high-volume merchants | GST-aware mitigation and context fields |
| Large connected transaction networks | Graph aggregation, subgraphs, and case indexing |
| Opaque ML predictions | Rule breakdown, feature evidence, and hybrid scoring |
| Unstable network scoring | Two-pass scoring and bounded thresholds |
| LLM hallucination risk | Backend-only evidence, strict prompt, JSON response, temperature 0 |
| Accidental destructive action | Advisory transfer policy; no automatic freeze |
| Dataset loss on restart | Explicit prototype limitation; database is a future scope item |

---

## 9. Future Scope

- Persistent PostgreSQL or Azure-managed database storage
- Authentication, tenant isolation, and bank-level access controls
- Streaming transaction ingestion instead of CSV-only batch ingestion
- Model monitoring, calibration, drift detection, and retraining workflows
- Human feedback loops for analyst-approved classifications
- Case notes, audit trails, and evidence export
- Integrations with bank AML systems and fraud-reporting workflows
- Role-based approvals for account restrictions
- Larger-scale graph storage and distributed processing
- Multilingual analyst summaries
- Retrieval-augmented access to approved internal policy documents
- Production deployment on Azure with managed identity and secrets management

---

## 10. Conclusion

FinGuard converts raw transaction data into a connected, explainable view of
financial crime risk.

The three strongest benefits are:

1. **Faster investigation** through automatic network detection and money trails
2. **Better decisions** through rule, ML, graph, GST, and transaction evidence
3. **Safer automation** through advisory actions and grounded AI summaries

The long-term vision is an investigator-centered platform that helps banks
detect mule networks earlier, reduce false positives, and explain every alert
with evidence that can be reviewed by a human.

---

## Hackatopia 2K26 Presentation Checklist Alignment

The supplied `Hackatopia_Final_Presentation_Final.pdf` defines the expected
structure for the final national-level hackathon presentation. FinGuard's
README and demo can be organized as follows:

1. **Problem Understanding**  
   Explain mule networks, affected bank teams and victims, the urgency of
   tracing money, and the merchant false-positive problem.
2. **Existing Solutions and Problem Gap**  
   Contrast static rules, isolated ML alerts, spreadsheets, and disconnected
   graph tools with FinGuard's unified evidence pipeline.
3. **Proposed Solution**  
   Present the CSV → backend → rules/ML/graph → local store → dashboard flow.
4. **Innovation and Unique Value Proposition**  
   Emphasize hybrid explainability, GST mitigation, network case IDs, and
   grounded AI summaries.
5. **How the Solution Works**  
   Demonstrate upload, analysis, dashboard review, graph investigation,
   simulation, money trail, classification, and AI summary generation.
6. **Technology Stack**  
   Cover Next.js, React, TypeScript, FastAPI, Pandas, NetworkX, XGBoost,
   Cytoscape.js, and OpenRouter.
7. **System Architecture**  
   Use the architecture diagram in this README and show how components
   communicate.
8. **Technical Feasibility and Implementation**  
   Explain the working prototype, 24-hour prioritization, rule/ML pipeline,
   local-store tradeoff, and fallback behavior.
9. **Future Scope**  
   Present persistent storage, streaming ingestion, model monitoring,
   integrations, access control, and cloud deployment.
10. **Conclusion**  
    Close with the three benefits: faster investigation, better evidence, and
    safer analyst-guided automation.

### Judging criteria mapping

| Hackatopia criterion | Maximum | FinGuard evidence |
| --- | ---: | --- |
| Problem and solution relevance | 15 | Directly addresses bank AML and money-mule investigation |
| Innovation and originality | 20 | Hybrid rules, ML, graph networks, GST mitigation, grounded LLM |
| Technical excellence and implementation | 25 | Working frontend, FastAPI backend, ML pipeline, graph APIs |
| Real-world impact and scalability | 15 | Faster tracing, reduced false positives, future streaming/database path |
| Live demo and solution effectiveness | 15 | Upload, dashboard, graph, simulation, money trail, classification |
| Pitch and Q&A / defense | 10 | Explainable architecture, scoring formula, limitations, and safeguards |
| **Total** | **100** | |

---

## Project Structure

```text
finguard2/
├── backend/
│   ├── app/
│   │   ├── api/              # FastAPI routes
│   │   ├── core/             # Configuration and in-memory DataStore
│   │   ├── data/             # CSV parsing and synthetic data
│   │   ├── graph/            # Network and money-trail analysis
│   │   ├── llm/              # Grounded OpenRouter summary service
│   │   ├── ml/               # Features and XGBoost inference
│   │   └── rules/             # Deterministic scoring engine
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── app/                  # Next.js routes
│   ├── components/           # Dashboard, graph, timeline, and layout UI
│   ├── lib/api.ts            # Typed backend API client
│   └── package.json
├── ML/                       # XGBoost model artifacts
└── RULE_ENGINE_SPECIFICATION.md
```

---

## Getting Started

### Backend

```powershell
Set-Location C:\Users\HP\Desktop\projects\hackathon\finguard2\backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

The API is available at:

- http://127.0.0.1:8000
- http://127.0.0.1:8000/docs

### Optional OpenRouter configuration

```powershell
Set-Location C:\Users\HP\Desktop\projects\hackathon\finguard2\backend
Copy-Item .env.example .env
notepad .env
```

Set:

```env
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

Restart the backend after changing `.env`. Never commit `backend/.env`.

### Frontend

```powershell
Set-Location C:\Users\HP\Desktop\projects\hackathon\finguard2\frontend
npm install
npm run dev
```

Open http://localhost:3000/dashboard.

### Production build

```powershell
Set-Location C:\Users\HP\Desktop\projects\hackathon\finguard2\frontend
npm run build
npm start
```

---

## Important Prototype Limitations

- The analyzed dataset is stored in memory and is cleared when the backend
  restarts.
- The current upload flow is batch-oriented rather than streaming.
- The ML output supports investigation prioritization and is not a standalone
  decision.
- The LLM summary is optional and depends on a valid OpenRouter key and
  network access.
- No account is automatically frozen by the prototype.
- Production use would require security review, authentication, audit logs,
  persistent storage, model governance, and regulatory approval.

---

## Related Documentation

- [Rule Engine Specification](./RULE_ENGINE_SPECIFICATION.md)
- [Backend](./backend/)
- [Frontend](./frontend/)
