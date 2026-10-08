"use client";

import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import {
  Maximize2,
  Minus,
  Plus,
} from "lucide-react";

const elements: cytoscape.ElementDefinition[] = [
  // Victims
  { data: { id: "V1", label: "V1", type: "victim" } },
  { data: { id: "V2", label: "V2", type: "victim" } },
  { data: { id: "V3", label: "V3", type: "victim" } },
  { data: { id: "V4", label: "V4", type: "victim" } },
  { data: { id: "V5", label: "V5", type: "victim" } },

  // Suspicious / mule network
  { data: { id: "A", label: "A", type: "suspicious" } },
  { data: { id: "B", label: "B", type: "suspicious" } },

  { data: { id: "C", label: "C", type: "mule" } },
  { data: { id: "D", label: "D", type: "mule" } },
  { data: { id: "E", label: "E", type: "mule" } },

  { data: { id: "F", label: "F", type: "cashout" } },

  // Victim → Aggregator
  {
    data: {
      id: "V1-A",
      source: "V1",
      target: "A",
      amount: "₹1K",
    },
  },
  {
    data: {
      id: "V2-A",
      source: "V2",
      target: "A",
      amount: "₹1K",
    },
  },
  {
    data: {
      id: "V3-A",
      source: "V3",
      target: "A",
      amount: "₹1K",
    },
  },
  {
    data: {
      id: "V4-A",
      source: "V4",
      target: "A",
      amount: "₹1K",
    },
  },
  {
    data: {
      id: "V5-A",
      source: "V5",
      target: "A",
      amount: "₹1K",
    },
  },

  // Aggregator → Relay
  {
    data: {
      id: "A-B",
      source: "A",
      target: "B",
      amount: "₹18K",
      suspicious: "true",
    },
  },

  // Relay → Mules
  {
    data: {
      id: "B-C",
      source: "B",
      target: "C",
      amount: "₹5K",
    },
  },
  {
    data: {
      id: "B-D",
      source: "B",
      target: "D",
      amount: "₹4K",
    },
  },
  {
    data: {
      id: "B-E",
      source: "B",
      target: "E",
      amount: "₹4K",
    },
  },

  // Mules → Cashout
  {
    data: {
      id: "C-F",
      source: "C",
      target: "F",
      amount: "₹4.5K",
      suspicious: "true",
    },
  },
  {
    data: {
      id: "D-F",
      source: "D",
      target: "F",
      amount: "₹3.8K",
      suspicious: "true",
    },
  },
  {
    data: {
      id: "E-F",
      source: "E",
      target: "F",
      amount: "₹2.7K",
      suspicious: "true",
    },
  },
];

export default function NetworkGraph() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

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
            "text-valign": "center",
            "text-halign": "center",
            width: 34,
            height: 34,
            "border-width": 2,
            "border-color": "#ffffff33",
          },
        },

        {
          selector: 'node[type = "victim"]',
          style: {
            "background-color": "#2563eb",
          },
        },

        {
          selector: 'node[type = "suspicious"]',
          style: {
            "background-color": "#ef4444",
          },
        },

        {
          selector: 'node[type = "mule"]',
          style: {
            "background-color": "#f59e0b",
          },
        },

        {
          selector: 'node[type = "cashout"]',
          style: {
            "background-color": "#8b5cf6",
          },
        },

        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#94a3b8",
            "target-arrow-color": "#94a3b8",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",

            label: "data(amount)",
            color: "#cbd5e1",
            "font-size": 8,
            "text-background-color": "#071019",
            "text-background-opacity": 0.9,
            "text-border-width": 2,
          },
        },

        {
          selector: 'edge[suspicious = "true"]',
          style: {
            "line-color": "#ef4444",
            "target-arrow-color": "#ef4444",
            "line-style": "dashed",
            width: 2,
          },
        },
      ],

      layout: {
        name: "breadthfirst",
        directed: true,
        spacingFactor: 1.4,
        padding: 40,
      },

      minZoom: 0.5,
      maxZoom: 2.5,
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, []);

  function zoomIn() {
    const cy = cyRef.current;
    if (!cy) return;

    cy.zoom({
      level: Math.min(cy.zoom() * 1.2, cy.maxZoom()),
      renderedPosition: {
        x: cy.width() / 2,
        y: cy.height() / 2,
      },
    });
  }

  function zoomOut() {
    const cy = cyRef.current;
    if (!cy) return;

    cy.zoom({
      level: Math.max(cy.zoom() / 1.2, cy.minZoom()),
      renderedPosition: {
        x: cy.width() / 2,
        y: cy.height() / 2,
      },
    });
  }

  function fitGraph() {
    cyRef.current?.fit(undefined, 40);
  }

  return (
    <div className="relative h-full min-h-[520px] overflow-hidden rounded-lg border border-slate-800 bg-[#071019]">

      {/* Legend */}
      <div className="absolute left-4 top-4 z-10 space-y-1 rounded-md bg-[#071019]/90 p-3 text-[10px]">
        <Legend color="bg-blue-500" label="Victim" />
        <Legend color="bg-emerald-400" label="Normal Account" />
        <Legend color="bg-red-500" label="Suspicious Account" />
        <Legend color="bg-amber-500" label="Mule Account" />
        <Legend color="bg-violet-500" label="Cash-out / Exit" />

        <div className="pt-2 text-slate-400">
          → Money Flow
        </div>

        <div className="text-red-400">
          ⇢ Suspicious Flow
        </div>
      </div>

      {/* Graph */}
      <div
        ref={containerRef}
        className="absolute inset-0"
      />

      {/* Graph controls */}
      <div className="absolute bottom-4 left-4 z-10 flex gap-1">
        <GraphButton onClick={zoomIn}>
          <Plus size={14} />
        </GraphButton>

        <GraphButton onClick={zoomOut}>
          <Minus size={14} />
        </GraphButton>

        <GraphButton onClick={fitGraph}>
          <Maximize2 size={14} />
        </GraphButton>
      </div>
    </div>
  );
}

function Legend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-slate-400">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </div>
  );
}

function GraphButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded border border-slate-700 bg-[#0b1621] text-slate-400 transition hover:bg-slate-800 hover:text-white"
    >
      {children}
    </button>
  );
}