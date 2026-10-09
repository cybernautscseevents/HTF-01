import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple, Optional
from collections import defaultdict
from app.graph.graph_engine import GraphEngine
from app.rules.rule_definitions import MAX_WEIGHTS, RULE_DESCRIPTIONS


class RuleEngine:
    def __init__(self):
        pass

    def evaluate_all_accounts(
        self,
        features_df: pd.DataFrame,
        accounts_df: pd.DataFrame,
        graph_engine: GraphEngine
    ) -> Dict[str, Dict[str, Any]]:
        """
        Executes two-pass deterministic risk scoring on all accounts.
        Pass 1: Computes intrinsic behavioural and graph metrics.
        Pass 2: Incorporates network contagion from high-risk neighbours.
        """
        acc_meta = {}
        if not accounts_df.empty:
            for _, row in accounts_df.iterrows():
                acc_meta[str(row["account_id"])] = row.to_dict()

        features_dict = {}
        for _, row in features_df.iterrows():
            features_dict[str(row["account_id"])] = row.to_dict()

        all_accounts = list(features_dict.keys())

        # ==========================================
        # PASS 1: Intrinsic Account Scoring
        # ==========================================
        pass1_scores: Dict[str, float] = {}
        pass1_evidence: Dict[str, Dict[str, Any]] = {}

        for acc in all_accounts:
            f = features_dict[acc]
            meta = acc_meta.get(acc, {})
            score, ev = self._evaluate_account_pass1(acc, f, meta, graph_engine)
            pass1_scores[acc] = score
            pass1_evidence[acc] = ev

        # ==========================================
        # PASS 2: Contagion & Final Aggregation
        # ==========================================
        final_results: Dict[str, Dict[str, Any]] = {}

        for acc in all_accounts:
            f = features_dict[acc]
            meta = acc_meta.get(acc, {})
            ev = pass1_evidence[acc]
            
            # Evaluate Network Contagion using Pass 1 neighbor risks
            contagion_pts, contagion_factor = self._evaluate_network_contagion(
                acc, graph_engine, pass1_scores
            )
            
            # Combine dimension points
            ev["factors"].append(contagion_factor)
            ev["dimension_scores"]["network_topology"] += contagion_pts
            
            # Total score calculation
            raw_total = sum(ev["dimension_scores"].values())
            clamped_score = min(max(raw_total, 0.0), 100.0)
            
            # Risk Classification
            if clamped_score >= 75.0:
                classification = "CRITICAL"
                is_flagged = True
            elif clamped_score >= 50.0:
                classification = "HIGH"
                is_flagged = True
            elif clamped_score >= 25.0:
                classification = "MEDIUM"
                is_flagged = False
            else:
                classification = "LOW"
                is_flagged = False

            # Top investigative reasons
            sorted_factors = sorted(
                [fac for fac in ev["factors"] if fac["points"] != 0],
                key=lambda x: abs(x["points"]),
                reverse=True
            )
            top_reasons = [f"{f['name']}: {f['detail']} ({f['points']:+d} pts)" for f in sorted_factors[:4]]
            if not top_reasons:
                top_reasons = ["Normal retail/commercial transaction profile with no anomalous markers."]

            final_results[acc] = {
                "account_id": acc,
                "rule_score": round(clamped_score, 1),
                "raw_score": round(raw_total, 1),
                "classification": classification,
                "is_flagged": is_flagged,
                "dimension_scores": {k: round(v, 1) for k, v in ev["dimension_scores"].items()},
                "factors": ev["factors"],
                "top_reasons": top_reasons,
                "account_type": meta.get("account_type", "individual"),
                "is_gst_registered": bool(meta.get("is_gst_registered", False)),
            }

        return final_results

    def _evaluate_account_pass1(
        self,
        account_id: str,
        f: Dict[str, Any],
        meta: Dict[str, Any],
        graph_engine: GraphEngine
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Pass 1: Computes dimensions without neighbor contagion.
        """
        factors = []
        dim_scores = defaultdict(float)

        # ------------------------------------------------------------------
        # 1. Pass-Through Behaviour (Max 25 pts)
        # ------------------------------------------------------------------
        # 1.1 Forwarding Ratio (Max 15 pts)
        fwd_ratio = float(f.get("forwarding_ratio", 0.0))
        fwd_pct = fwd_ratio * 100.0
        if fwd_ratio >= 0.92:
            fwd_pts = 15.0
            sev = "CRITICAL"
            fwd_detail = f"High drain: {fwd_pct:.1f}% of received capital forwarded out"
        elif fwd_ratio >= 0.80:
            fwd_pts = 10.0
            sev = "HIGH"
            fwd_detail = f"Elevated pass-through: {fwd_pct:.1f}% forwarded out"
        elif fwd_ratio >= 0.65:
            fwd_pts = 5.0
            sev = "MODERATE"
            fwd_detail = f"Moderate pass-through: {fwd_pct:.1f}% forwarded out"
        else:
            fwd_pts = 0.0
            sev = "NONE"
            fwd_detail = f"Normal retention: {fwd_pct:.1f}% forwarded"

        factors.append({
            "key": "forwarding_ratio",
            "name": RULE_DESCRIPTIONS["forwarding_ratio"]["name"],
            "dimension": "pass_through",
            "points": int(fwd_pts),
            "severity": sev,
            "raw_value": round(fwd_ratio, 3),
            "detail": fwd_detail
        })
        dim_scores["pass_through"] += fwd_pts

        # 1.2 Depleted Retention Ratio (Max 10 pts)
        ret_ratio = float(f.get("amount_retention_ratio", 0.0))
        if f.get("incoming_amount", 0) > 0:
            if ret_ratio <= 0.05:
                ret_pts = 10.0
                sev = "HIGH"
                ret_detail = f"Near-zero capital retention ({ret_ratio*100.0:.1f}% retained)"
            elif ret_ratio <= 0.15:
                ret_pts = 5.0
                sev = "MODERATE"
                ret_detail = f"Low capital retention ({ret_ratio*100.0:.1f}% retained)"
            else:
                ret_pts = 0.0
                sev = "NONE"
                ret_detail = f"Normal capital retention ({ret_ratio*100.0:.1f}% retained)"
        else:
            ret_pts = 0.0
            sev = "NONE"
            ret_detail = "No incoming transactions recorded"

        factors.append({
            "key": "fund_retention",
            "name": RULE_DESCRIPTIONS["fund_retention"]["name"],
            "dimension": "pass_through",
            "points": int(ret_pts),
            "severity": sev,
            "raw_value": round(ret_ratio, 3),
            "detail": ret_detail
        })
        dim_scores["pass_through"] += ret_pts

        # ------------------------------------------------------------------
        # 2. Temporal Anomaly & Rapid Forwarding (Max 20 pts)
        # ------------------------------------------------------------------
        # 2.1 Rapid Forwarding & Holding Time (Max 15 pts)
        rapid_ratio = float(f.get("rapid_forwarding_ratio", 0.0))
        med_ht_hours = float(f.get("median_holding_time", 168.0))
        med_ht_seconds = med_ht_hours * 3600.0
        out_count = int(f.get("outgoing_count", 0))

        if out_count > 0 and (med_ht_seconds < 120.0 or (rapid_ratio >= 0.70 and out_count >= 2)):
            rapid_pts = 15.0
            sev = "CRITICAL"
            rapid_detail = f"Ultra-rapid drain: median holding time {med_ht_seconds:.0f}s ({rapid_ratio*100.0:.1f}% rapid transfers)"
        elif out_count > 0 and (med_ht_seconds < 300.0 or rapid_ratio >= 0.40):
            rapid_pts = 10.0
            sev = "HIGH"
            rapid_detail = f"Rapid drain: median holding time {med_ht_seconds/60.0:.1f}m ({rapid_ratio*100.0:.1f}% rapid transfers)"
        elif out_count > 0 and med_ht_hours <= 1.0:
            rapid_pts = 5.0
            sev = "MODERATE"
            rapid_detail = f"Short holding time: median {med_ht_hours:.2f} hours"
        else:
            rapid_pts = 0.0
            sev = "NONE"
            rapid_detail = f"Normal holding period: median {med_ht_hours:.1f} hours"

        factors.append({
            "key": "rapid_forwarding",
            "name": RULE_DESCRIPTIONS["rapid_forwarding"]["name"],
            "dimension": "temporal_anomaly",
            "points": int(rapid_pts),
            "severity": sev,
            "raw_value": round(med_ht_hours, 2),
            "detail": rapid_detail
        })
        dim_scores["temporal_anomaly"] += rapid_pts

        # 2.2 Transaction Velocity (Max 5 pts)
        velocity = float(f.get("transaction_velocity", 0.0))
        if velocity >= 8.0:
            vel_pts = 5.0
            sev = "HIGH"
            vel_detail = f"High velocity burst: {velocity:.1f} txns/day"
        elif velocity >= 4.0:
            vel_pts = 3.0
            sev = "MODERATE"
            vel_detail = f"Elevated velocity: {velocity:.1f} txns/day"
        else:
            vel_pts = 0.0
            sev = "NONE"
            vel_detail = f"Normal activity velocity: {velocity:.1f} txns/day"

        factors.append({
            "key": "transaction_velocity",
            "name": RULE_DESCRIPTIONS["transaction_velocity"]["name"],
            "dimension": "temporal_anomaly",
            "points": int(vel_pts),
            "severity": sev,
            "raw_value": round(velocity, 2),
            "detail": vel_detail
        })
        dim_scores["temporal_anomaly"] += vel_pts

        # ------------------------------------------------------------------
        # 3. Counterparty Anomaly & Topology (Max 15 pts)
        # ------------------------------------------------------------------
        # 3.1 Funneling / Fan-In (Max 10 pts)
        unique_senders = int(f.get("unique_senders", 0))
        fan_in = float(f.get("fan_in", 0.0))
        if unique_senders >= 5 and fan_in >= 2.5:
            fan_in_pts = 10.0
            sev = "HIGH"
            fan_in_detail = f"Funnel node: {unique_senders} unique senders (Fan-in ratio {fan_in:.1f})"
        elif unique_senders >= 3 and fan_in >= 1.5:
            fan_in_pts = 6.0
            sev = "MODERATE"
            fan_in_detail = f"Aggregation point: {unique_senders} unique senders"
        elif unique_senders >= 2:
            fan_in_pts = 3.0
            sev = "LOW"
            fan_in_detail = f"Multiple senders: {unique_senders} unique senders"
        else:
            fan_in_pts = 0.0
            sev = "NONE"
            fan_in_detail = f"Isolated counterparty: {unique_senders} sender(s)"

        factors.append({
            "key": "fan_in_funnel",
            "name": RULE_DESCRIPTIONS["fan_in_funnel"]["name"],
            "dimension": "counterparty_anomaly",
            "points": int(fan_in_pts),
            "severity": sev,
            "raw_value": unique_senders,
            "detail": fan_in_detail
        })
        dim_scores["counterparty_anomaly"] += fan_in_pts

        # 3.2 Fan-Out / Dispersal (Max 5 pts)
        unique_receivers = int(f.get("unique_receivers", 0))
        fan_out = float(f.get("fan_out", 0.0))
        if unique_receivers >= 4 and fan_out >= 2.5 and fwd_ratio >= 0.70:
            fan_out_pts = 5.0
            sev = "HIGH"
            fan_out_detail = f"Rapid dispersal hub: {unique_receivers} receivers draining inflows"
        elif unique_receivers >= 3 and fan_out >= 1.5:
            fan_out_pts = 2.0
            sev = "LOW"
            fan_out_detail = f"Dispersal pattern: {unique_receivers} unique receivers"
        else:
            fan_out_pts = 0.0
            sev = "NONE"
            fan_out_detail = f"Standard outbound fan-out: {unique_receivers} receiver(s)"

        factors.append({
            "key": "fan_out_dispersal",
            "name": RULE_DESCRIPTIONS["fan_out_dispersal"]["name"],
            "dimension": "counterparty_anomaly",
            "points": int(fan_out_pts),
            "severity": sev,
            "raw_value": unique_receivers,
            "detail": fan_out_detail
        })
        dim_scores["counterparty_anomaly"] += fan_out_pts

        # ------------------------------------------------------------------
        # 4. Network Topology & Graph Features (Intrinsic part) (Max 13 of 25 pts)
        # ------------------------------------------------------------------
        # 4.1 Layering Depth (Max 8 pts)
        layering = int(f.get("layering_depth", 0))
        if layering >= 3:
            layer_pts = 8.0
            sev = "CRITICAL"
            layer_detail = f"Deep layering chain: depth {layering} consecutive forwarding hops"
        elif layering == 2:
            layer_pts = 4.0
            sev = "MODERATE"
            layer_detail = f"Intermediate hop: depth {layering} in forwarding chain"
        else:
            layer_pts = 0.0
            sev = "NONE"
            layer_detail = f"Shallow/origin hop: depth {layering}"

        factors.append({
            "key": "layering_depth",
            "name": RULE_DESCRIPTIONS["layering_depth"]["name"],
            "dimension": "network_topology",
            "points": int(layer_pts),
            "severity": sev,
            "raw_value": layering,
            "detail": layer_detail
        })
        dim_scores["network_topology"] += layer_pts

        # 4.2 Betweenness Centrality (Max 5 pts)
        betweenness = float(f.get("betweenness_centrality", 0.0))
        if betweenness >= 0.15:
            btw_pts = 5.0
            sev = "HIGH"
            btw_detail = f"Topological bridge: high betweenness centrality ({betweenness:.3f})"
        elif betweenness >= 0.05:
            btw_pts = 2.0
            sev = "MODERATE"
            btw_detail = f"Routing intermediary: betweenness ({betweenness:.3f})"
        else:
            btw_pts = 0.0
            sev = "NONE"
            btw_detail = f"Peripheral node: betweenness ({betweenness:.3f})"

        factors.append({
            "key": "betweenness_centrality",
            "name": RULE_DESCRIPTIONS["betweenness_centrality"]["name"],
            "dimension": "network_topology",
            "points": int(btw_pts),
            "severity": sev,
            "raw_value": round(betweenness, 4),
            "detail": btw_detail
        })
        dim_scores["network_topology"] += btw_pts

        # ------------------------------------------------------------------
        # 5. Circular Flow Patterns (Max 10 pts)
        # ------------------------------------------------------------------
        cycle_count = int(f.get("cycle_count", 0))
        if cycle_count >= 1:
            cycle_pts = 10.0
            sev = "CRITICAL"
            cycle_detail = f"Round-tripping detected: participates in {cycle_count} directed cycle(s)"
        else:
            cycle_pts = 0.0
            sev = "NONE"
            cycle_detail = "Acyclic money flow"

        factors.append({
            "key": "circular_pattern",
            "name": RULE_DESCRIPTIONS["circular_pattern"]["name"],
            "dimension": "circular_flow",
            "points": int(cycle_pts),
            "severity": sev,
            "raw_value": cycle_count,
            "detail": cycle_detail
        })
        dim_scores["circular_flow"] += cycle_pts

        # ------------------------------------------------------------------
        # 6. Customer Context, Verifiability & GST Mitigation (-10 to +5 pts)
        # ------------------------------------------------------------------
        is_gst = bool(meta.get("is_gst_registered", False))
        gst_active = bool(meta.get("gst_active", False))
        age_days = float(meta.get("account_age_days", f.get("account_age_days", 180.0)))
        total_vol = float(f.get("incoming_amount", 0.0)) + float(f.get("outgoing_amount", 0.0))

        # GST Mitigation: Verified tax-registered business reduces false positives on merchants
        if is_gst and gst_active:
            # If the account also has circular flow or > 95% rapid drain, moderate credit
            if cycle_count > 0 or (fwd_ratio >= 0.95 and rapid_pts >= 10):
                gst_pts = -5.0
                gst_detail = "Active GST registered business (-5 pts credit): elevated risk partially overrides tax mitigation"
            else:
                gst_pts = -10.0
                gst_detail = "Active GST registered business (-10 pts credit): verified tax ID & legal accountability mitigates merchant fan-in"
            sev = "CREDIT"
        else:
            gst_pts = 0.0
            sev = "NONE"
            gst_detail = "Standard individual account (No active GST registered profile)"

        factors.append({
            "key": "gst_mitigation",
            "name": RULE_DESCRIPTIONS["gst_mitigation"]["name"],
            "dimension": "context_consistency",
            "points": int(gst_pts),
            "severity": sev,
            "raw_value": 1 if (is_gst and gst_active) else 0,
            "detail": gst_detail
        })
        dim_scores["context_consistency"] += gst_pts

        # Maturity Credit: Accounts older than 1 year with established activity
        if age_days >= 365.0:
            mat_pts = -5.0
            mat_detail = f"Established account tenure: {age_days:.0f} days (-5 pts credit)"
            sev = "CREDIT"
        else:
            mat_pts = 0.0
            mat_detail = f"Account tenure: {age_days:.0f} days"
            sev = "NONE"

        factors.append({
            "key": "maturity_mitigation",
            "name": RULE_DESCRIPTIONS["maturity_mitigation"]["name"],
            "dimension": "context_consistency",
            "points": int(mat_pts),
            "severity": sev,
            "raw_value": age_days,
            "detail": mat_detail
        })
        dim_scores["context_consistency"] += mat_pts

        # New Account Spike Penalty
        if age_days < 30.0 and total_vol > 50000.0:
            spike_pts = 5.0
            spike_detail = f"Disposable burner pattern: new account ({age_days:.0f}d) with high volume (₹{total_vol:,.0f})"
            sev = "HIGH"
        else:
            spike_pts = 0.0
            spike_detail = "No new-account volume anomaly"
            sev = "NONE"

        factors.append({
            "key": "new_account_spike",
            "name": RULE_DESCRIPTIONS["new_account_spike"]["name"],
            "dimension": "context_consistency",
            "points": int(spike_pts),
            "severity": sev,
            "raw_value": total_vol,
            "detail": spike_detail
        })
        dim_scores["context_consistency"] += spike_pts

        pass1_total = sum(dim_scores.values())
        return pass1_total, {"dimension_scores": dim_scores, "factors": factors}

    def _evaluate_network_contagion(
        self,
        account_id: str,
        graph_engine: GraphEngine,
        pass1_scores: Dict[str, float]
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Pass 2: Computes network contagion based on direct neighbor scores from Pass 1.
        Max 12 points for network_topology.
        """
        acc = str(account_id)
        if not graph_engine.simple_graph.has_node(acc):
            return 0.0, {
                "key": "network_contagion",
                "name": RULE_DESCRIPTIONS["network_contagion"]["name"],
                "dimension": "network_topology",
                "points": 0,
                "severity": "NONE",
                "raw_value": 0,
                "detail": "Isolated node; no counterparty connections"
            }

        predecessors = set(graph_engine.simple_graph.predecessors(acc))
        successors = set(graph_engine.simple_graph.successors(acc))
        all_neighbors = predecessors | successors

        suspicious_neighbors = [
            nbr for nbr in all_neighbors if pass1_scores.get(nbr, 0.0) >= 50.0
        ]
        count_suspicious = len(suspicious_neighbors)

        if count_suspicious >= 2:
            pts = 12.0
            sev = "CRITICAL"
            detail = f"High network contagion: transacting with {count_suspicious} high-risk entities ({', '.join(suspicious_neighbors[:3])})"
        elif count_suspicious == 1:
            pts = 6.0
            sev = "MODERATE"
            detail = f"Direct exposure: connected to high-risk entity ({suspicious_neighbors[0]})"
        else:
            pts = 0.0
            sev = "NONE"
            detail = "Transacting exclusively with low-risk counterparties"

        factor = {
            "key": "network_contagion",
            "name": RULE_DESCRIPTIONS["network_contagion"]["name"],
            "dimension": "network_topology",
            "points": int(pts),
            "severity": sev,
            "raw_value": count_suspicious,
            "detail": detail
        }
        return pts, factor
