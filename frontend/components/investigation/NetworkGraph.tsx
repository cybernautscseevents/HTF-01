"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import {
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { NetworkGraphData, TrailHop, fetchFullGraph } from "@/lib/api";

try {
  cytoscape.use(fcose);
} catch {
  // already registered (hot reload)
}

const ZOOM_LABEL_THRESHOLD = 1.3;

export interface MuleCluster {
  id: string;
  nodeIds: string[];
  size: number;
}

interface NetworkGraphProps {
  onSelectAccount?: (accountId: string) => void;
  selectedAccountId?: string | null;
  graphData?: NetworkGraphData | null;
  onRefresh?: () => void;
  activeSimulationHop?: TrailHop | null;
  onMuleClustersChange?: (clusters: MuleCluster[]) => void;
}

export default function NetworkGraph({
  onSelectAccount,
  selectedAccountId,
  graphData: externalGraphData,
  onRefresh,
  activeSimulationHop,
  onMuleClustersChange,
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [loading, setLoading] = useState(false);
  const [internalData, setInternalData] = useState<NetworkGraphData | null>(null);
  const [muleMode, setMuleMode] = useState(false);
  const [activeClusterIdx, setActiveClusterIdx] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [ready, setReady] = useState(false);

  const activeData = externalGraphData || internalData;

  const loadGraph = () => {
    setLoading(true);
    fetchFullGraph(150)
      .then((data) => setInternalData(data))
      .catch((err) => console.error("Error loading graph:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!externalGraphData) {
      loadGraph();
    }
  }, [externalGraphData]);

  // ---- Mule network detection (connected components among CRITICAL/HIGH/is_mule nodes) ----
  const clusters: MuleCluster[] = useMemo(() => {
    if (!activeData) return [];
    const flagged = new Set(
      activeData.nodes
        .filter((n) => n.classification === "CRITICAL" || n.classification === "HIGH" || n.is_mule)
        .map((n) => n.id)
    );
    if (flagged.size === 0) return [];

    const parent = new Map<string, string>();
    flagged.forEach((id) => parent.set(id, id));
    const find = (x: string): string => {
      let r = x;
      while (parent.get(r) !== r) r = parent.get(r)!;
      let cur = x;
      while (parent.get(cur) !== r) {
        const next = parent.get(cur)!;
        parent.set(cur, r);
        cur = next;
      }
      return r;
    };
    const union = (a: string, b: string) => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent.set(ra, rb);
    };

    activeData.edges.forEach((e) => {
      if (flagged.has(e.source) && flagged.has(e.target)) union(e.source, e.target);
    });

    const groups = new Map<string, string[]>();
    flagged.forEach((id) => {
      const root = find(id);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root)!.push(id);
    });

    return Array.from(groups.entries())
      .map(([root, ids]) => ({ id: root, nodeIds: ids, size: ids.length }))
      .filter((c) => c.size >= 2)
      .sort((a, b) => b.size - a.size);
  }, [activeData]);

  const notifyClusters = (next: MuleCluster[]) => {
    onMuleClustersChange?.(next);
    setActiveClusterIdx(null);
  };

  useEffect(() => {
    notifyClusters(clusters);
  }, [clusters]);

  // ---- Build / rebuild graph ----
  useEffect(() => {
    if (!containerRef.current || !activeData || activeData.nodes.length === 0) {
      setReady(false);
      return;
    }

    const maxDeg = Math.max(1, ...activeData.nodes.map((n) => n.in_degree + n.out_degree));
    const maxAmt = Math.max(1, ...activeData.edges.map((e) => e.amount));

    const elements: cytoscape.ElementDefinition[] = [];

    activeData.nodes.forEach((node) => {
      let type = "low";
      if (node.is_gst_registered) type = "merchant";
      else if (node.classification === "CRITICAL") type = "critical";
      else if (node.classification === "HIGH") type = "high";
      else if (node.classification === "MEDIUM") type = "medium";

      const deg = node.in_degree + node.out_degree;
      const size = 7 + 14 * Math.sqrt(deg / maxDeg);

      elements.push({
        data: {
          id: node.id,
          label: node.label.length > 16 ? node.label.slice(0, 14) + "…" : node.label,
          type,
          score: node.risk_score,
          classification: node.classification,
          size,
        },
      });
    });

    activeData.edges.forEach((edge) => {
      const width = 0.6 + 2.4 * Math.sqrt(edge.amount / maxAmt);
      elements.push({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          amount: `₹${edge.amount >= 1000 ? (edge.amount / 1000).toFixed(0) + "k" : edge.amount}`,
          risky: edge.is_risky ? "true" : "false",
          width,
        },
      });
    });

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const nodeCount = activeData.nodes.length;

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#71717a",
            width: "data(size)",
            height: "data(size)",
            label: "data(label)",
            color: "#d4d4d8",
            "font-size": 9,
            "text-valign": "bottom",
            "text-margin-y": 5,
            "text-opacity": 0,
            "text-background-opacity": 0,
            "border-width": 0,
            "overlay-opacity": 0,
            "transition-property": "opacity, border-width, border-color, background-color",
            "transition-duration": 0.15,
          },
        },
        { selector: 'node[type = "critical"]', style: { "background-color": "#f87171" } },
        { selector: 'node[type = "high"]', style: { "background-color": "#fb923c" } },
        { selector: 'node[type = "medium"]', style: { "background-color": "#facc15" } },
        { selector: 'node[type = "low"]', style: { "background-color": "#60a5fa" } },
        {
          selector: 'node[type = "merchant"]',
          style: { "background-color": "#34d399", shape: "round-rectangle" },
        },
        {
          selector: "node.zoomed-in",
          style: { "text-opacity": 0.85 },
        },
        {
          selector: "edge",
          style: {
            width: "data(width)",
            "line-color": "#3f3f46",
            "target-arrow-color": "#3f3f46",
            "target-arrow-shape": "triangle",
            "arrow-scale": 0.55,
            "curve-style": "straight",
            opacity: 0.55,
            label: "",
            "overlay-opacity": 0,
          },
        },
        {
          selector: 'edge[risky = "true"]',
          style: {
            "line-color": "#f87171",
            "target-arrow-color": "#f87171",
            opacity: 0.6,
          },
        },
        // ---- Emphasis states (idle hover / search) ----
        {
          selector: "node.faded",
          style: { opacity: 0.08, "text-opacity": 0 },
        },
        {
          selector: "edge.faded",
          style: { opacity: 0.04 },
        },
        {
          selector: "node.simulation-dimmed",
          style: { opacity: 0.08, "text-opacity": 0 },
        },
        {
          selector: "edge.simulation-dimmed",
          style: { opacity: 0.04 },
        },
        {
          selector: "node.highlighted",
          style: {
            opacity: 1,
            "text-opacity": 1,
            color: "#f4f4f5",
            "font-size": 10.5,
            "font-weight": 600,
          },
        },
        {
          selector: "edge.highlighted",
          style: { opacity: 0.9, width: "data(width)", "line-color": "#a1a1aa", "target-arrow-color": "#a1a1aa" },
        },
        // ---- Mule cluster emphasis ----
        {
          selector: "node.mule-cluster",
          style: {
            "border-width": 2.5,
            "border-color": "#fbbf24",
            "border-opacity": 0.9,
          },
        },
        {
          selector: "edge.mule-edge",
          style: {
            "line-color": "#f59e0b",
            "target-arrow-color": "#f59e0b",
            opacity: 0.95,
            width: "data(width)",
          },
        },
        // ---- Search match ----
        {
          selector: "node.search-match",
          style: { "border-width": 2.5, "border-color": "#818cf8", "border-opacity": 1 },
        },
        // ---- Persistent selection ----
        {
          selector: "node.account-selected",
          style: {
            opacity: 1,
            "text-opacity": 1,
            "border-width": 3,
            "border-color": "#e4e4e7",
            "font-weight": 700,
            "font-size": 11,
          },
        },
        // ---- Simulation (always on top) ----
        {
          selector: "node.sim-sender",
          style: {
            opacity: 1,
            "border-width": 4,
            "border-color": "#818cf8",
            "background-color": "#6366f1",
            "text-opacity": 1,
          },
        },
        {
          selector: "node.sim-receiver",
          style: {
            opacity: 1,
            "border-width": 4,
            "border-color": "#fb7185",
            "background-color": "#f43f5e",
            "text-opacity": 1,
          },
        },
        {
          selector: "edge.sim-edge",
          style: {
            "line-color": "#818cf8",
            "target-arrow-color": "#818cf8",
            width: 3,
            opacity: 1,
            "line-style": "dashed",
            "line-dash-pattern": [6, 4],
          },
        },
      ],
      layout: {
        name: "fcose",
        quality: nodeCount > 260 ? "draft" : "default",
        randomize: true,
        animate: false,
        fit: true,
        padding: 36,
        nodeSeparation: 70,
        idealEdgeLength: 70,
        nodeRepulsion: 7000,
        edgeElasticity: 0.1,
        gravity: 0.25,
        numIter: 2500,
        packComponents: true,
        tile: true,
      } as unknown as cytoscape.LayoutOptions,
      minZoom: 0.15,
      maxZoom: 4.0,
      wheelSensitivity: 0.2,
    });

    // Hover emphasis
    cy.on("mouseover", "node", (evt) => {
      if (muleMode || searchTerm) return;
      const node = evt.target;
      const neighborhood = node.closedNeighborhood();
      cy.elements().difference(neighborhood).addClass("faded");
      neighborhood.addClass("highlighted");
    });

    cy.on("mouseout", "node", () => {
      cy.elements().removeClass("faded highlighted");
    });

    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      onSelectAccount?.(node.id());
    });

    cy.on("zoom", () => {
      const zoomed = cy.zoom() > ZOOM_LABEL_THRESHOLD;
      cy.nodes().toggleClass("zoomed-in", zoomed);
    });

    cyRef.current = cy;
    setReady(true);

    return () => {
      cy.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeData]);

  // ---- Persistent account selection ring ----
  useEffect(() => {
    if (!cyRef.current) return;
    cyRef.current.nodes().removeClass("account-selected");
    if (selectedAccountId) {
      cyRef.current.getElementById(selectedAccountId).addClass("account-selected");
    }
  }, [selectedAccountId, ready]);

  // ---- Mule mode emphasis ----
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.elements().removeClass("faded highlighted mule-cluster mule-edge");

    if (!muleMode || clusters.length === 0) return;

    const visibleClusters = activeClusterIdx !== null ? [clusters[activeClusterIdx]] : clusters;
    const focusIds = new Set(visibleClusters.flatMap((c) => c.nodeIds));

    const focusNodes = cy.nodes().filter((n) => focusIds.has(n.id()));
    const focusEdges = focusNodes.edgesWith(focusNodes);
    const focusEls = focusNodes.union(focusEdges);

    cy.elements().difference(focusEls).addClass("faded");
    focusNodes.addClass("highlighted mule-cluster");
    focusEdges.addClass("highlighted mule-edge");

    if (activeClusterIdx !== null && focusNodes.length > 0) {
      cy.animate({ fit: { eles: focusNodes, padding: 60 }, duration: 350 });
    }
  }, [muleMode, activeClusterIdx, clusters, ready]);

  // ---- Search filter ----
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    if (muleMode) return;
    cy.elements().removeClass("faded highlighted");

    const term = searchTerm.trim().toLowerCase();
    if (!term) return;

    const matches = cy.nodes().filter((n) => n.id().toLowerCase().includes(term));
    if (matches.length === 0) {
      cy.elements().addClass("faded");
      return;
    }
    cy.elements().addClass("faded");
    matches.removeClass("faded").addClass("highlighted");
  }, [searchTerm, muleMode, ready]);

  // ---- Simulation hop highlight + flow animation ----
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.elements().removeClass("sim-sender sim-receiver sim-edge simulation-dimmed");
    if (!activeSimulationHop) return;

    cy.elements().addClass("simulation-dimmed");

    const sender = cy.getElementById(activeSimulationHop.sender_id);
    const receiver = cy.getElementById(activeSimulationHop.receiver_id);
    const edge = cy.edges().filter(
      (e) =>
        e.source().id() === activeSimulationHop.sender_id &&
        e.target().id() === activeSimulationHop.receiver_id
    );

    sender.addClass("sim-sender");
    receiver.addClass("sim-receiver");
    edge.addClass("sim-edge");
    sender.union(receiver).removeClass("simulation-dimmed");
    edge.removeClass("simulation-dimmed");

    const targets = sender.union(receiver);
    if (targets.length > 0) {
      cy.animate({ center: { eles: targets }, zoom: Math.max(cy.zoom(), 1.6), duration: 350 });
      [sender, receiver].forEach((n) => {
        if (!n.length) return;
        const base = n.numericStyle("width");
        n.stop().animate(
          { style: { width: base * 1.5, height: base * 1.5 } },
          {
            duration: 220,
            easing: "ease-out-cubic",
            complete: () => {
              n.animate({ style: { width: base, height: base } }, { duration: 260, easing: "ease-in-cubic" });
            },
          }
        );
      });
    }
  }, [activeSimulationHop]);

  // ---- Flowing dash animation while a hop is active ----
  useEffect(() => {
    if (!activeSimulationHop || !cyRef.current) return;
    let frame: number;
    let offset = 0;
    const tick = () => {
      offset -= 1.2;
      cyRef.current?.edges(".sim-edge").style("line-dash-offset", offset);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [activeSimulationHop]);

  function zoomIn() {
    cyRef.current?.zoom({
      level: Math.min((cyRef.current.zoom() || 1) * 1.25, 4.0),
      renderedPosition: { x: (cyRef.current.width() || 0) / 2, y: (cyRef.current.height() || 0) / 2 },
    });
  }

  function zoomOut() {
    cyRef.current?.zoom({
      level: Math.max((cyRef.current.zoom() || 1) * 0.8, 0.15),
      renderedPosition: { x: (cyRef.current.width() || 0) / 2, y: (cyRef.current.height() || 0) / 2 },
    });
  }

  function fitGraph() {
    cyRef.current?.fit(undefined, 40);
  }

  const totalMuleAccounts = clusters.reduce((sum, c) => sum + c.size, 0);

  return (
    <div className="relative h-full min-h-140 w-full overflow-hidden rounded-lg border border-neutral-800 bg-[#121214]">
      {/* Toolbar */}
      <div className="absolute left-3 right-3 top-3 z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-950/90 px-2.5 py-1.5 text-[11px] text-neutral-500">
            <span className="font-medium text-neutral-300">{activeData?.nodes?.length || 0}</span>
            <span>nodes</span>
            <span className="text-neutral-700">·</span>
            <span className="font-medium text-neutral-300">{activeData?.edges?.length || 0}</span>
            <span>edges</span>
          </div>

          <div className="relative">
            <Search size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter nodes…"
              className="w-36 rounded-md border border-neutral-800 bg-neutral-950/90 py-1.5 pl-7 pr-6 text-[11px] text-neutral-300 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-300"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMuleMode((v) => !v)}
            disabled={clusters.length === 0}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              muleMode
                ? "border-amber-700/60 bg-amber-500/10 text-amber-300"
                : "border-neutral-800 bg-neutral-950/90 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
            }`}
            title={clusters.length === 0 ? "No mule networks detected in current graph" : "Toggle mule network detection"}
          >
            <ShieldAlert size={12} />
            {muleMode ? `${clusters.length} Mule Network${clusters.length !== 1 ? "s" : ""}` : "Detect Mule Networks"}
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-800 bg-neutral-950/90 text-neutral-500 hover:text-neutral-200 hover:border-neutral-700 transition-colors"
              title="Refresh graph"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>
          )}
        </div>
      </div>

      {/* Bottom-left: legend or mule cluster list */}
      <div className="absolute bottom-3 left-3 z-10 w-56 rounded-md border border-neutral-800 bg-neutral-950/90 p-2.5 text-[10.5px]">
        {!muleMode ? (
          <div className="space-y-1.5">
            <p className="pb-1 font-medium text-neutral-400">Risk tiers</p>
            <Legend color="bg-red-400" label="Critical" />
            <Legend color="bg-orange-400" label="High" />
            <Legend color="bg-yellow-400" label="Medium" />
            <Legend color="bg-blue-400" label="Low" />
            <Legend color="bg-emerald-400" label="GST merchant" />
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between pb-1">
              <p className="font-medium text-amber-300">{clusters.length} detected · {totalMuleAccounts} accounts</p>
              {activeClusterIdx !== null && (
                <button onClick={() => setActiveClusterIdx(null)} className="text-neutral-500 hover:text-neutral-200">
                  <X size={11} />
                </button>
              )}
            </div>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {clusters.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => setActiveClusterIdx(activeClusterIdx === idx ? null : idx)}
                  className={`flex w-full items-center justify-between rounded px-2 py-1 text-left transition-colors ${
                    activeClusterIdx === idx
                      ? "bg-amber-500/15 text-amber-300"
                      : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                  }`}
                >
                  <span>Network #{idx + 1}</span>
                  <span className="font-mono text-neutral-500">{c.size} accts</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {!loading && (!activeData || activeData.nodes.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-600">
          No graph data to display.
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 z-10 flex gap-1 rounded-md border border-neutral-800 bg-neutral-950/90 p-1">
        <GraphButton onClick={zoomIn} title="Zoom in">
          <Plus size={13} />
        </GraphButton>
        <GraphButton onClick={zoomOut} title="Zoom out">
          <Minus size={13} />
        </GraphButton>
        <GraphButton onClick={fitGraph} title="Fit to screen">
          <Maximize2 size={13} />
        </GraphButton>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-neutral-400">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function GraphButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-6.5 w-6.5 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-neutral-200"
    >
      {children}
    </button>
  );
}
