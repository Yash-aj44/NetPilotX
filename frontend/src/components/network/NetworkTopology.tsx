import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import type { NetworkEdge, NetworkNode } from "../../types/network";
import {
  computeDeterministicLayout,
  type RenderNode,
} from "./topology/topologyLayout";
import { renderD3Topology } from "./topology/topologyRenderer";
import {
  createPacketFlowParticles,
  animateTopologyConstruction,
} from "./topology/topologyAnimations";
import TopologyControls from "./topology/TopologyControls";

interface NetworkTopologyProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  onNodeSelect?: (node: NetworkNode | null) => void;
}

export default function NetworkTopology({
  nodes,
  edges,
  onNodeSelect,
}: NetworkTopologyProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedEdgeId, setExpandedEdgeId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{
    node: RenderNode;
    pos: { x: number; y: number };
  } | null>(null);

  const [dimensions, setDimensions] = useState({ width: 1000, height: 650 });

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: Math.max(containerRef.current.clientWidth, 900),
          height: Math.max(containerRef.current.clientHeight, 620),
        });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Compute Layout Data
  const { layoutNodes, layoutLinks } = useMemo(() => {
    return computeDeterministicLayout(
      nodes,
      edges,
      expandedEdgeId,
      dimensions.width
    );
  }, [nodes, edges, expandedEdgeId, dimensions.width]);

  // Setup D3 Zoom & Transform
  const zoomBehavior = useMemo(() => {
    return d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 2.5])
      .on("zoom", (event) => {
        if (!svgRef.current) return;
        const g = d3.select(svgRef.current).select("g.topology-root-container");
        g.attr("transform", event.transform);
      });
  }, []);

  useEffect(() => {
    if (svgRef.current) {
      d3.select(svgRef.current).call(zoomBehavior);
    }
  }, [zoomBehavior]);

  // Auto center & scale topology tree to fit stage perfectly on mount/resize
  useEffect(() => {
    if (svgRef.current && containerRef.current) {
      const w = containerRef.current.clientWidth || 900;
      const h = containerRef.current.clientHeight || 500;
      const targetW = 920;
      const targetH = expandedEdgeId ? 480 : 360;
      const scale = Math.min(w / targetW, (h - 40) / targetH, 1.15);
      const tx = (w - targetW * scale) / 2;
      const ty = 20;
      d3.select(svgRef.current).call(
        zoomBehavior.transform,
        d3.zoomIdentity.translate(tx, ty).scale(scale)
      );
    }
  }, [dimensions, expandedEdgeId, zoomBehavior]);

  const hasConstructedRef = useRef(false);

  // Render D3 Topology Tree whenever state or layout updates
  useEffect(() => {
    if (!svgRef.current) return;

    renderD3Topology(
      svgRef.current,
      layoutNodes,
      layoutLinks,
      selectedNodeId,
      expandedEdgeId,
      {
        onNodeClick: (node: RenderNode) => {
          setSelectedNodeId(node.id);
          if (onNodeSelect) {
            onNodeSelect(node);
          }
          // If edge switch is clicked, auto toggle expand drilldown
          if (node.type === "edge" && !node.isEndpoint) {
            setExpandedEdgeId((prev) => (prev === node.id ? null : node.id));
          }
        },
        onNodeDoubleClick: (node: RenderNode) => {
          if (node.type === "edge" && !node.isEndpoint) {
            setExpandedEdgeId((prev) => (prev === node.id ? null : node.id));
          }
        },
        onNodeHover: (node, pos) => {
          if (node && pos) {
            setHoveredNode({ node, pos });
          } else {
            setHoveredNode(null);
          }
        },
      }
    );

    // Trigger GSAP construction timeline sequence on initial render
    if (!hasConstructedRef.current && layoutNodes.length > 0) {
      hasConstructedRef.current = true;
      animateTopologyConstruction(svgRef.current);
    }
  }, [layoutNodes, layoutLinks, selectedNodeId, expandedEdgeId, onNodeSelect]);

  // GSAP Packet Flow Particles
  useEffect(() => {
    if (!svgRef.current) return;
    const cleanup = createPacketFlowParticles(svgRef.current, layoutLinks);
    return () => cleanup();
  }, [layoutLinks]);

  // Viewport Control Handlers
  const handleZoomIn = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehavior.scaleBy, 1.25);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehavior.scaleBy, 0.8);
    }
  };

  const handleFitView = () => {
    if (svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(450)
        .call(zoomBehavior.transform, d3.zoomIdentity.translate(20, 20).scale(0.92));
    }
  };

  const handleResetView = () => {
    if (svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(400)
        .call(zoomBehavior.transform, d3.zoomIdentity);
    }
  };

  return (
    <div className="topology-workspace-container" ref={containerRef}>
      {/* Topology Canvas SVG */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="topology-canvas-svg"
        onClick={() => {
          setSelectedNodeId(null);
          if (onNodeSelect) onNodeSelect(null);
        }}
      >
        <defs>
          <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>

      {/* Spatial Hover Preview Card */}
      {hoveredNode && (
        <div
          className="hover-preview-tooltip"
          style={{
            position: "fixed",
            left: hoveredNode.pos.x + 16,
            top: hoveredNode.pos.y - 40,
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          <div className="hover-preview-card">
            <div className="hover-header">
              <span className="hover-node-id">{hoveredNode.node.id}</span>
              <span className={`hover-status-tag ${hoveredNode.node.status}`}>
                {hoveredNode.node.status.toUpperCase()}
              </span>
            </div>
            <strong className="hover-node-name">{hoveredNode.node.name}</strong>
            <div className="hover-grid">
              <div className="hover-grid-cell">
                <span>SYSTEMS</span>
                <strong>{hoveredNode.node.connectedSystems ?? (hoveredNode.node.isEndpoint ? 1 : 22)}</strong>
              </div>
              <div className="hover-grid-cell">
                <span>PACKET LOSS</span>
                <strong>{hoveredNode.node.status === "down" ? "100%" : "0%"}</strong>
              </div>
              <div className="hover-grid-cell">
                <span>LATENCY</span>
                <strong>{hoveredNode.node.status === "down" ? "N/A" : "12 ms"}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Viewport Control Bar */}
      <TopologyControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onResetView={handleResetView}
        expandedEdgeId={expandedEdgeId}
        onCollapseDrilldown={() => setExpandedEdgeId(null)}
      />

      {/* Instruction Overlay */}
      <div className="topology-hint-tag">
        <span>Click node to inspect • Click Edge switch for endpoint drill-down</span>
      </div>
    </div>
  );
}