"use client";

import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import {
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { NetworkGraphData, GraphNode, fetchFullGraph, fetchAccountNetwork } from "@/lib/api";

interface NetworkGraphProps {
  onSelectAccount?: (accountId: string) => void;
  selectedAccountId?: string | null;
  graphData?: NetworkGraphData | null;
  onRefresh?: () => void;
}

export default function NetworkGraph({
  onSelectAccount,
  selectedAccountId,
  graphData: externalGraphData,
  onRefresh,
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [loading, setLoading] = useState(false);
  const [internalData, setInternalData] = useState<NetworkGraphData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const activeData = externalGraphData || internalData;

  // Load graph if not provided externally
  useEffect(() => {
    if (!externalGraphData) {
      setLoading(true);
      fetchFullGraph(120)
        .then((data) => {
          setInternalData(data);
        })
        .catch((err) => console.error("Error loading graph:", err))
        .finally(() => setLoading(false));
    }
  }, [externalGraphData]);

  // Initialize or update Cytoscape
  useEffect(() => {
    if (!containerRef.current || !activeData || activeData.nodes.length === 0) return;

    // Convert nodes to Cytoscape elements
    const elements: cytoscape.ElementDefinition[] = [];

    activeData.nodes.forEach((node) => {
      let nodeType = "low";
      if (node.is_gst_registered) {
        nodeType = "merchant";
      } else if (node.classification === "CRITICAL") {
        nodeType = "critical";
      } else if (node.classification === "HIGH") {
        nodeType = "high";
      } else if (node.classification === "MEDIUM") {
        nodeType = "medium";
      }

      elements.push({
        data: {
          id: node.id,
          label: node.label.length > 14 ? node.label.substring(0, 12) + "…" : node.label,
          full_id: node.id,
          type: nodeType,
          score: node.risk_score,
          classification: node.classification,
          is_focus: node.id === selectedAccountId,
        },
      });
    });

    activeData.edges.forEach((edge) => {
      elements.push({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          amount: `₹${edge.amount >= 1000 ? (edge.amount / 1000).toFixed(0) + "k" : edge.amount}`,
          full_amount: edge.amount,
          suspicious: edge.is_risky ? "true" : "false",
        },
      });
    });

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            color: "#ffffff",
            "font-size": 10,
            "font-weight": 600,
            "text-valign": "bottom",
            "text-margin-y": 5,
            width: 32,
            height: 32,
            "border-width": 2,
            "border-color": "#ffffff33",
            "transition-property": "border-width, border-color, width, height",
            "transition-duration": 0.2,
          },
        },
        // Classification Styling
        {
          selector: 'node[type = "critical"]',
          style: {
            "background-color": "#ef4444",
            "border-color": "#f87171",
            "border-width": 3,
            width: 38,
            height: 38,
          },
        },
        {
          selector: 'node[type = "high"]',
          style: {
            "background-color": "#f97316",
            "border-color": "#fb923c",
            "border-width": 2.5,
          },
        },
        {
          selector: 'node[type = "medium"]',
          style: {
            "background-color": "#f59e0b",
            "border-color": "#fbbf24",
          },
        },
        {
          selector: 'node[type = "low"]',
          style: {
            "background-color": "#3b82f6",
            "border-color": "#60a5fa",
          },
        },
        {
          selector: 'node[type = "merchant"]',
          style: {
            "background-color": "#10b981",
            "border-color": "#34d399",
            shape: "round-rectangle",
            width: 36,
            height: 36,
          },
        },
        // Focused / Selected node
        {
          selector: "node:selected, node[?is_focus]",
          style: {
            "border-width": 4,
            "border-color": "#38bdf8",
          },
        },
        // Edge styling
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#475569",
            "target-arrow-color": "#475569",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(amount)",
            color: "#94a3b8",
            "font-size": 8,
            "text-background-color": "#071019",
            "text-background-opacity": 0.85,
            "text-background-padding": "2px",
          },
        },
        {
          selector: 'edge[suspicious = "true"]',
          style: {
            "line-color": "#ef4444",
            "target-arrow-color": "#ef4444",
            "line-style": "dashed",
            width: 2.5,
            color: "#f87171",
          },
        },
      ],
      layout: {
        name: "cose",
        animate: false,
        padding: 50,
        nodeRepulsion: () => 450000,
        idealEdgeLength: () => 110,
      },
      minZoom: 0.3,
      maxZoom: 3.0,
    });

    // Node click handler
    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      const fullId = node.data("full_id") || node.id();
      if (onSelectAccount) {
        onSelectAccount(fullId);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [activeData, selectedAccountId, onSelectAccount]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!cyRef.current || !searchQuery.trim()) return;

    const term = searchQuery.trim().toLowerCase();
    const match = cyRef.current.nodes().filter((n) => {
      const id = (n.data("full_id") || n.id()).toLowerCase();
      return id.includes(term);
    });

    if (match.length > 0) {
      cyRef.current.nodes().unselect();
      match.select();
      cyRef.current.animate({
        center: { eles: match[0] },
        zoom: 1.8,
        duration: 500,
      });
      if (onSelectAccount) {
        onSelectAccount(match[0].data("full_id") || match[0].id());
      }
    }
  }

  function zoomIn() {
    cyRef.current?.zoom({
      level: Math.min((cyRef.current.zoom() || 1) * 1.25, 3.0),
      renderedPosition: { x: (cyRef.current.width() || 0) / 2, y: (cyRef.current.height() || 0) / 2 },
    });
  }

  function zoomOut() {
    cyRef.current?.zoom({
      level: Math.max((cyRef.current.zoom() || 1) * 0.8, 0.3),
      renderedPosition: { x: (cyRef.current.width() || 0) / 2, y: (cyRef.current.height() || 0) / 2 },
    });
  }

  function fitGraph() {
    cyRef.current?.fit(undefined, 40);
  }

  return (
    <div className="relative h-full min-h-[560px] w-full overflow-hidden rounded-xl border border-slate-800 bg-[#071019] shadow-2xl">
      {/* Top Search & Controls Bar */}
      <div className="absolute left-4 right-4 top-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <form onSubmit={handleSearch} className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-[#0b1621]/95 px-3 py-1.5 backdrop-blur shadow-lg">
          <Search size={13} className="text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search account (e.g. MULE_047)..."
            className="w-48 bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-500"
          />
          <button type="submit" className="rounded bg-blue-600/80 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-blue-600">
            Find
          </button>
        </form>

        <div className="pointer-events-auto flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-[#0b1621]/95 px-3 py-1.5 text-xs text-slate-300 backdrop-blur shadow-lg hover:border-slate-600 hover:text-white"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Refresh Graph
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute left-4 bottom-4 z-10 space-y-1 rounded-lg border border-slate-800/80 bg-[#0b1621]/90 p-3 text-[10px] backdrop-blur shadow-xl">
        <p className="font-semibold text-slate-300 pb-1 border-b border-slate-800">Node Typology</p>
        <Legend color="bg-red-500" label="Critical Risk (≥75)" />
        <Legend color="bg-orange-500" label="High Risk (50-74)" />
        <Legend color="bg-amber-500" label="Medium Risk (25-49)" />
        <Legend color="bg-blue-500" label="Low Risk (<25)" />
        <Legend color="bg-emerald-500" label="GST Merchant (-10 pts credit)" />

        <div className="pt-2 text-slate-400 border-t border-slate-800">
          ── Flow Direction
        </div>
        <div className="text-red-400 font-medium">
          ┈┈ Rapid / Risky Flow
        </div>
      </div>

      {/* Cytoscape Canvas */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {/* Graph Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex gap-1 rounded-lg border border-slate-800 bg-[#0b1621]/90 p-1 backdrop-blur shadow-xl">
        <GraphButton onClick={zoomIn} title="Zoom In">
          <Plus size={14} />
        </GraphButton>
        <GraphButton onClick={zoomOut} title="Zoom Out">
          <Minus size={14} />
        </GraphButton>
        <GraphButton onClick={fitGraph} title="Fit to Screen">
          <Maximize2 size={14} />
        </GraphButton>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-300">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
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
      className="flex h-7 w-7 items-center justify-center rounded border border-slate-700 bg-[#0b1621] text-slate-400 transition hover:bg-slate-800 hover:text-white"
    >
      {children}
    </button>
  );
}