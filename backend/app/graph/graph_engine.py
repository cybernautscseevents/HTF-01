import networkx as nx
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Set, Tuple
from collections import defaultdict


class GraphEngine:
    def __init__(self):
        self.multi_graph = nx.MultiDiGraph()
        self.simple_graph = nx.DiGraph()
        self.pagerank_scores: Dict[str, float] = {}
        self.betweenness_scores: Dict[str, float] = {}
        self.cycle_counts: Dict[str, int] = {}
        self.layering_depths: Dict[str, int] = {}

    def build_graph(self, txn_df: pd.DataFrame):
        """
        Builds directed MultiDiGraph and DiGraph from transactions.
        """
        self.multi_graph = nx.MultiDiGraph()
        self.simple_graph = nx.DiGraph()

        # Add edges to MultiDiGraph preserving every transaction
        for _, row in txn_df.iterrows():
            if "is_successful" in row and not bool(row["is_successful"]):
                continue
            sender = str(row["sender_id"])
            receiver = str(row["receiver_id"])
            amt = float(row["amount"])
            ts = row["timestamp"]
            txn_id = str(row["transaction_id"])
            channel = str(row.get("channel", "UPI"))

            self.multi_graph.add_node(sender)
            self.multi_graph.add_node(receiver)

            self.multi_graph.add_edge(
                sender,
                receiver,
                transaction_id=txn_id,
                amount=amt,
                timestamp=ts,
                sent_at=row.get("sent_at", ts),
                received_at=row.get("received_at", ts),
                channel=channel
            )

            # Simple graph aggregates amount and count
            if self.simple_graph.has_edge(sender, receiver):
                self.simple_graph[sender][receiver]["amount"] += amt
                self.simple_graph[sender][receiver]["count"] += 1
            else:
                self.simple_graph.add_edge(sender, receiver, amount=amt, count=1)

        self._compute_graph_metrics(txn_df)

    def _compute_graph_metrics(self, txn_df: pd.DataFrame):
        """
        Precomputes PageRank, Betweenness, Cycles, and Layering Depths.
        """
        num_nodes = len(self.simple_graph)
        if num_nodes == 0:
            self.pagerank_scores = {}
            self.betweenness_scores = {}
            self.cycle_counts = {}
            self.layering_depths = {}
            return

        # 1. PageRank with edge weight
        try:
            self.pagerank_scores = nx.pagerank(self.simple_graph, weight="amount", alpha=0.85, max_iter=200)
        except Exception:
            self.pagerank_scores = {n: 1.0 / max(1, num_nodes) for n in self.simple_graph.nodes()}

        # 2. Betweenness Centrality (approximated for speed if large graph)
        try:
            if num_nodes > 400:
                self.betweenness_scores = nx.betweenness_centrality(self.simple_graph, k=min(100, num_nodes), seed=42)
            else:
                self.betweenness_scores = nx.betweenness_centrality(self.simple_graph)
        except Exception:
            self.betweenness_scores = {n: 0.0 for n in self.simple_graph.nodes()}

        # 3. Directed Cycle Counts (2-cycles and 3-cycles)
        self.cycle_counts = defaultdict(int)
        for u in self.simple_graph.nodes():
            successors = set(self.simple_graph.successors(u))
            # 2-cycle: u -> v -> u
            for v in successors:
                if v != u and self.simple_graph.has_edge(v, u):
                    self.cycle_counts[u] += 1
                # 3-cycle: u -> v -> w -> u
                for w in self.simple_graph.successors(v):
                    if w != u and w != v and self.simple_graph.has_edge(w, u):
                        self.cycle_counts[u] += 1
                        
        # 4. Layering Depths (time-respecting incoming path length capped at 6)
        self.layering_depths = self._calculate_layering_depths(txn_df)

    def _calculate_layering_depths(self, txn_df: pd.DataFrame) -> Dict[str, int]:
        """
        Calculates maximum time-respecting forwarding chain depth feeding into each account.
        Capped at 6.
        """
        layering = defaultdict(int)
        if txn_df.empty:
            return layering

        # Sort transactions chronologically
        sorted_txns = txn_df.sort_values("timestamp")
        
        # Track latest incoming hops per account
        # account -> max incoming chain depth observed
        account_depth: Dict[str, int] = defaultdict(int)
        account_last_time: Dict[str, Any] = {}

        for _, row in sorted_txns.iterrows():
            if "is_successful" in row and not bool(row["is_successful"]):
                continue
            sender = str(row["sender_id"])
            receiver = str(row["receiver_id"])
            ts = row["timestamp"]

            sender_depth = account_depth.get(sender, 0)
            # If sender has received money before this timestamp, hop depth increments
            receiver_depth = min(6, sender_depth + 1)
            
            if receiver_depth > account_depth[receiver]:
                account_depth[receiver] = receiver_depth
                
            layering[receiver] = max(layering[receiver], receiver_depth)

        return layering

    def get_account_metrics(self, account_id: str) -> Dict[str, Any]:
        """
        Returns graph metrics for a single account.
        """
        acc = str(account_id)
        if not self.simple_graph.has_node(acc):
            return {
                "in_degree": 0,
                "out_degree": 0,
                "graph_degree": 0,
                "weighted_in_degree": 0.0,
                "weighted_out_degree": 0.0,
                "betweenness_centrality": 0.0,
                "pagerank": 0.0,
                "cycle_count": 0,
                "layering_depth": 0,
            }

        in_deg = self.simple_graph.in_degree(acc)
        out_deg = self.simple_graph.out_degree(acc)
        w_in = sum(data.get("amount", 0.0) for _, _, data in self.simple_graph.in_edges(acc, data=True))
        w_out = sum(data.get("amount", 0.0) for _, _, data in self.simple_graph.out_edges(acc, data=True))

        return {
            "in_degree": int(in_deg),
            "out_degree": int(out_deg),
            "graph_degree": int(in_deg + out_deg),
            "weighted_in_degree": float(w_in),
            "weighted_out_degree": float(w_out),
            "betweenness_centrality": float(self.betweenness_scores.get(acc, 0.0)),
            "pagerank": float(self.pagerank_scores.get(acc, 0.0)),
            "cycle_count": int(self.cycle_counts.get(acc, 0)),
            "layering_depth": int(self.layering_depths.get(acc, 0)),
        }

    def get_subgraph(self, account_id: str, depth: int = 1, scores_dict: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Extracts ego-network subgraph around an account up to specified hop depth.
        Returns nodes and edges formatted for interactive UI rendering.
        """
        acc = str(account_id)
        if not self.simple_graph.has_node(acc):
            return {"nodes": [], "edges": [], "focus_node": acc}

        scores_dict = scores_dict or {}

        # Collect nodes within depth hops in both directions
        visited_nodes: Set[str] = {acc}
        current_layer: Set[str] = {acc}

        for _ in range(depth):
            next_layer: Set[str] = set()
            for node in current_layer:
                predecessors = set(self.simple_graph.predecessors(node))
                successors = set(self.simple_graph.successors(node))
                nbrs = (predecessors | successors) - visited_nodes
                next_layer.update(nbrs)
            visited_nodes.update(next_layer)
            current_layer = next_layer

        nodes_list = []
        for n in visited_nodes:
            score_data = scores_dict.get(n, {})
            risk_score = score_data.get("final_score", 0.0)
            classification = score_data.get("classification", "LOW")
            is_mule = score_data.get("is_mule", False)
            account_type = score_data.get("account_type", "individual")
            is_gst = score_data.get("is_gst_registered", False)

            in_deg = self.simple_graph.in_degree(n)
            out_deg = self.simple_graph.out_degree(n)

            nodes_list.append({
                "id": n,
                "label": n,
                "is_focus": (n == acc),
                "risk_score": round(risk_score, 1),
                "classification": classification,
                "is_mule": is_mule,
                "account_type": account_type,
                "is_gst_registered": is_gst,
                "in_degree": int(in_deg),
                "out_degree": int(out_deg),
                "pagerank": round(self.pagerank_scores.get(n, 0.0), 4),
            })

        edges_list = []
        for u in visited_nodes:
            for v in self.simple_graph.successors(u):
                if v in visited_nodes:
                    edge_data = self.simple_graph[u][v]
                    edges_list.append({
                        "id": f"{u}->{v}",
                        "source": u,
                        "target": v,
                        "amount": float(edge_data.get("amount", 0.0)),
                        "count": int(edge_data.get("count", 1)),
                        "is_risky": (scores_dict.get(u, {}).get("final_score", 0) > 50 or
                                     scores_dict.get(v, {}).get("final_score", 0) > 50)
                    })

        return {
            "focus_node": acc,
            "nodes": nodes_list,
            "edges": edges_list
        }

    def get_full_graph(self, scores_dict: Dict[str, Any] = None, max_nodes: int = 500) -> Dict[str, Any]:
        """
        Returns full graph topology (or top nodes by activity/risk) for global graph UI.
        """
        scores_dict = scores_dict or {}
        nodes_list = []
        all_nodes = list(self.simple_graph.nodes())

        # Sort nodes by risk score descending, then volume
        def node_sort_key(n):
            score = scores_dict.get(n, {}).get("final_score", 0.0)
            deg = self.simple_graph.degree(n)
            return (score, deg)

        all_nodes.sort(key=node_sort_key, reverse=True)
        selected_nodes = set(all_nodes[:max_nodes])

        for n in selected_nodes:
            score_data = scores_dict.get(n, {})
            risk_score = score_data.get("final_score", 0.0)
            classification = score_data.get("classification", "LOW")
            is_mule = score_data.get("is_mule", False)
            account_type = score_data.get("account_type", "individual")
            is_gst = score_data.get("is_gst_registered", False)

            nodes_list.append({
                "id": n,
                "label": n,
                "risk_score": round(risk_score, 1),
                "rule_score": round(score_data.get("rule_score", 0.0), 1),
                "ml_score": round(score_data.get("ml_score", 0.0), 1),
                "classification": classification,
                "is_mule": is_mule,
                "account_type": account_type,
                "is_gst_registered": is_gst,
                "in_degree": int(self.simple_graph.in_degree(n)),
                "out_degree": int(self.simple_graph.out_degree(n)),
            })

        edges_list = []
        for u in selected_nodes:
            for v in self.simple_graph.successors(u):
                if v in selected_nodes:
                    edge_data = self.simple_graph[u][v]
                    edges_list.append({
                        "id": f"{u}->{v}",
                        "source": u,
                        "target": v,
                        "amount": float(edge_data.get("amount", 0.0)),
                        "count": int(edge_data.get("count", 1)),
                        "is_risky": (scores_dict.get(u, {}).get("final_score", 0) > 50 or
                                     scores_dict.get(v, {}).get("final_score", 0) > 50)
                    })

        return {
            "nodes": nodes_list,
            "edges": edges_list,
            "total_nodes": len(self.simple_graph),
            "total_edges": len(self.multi_graph.edges())
        }
