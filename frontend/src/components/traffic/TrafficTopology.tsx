import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import gsap from "gsap";
import {
  Maximize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Zap,
} from "lucide-react";
import type { NetworkEdge, NetworkNode } from "../../types/network";
import type { TrafficFlow, TrafficLinkData } from "../../types/traffic";
import {
  computeDeterministicLayout,
  type RenderNode,
} from "../network/topology/topologyLayout";

interface TrafficTopologyProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  trafficLinks: TrafficLinkData[];
  selectedFlow: TrafficFlow | null;
  selectedLinkId: string | null;
  onLinkSelect: (link: TrafficLinkData | null) => void;
  onNodeSelect?: (node: NetworkNode | null) => void;
}

export default function TrafficTopology({
  nodes,
  edges,
  trafficLinks,
  selectedFlow,
  selectedLinkId,
  onLinkSelect,
  onNodeSelect,
}: TrafficTopologyProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hoveredLink, setHoveredLink] = useState<{
    link: TrafficLinkData;
    pos: { x: number; y: number };
  } | null>(null);

  const [hoveredNode, setHoveredNode] = useState<{
    node: RenderNode;
    pos: { x: number; y: number };
  } | null>(null);

  const [dimensions, setDimensions] = useState({ width: 1000, height: 580 });

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: Math.max(containerRef.current.clientWidth, 900),
          height: Math.max(containerRef.current.clientHeight, 540),
        });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Compute Layout Positions using existing deterministic algorithm
  const { layoutNodes, layoutLinks } = useMemo(() => {
    return computeDeterministicLayout(nodes, edges, null, dimensions.width);
  }, [nodes, edges, dimensions.width]);

  // Merge layout links with traffic telemetry
  const enrichedLinks = useMemo(() => {
    return layoutLinks.map((ll) => {
      const match = trafficLinks.find(
        (tl) =>
          (tl.source.toLowerCase() === ll.source.toLowerCase() &&
            tl.target.toLowerCase() === ll.target.toLowerCase()) ||
          (tl.source.toLowerCase() === ll.target.toLowerCase() &&
            tl.target.toLowerCase() === ll.source.toLowerCase())
      );

      return {
        ...ll,
        trafficData: match || null,
      };
    });
  }, [layoutLinks, trafficLinks]);

  // Determine which links are on the selected flow path
  const flowPathLinksSet = useMemo(() => {
    const set = new Set<string>();
    if (!selectedFlow || !selectedFlow.path || selectedFlow.path.length < 2) {
      return set;
    }

    for (let i = 0; i < selectedFlow.path.length - 1; i++) {
      const u = selectedFlow.path[i].toLowerCase();
      const v = selectedFlow.path[i + 1].toLowerCase();
      set.add(`${u}-${v}`);
      set.add(`${v}-${u}`);
    }
    return set;
  }, [selectedFlow]);

  // D3 Zoom & Pan Behavior Ref
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2.5])
      .on("zoom", (event) => {
        if (!svgRef.current) return;
        const g = d3.select(svgRef.current).select("g.traffic-root-container");
        g.attr("transform", event.transform);
      });

    zoomBehaviorRef.current = zoomBehavior;
    d3.select(svgRef.current).call(zoomBehavior);
  }, []);

  // Auto-center and fit on mount / resize
  useEffect(() => {
    if (svgRef.current && containerRef.current && zoomBehaviorRef.current) {
      const w = containerRef.current.clientWidth || 900;
      const h = containerRef.current.clientHeight || 540;
      const targetW = 920;
      const targetH = 360;
      const scale = Math.min(w / targetW, (h - 40) / targetH, 1.15);
      const tx = (w - targetW * scale) / 2;
      const ty = 25;

      d3.select(svgRef.current).call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity.translate(tx, ty).scale(scale)
      );
    }
  }, [dimensions]);

  // Particle Animation System
  useEffect(() => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const particleGroup = svgEl.querySelector(".traffic-particles-layer");
    if (!particleGroup) return;

    particleGroup.innerHTML = "";
    const tweens: gsap.core.Tween[] = [];

    enrichedLinks.forEach((link) => {
      const tData = link.trafficData;
      if (!tData || tData.status === "down") return;

      const pathEl = svgEl.querySelector(`#traffic-link-path-${link.id}`) as SVGPathElement | null;
      if (!pathEl) return;

      try {
        const pathLen = pathEl.getTotalLength();
        if (pathLen === 0) return;

        const isFlowPath =
          flowPathLinksSet.has(`${link.source.toLowerCase()}-${link.target.toLowerCase()}`) ||
          flowPathLinksSet.has(`${link.target.toLowerCase()}-${link.source.toLowerCase()}`);

        const isCongested = tData.status === "congested";
        const particleCount = isFlowPath ? 3 : isCongested ? 4 : 2;
        const particleColor = isFlowPath
          ? "#E9A52B"
          : isCongested
          ? "#C85C52"
          : tData.status === "high"
          ? "#D5A24A"
          : "#8FAF8F";

        for (let i = 0; i < particleCount; i++) {
          const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          circle.setAttribute("r", isFlowPath ? "3" : isCongested ? "2.8" : "2");
          circle.setAttribute("fill", particleColor);
          if (isFlowPath || isCongested) {
            circle.setAttribute("filter", "url(#traffic-glow)");
          }
          particleGroup.appendChild(circle);

          const obj = { progress: i * (1 / particleCount) };
          const tween = gsap.to(obj, {
            progress: "+=1",
            duration: isCongested ? 1.4 : isFlowPath ? 1.8 : 2.6,
            repeat: -1,
            ease: "none",
            onUpdate: () => {
              const norm = obj.progress % 1;
              const pt = pathEl.getPointAtLength(norm * pathLen);
              circle.setAttribute("cx", String(pt.x));
              circle.setAttribute("cy", String(pt.y));
              const fade = Math.sin(norm * Math.PI);
              circle.setAttribute("opacity", String(fade * (isFlowPath ? 0.95 : 0.75)));
            },
          });
          tweens.push(tween);
        }
      } catch {
        // Path calculation error fallback
      }
    });

    return () => {
      tweens.forEach((t) => t.kill());
      if (particleGroup) particleGroup.innerHTML = "";
    };
  }, [enrichedLinks, flowPathLinksSet]);

  // Viewport Control Handlers
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.25);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 0.8);
    }
  };

  const handleResetView = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(350)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  const handleFitView = () => {
    if (svgRef.current && containerRef.current && zoomBehaviorRef.current) {
      const w = containerRef.current.clientWidth || 900;
      const h = containerRef.current.clientHeight || 540;
      const scale = Math.min(w / 920, (h - 40) / 360, 1.15);
      const tx = (w - 920 * scale) / 2;
      const ty = 25;
      d3.select(svgRef.current)
        .transition()
        .duration(350)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }
  };

  return (
    <div className="traffic-topology-container" ref={containerRef}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="traffic-topology-svg"
        onClick={() => {
          onLinkSelect(null);
          if (onNodeSelect) onNodeSelect(null);
        }}
      >
        <defs>
          <filter id="traffic-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="congested-aura" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g className="traffic-root-container">
          {/* Layer 1: Links */}
          <g className="traffic-links-layer">
            {enrichedLinks.map((link) => {
              const tData = link.trafficData;
              const linkKey1 = `${link.source.toLowerCase()}-${link.target.toLowerCase()}`;
              const linkKey2 = `${link.target.toLowerCase()}-${link.source.toLowerCase()}`;
              const isFlowPath = flowPathLinksSet.has(linkKey1) || flowPathLinksSet.has(linkKey2);
              const isSelectedLink =
                selectedLinkId === link.id ||
                selectedLinkId === `link-${link.source}-${link.target}` ||
                selectedLinkId === linkKey1 ||
                selectedLinkId === linkKey2;

              const isDown = tData?.status === "down";
              const isCongested = tData?.status === "congested" || (tData?.utilizationPercent ?? 0) >= 90;
              const isHigh = tData?.status === "high";

              // Color determination
              let strokeColor = "#333A44"; // Moderate baseline
              if (isDown) strokeColor = "#C85C52";
              else if (isFlowPath) strokeColor = "var(--accent)";
              else if (isCongested) strokeColor = "var(--critical)";
              else if (isHigh) strokeColor = "var(--degraded)";
              else if (tData && tData.utilizationPercent < 40) strokeColor = "var(--healthy)";

              // Opacity & Stroke Width
              const hasFlowFilter = Boolean(selectedFlow);
              let opacity = 0.7;
              if (hasFlowFilter) {
                opacity = isFlowPath ? 1 : 0.2;
              } else if (isDown) {
                opacity = 0.95;
              } else if (isCongested) {
                opacity = 1;
              }

              const strokeWidth = isFlowPath ? 3.5 : isSelectedLink ? 3 : isCongested ? 2.8 : 2;

              // Arc path curve
              const pathD = `M ${link.sourceX} ${link.sourceY} Q ${(link.sourceX + link.targetX) / 2} ${
                (link.sourceY + link.targetY) / 2 - 12
              } ${link.targetX} ${link.targetY}`;

              // Midpoint for badge
              const midX = (link.sourceX + link.targetX) / 2;
              const midY = (link.sourceY + link.targetY) / 2 - 6;

              return (
                <g key={link.id} className="traffic-link-group">
                  {/* Invisible wide hit area for easy clicking */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={14}
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (tData) onLinkSelect(tData);
                    }}
                    onMouseEnter={(e) => {
                      if (tData) {
                        setHoveredLink({
                          link: tData,
                          pos: { x: e.clientX, y: e.clientY },
                        });
                      }
                    }}
                    onMouseLeave={() => setHoveredLink(null)}
                  />

                  {/* Primary Link Path */}
                  <path
                    id={`traffic-link-path-${link.id}`}
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeOpacity={opacity}
                    strokeDasharray={isDown ? "6,6" : "none"}
                    filter={isFlowPath ? "url(#traffic-glow)" : isCongested ? "url(#congested-aura)" : undefined}
                    style={{ transition: "stroke 0.3s ease, stroke-width 0.3s ease, opacity 0.3s ease" }}
                  />

                  {/* Link Utilization Pill Badge */}
                  {tData && !isDown && (
                    <g
                      transform={`translate(${midX}, ${midY})`}
                      style={{ cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onLinkSelect(tData);
                      }}
                      onMouseEnter={(e) => {
                        setHoveredLink({
                          link: tData,
                          pos: { x: e.clientX, y: e.clientY },
                        });
                      }}
                      onMouseLeave={() => setHoveredLink(null)}
                      opacity={hasFlowFilter && !isFlowPath ? 0.3 : 1}
                    >
                      <rect
                        x="-18"
                        y="-8"
                        width="36"
                        height="16"
                        rx="3"
                        fill="#101010"
                        stroke={isCongested ? "var(--critical)" : isFlowPath ? "var(--accent)" : "#292929"}
                        strokeWidth={isCongested || isFlowPath ? 1.5 : 1}
                      />
                      <text
                        x="0"
                        y="1"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontFamily="'JetBrains Mono', monospace"
                        fontSize="9px"
                        fontWeight="700"
                        fill={isCongested ? "var(--critical)" : isFlowPath ? "var(--accent)" : "#C0BCB5"}
                      >
                        {tData.utilizationPercent}%
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* Layer 2: Animated Packet Particles */}
          <g className="traffic-particles-layer" pointerEvents="none" />

          {/* Layer 3: Nodes */}
          <g className="traffic-nodes-layer">
            {layoutNodes.map((node) => {
              const isSelectedNode = false;
              const isCore = node.type === "core";
              const isDist = node.type === "distribution";
              const isDown = node.status === "down";

              // Check if node is part of selected flow path
              const isFlowHop = selectedFlow?.path?.some(
                (p) => p.toLowerCase() === node.id.toLowerCase()
              );
              const hasFlow = Boolean(selectedFlow);
              const nodeOpacity = hasFlow ? (isFlowHop ? 1 : 0.35) : 1;

              const boxW = isCore ? 64 : 50;
              const boxH = isCore ? 46 : 34;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{ cursor: "pointer", transition: "opacity 0.3s ease" }}
                  opacity={nodeOpacity}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNodeSelect) onNodeSelect(node);
                  }}
                  onMouseEnter={(e) => {
                    setHoveredNode({
                      node,
                      pos: { x: e.clientX, y: e.clientY },
                    });
                  }}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Selection / Flow Ring */}
                  {(isFlowHop || isSelectedNode) && (
                    <rect
                      x={-boxW / 2 - 4}
                      y={-boxH / 2 - 4}
                      width={boxW + 8}
                      height={boxH + 8}
                      rx={4}
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth={1.8}
                      filter="url(#traffic-glow)"
                    />
                  )}

                  {/* Node Chassis Base Box */}
                  <rect
                    x={-boxW / 2}
                    y={-boxH / 2}
                    width={boxW}
                    height={boxH}
                    rx={3}
                    fill="#101010"
                    stroke={isDown ? "var(--critical)" : isFlowHop ? "var(--accent)" : "#292929"}
                    strokeWidth={isFlowHop ? 1.8 : 1.2}
                  />

                  {/* Top Bar for Core */}
                  {isCore && (
                    <line
                      x1={-boxW / 2}
                      y1={-boxH / 2 + 7}
                      x2={boxW / 2}
                      y2={-boxH / 2 + 7}
                      stroke={isDown ? "var(--critical)" : "var(--accent)"}
                      strokeWidth={1.5}
                    />
                  )}

                  {/* Switch Type Symbol */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    y={isCore ? 3 : 0}
                    fontSize={isCore ? "11px" : "10px"}
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight="700"
                    fill="#F2F0EA"
                  >
                    {isCore ? "CORE" : isDist ? "DIST" : "EDGE"}
                  </text>

                  {/* Node Name Label */}
                  <text
                    y={isCore ? 36 : 28}
                    textAnchor="middle"
                    fontSize="9px"
                    fontWeight="600"
                    fontFamily="'JetBrains Mono', monospace"
                    fill={isFlowHop ? "var(--accent)" : "#A6A39C"}
                  >
                    {node.name}
                  </text>

                  {/* Status Indicator Dot */}
                  <circle
                    cx={boxW / 2 - 8}
                    cy={-boxH / 2 + 8}
                    r={3}
                    fill={isDown ? "var(--critical)" : "var(--healthy)"}
                  />
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Floating Spatial Link Hover Tooltip */}
      {hoveredLink && (
        <div
          className="traffic-link-tooltip"
          style={{
            position: "fixed",
            left: hoveredLink.pos.x + 14,
            top: hoveredLink.pos.y - 30,
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          <div className="traffic-tooltip-card">
            <div className="tooltip-header">
              <span className="tooltip-title">
                {hoveredLink.link.sourceName} → {hoveredLink.link.targetName}
              </span>
              <span className={`tooltip-status-tag ${hoveredLink.link.status}`}>
                {hoveredLink.link.status.toUpperCase()}
              </span>
            </div>
            <div className="tooltip-stats-grid">
              <div className="tooltip-cell">
                <span>UTILIZATION</span>
                <strong style={{ color: hoveredLink.link.utilizationPercent >= 90 ? "var(--critical)" : undefined }}>
                  {hoveredLink.link.utilizationPercent}%
                </strong>
              </div>
              <div className="tooltip-cell">
                <span>THROUGHPUT</span>
                <strong>{hoveredLink.link.throughputMbps} Mbps</strong>
              </div>
              <div className="tooltip-cell">
                <span>ACTIVE FLOWS</span>
                <strong>{hoveredLink.link.activeFlowsCount}</strong>
              </div>
              <div className="tooltip-cell">
                <span>PACKET LOSS</span>
                <strong>{hoveredLink.link.packetLossPercent}%</strong>
              </div>
            </div>
            <span className="tooltip-click-hint">Click link to inspect & simulate</span>
          </div>
        </div>
      )}

      {/* Floating Spatial Node Hover Tooltip */}
      {hoveredNode && (
        <div
          className="traffic-node-tooltip"
          style={{
            position: "fixed",
            left: hoveredNode.pos.x + 14,
            top: hoveredNode.pos.y - 20,
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          <div className="traffic-tooltip-card">
            <div className="tooltip-header">
              <span className="tooltip-title">{hoveredNode.node.name}</span>
              <span className={`tooltip-status-tag ${hoveredNode.node.status}`}>
                {hoveredNode.node.status.toUpperCase()}
              </span>
            </div>
            <div className="tooltip-stats-grid">
              <div className="tooltip-cell">
                <span>ROLE</span>
                <strong>{hoveredNode.node.type.toUpperCase()} SWITCH</strong>
              </div>
              <div className="tooltip-cell">
                <span>SYSTEMS</span>
                <strong>{hoveredNode.node.connectedSystems || 22}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Viewport Control Bar */}
      <div className="topology-viewport-controls">
        <button
          type="button"
          className="viewport-btn"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          type="button"
          className="viewport-btn"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          type="button"
          className="viewport-btn"
          onClick={handleFitView}
          title="Fit Topology to View"
        >
          <Maximize2 size={14} />
        </button>
        <button
          type="button"
          className="viewport-btn"
          onClick={handleResetView}
          title="Reset Zoom / Pan"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Interactive Helper Hint */}
      <div className="traffic-topology-hint">
        {selectedFlow ? (
          <span>
            <Zap size={12} style={{ display: "inline", marginRight: "4px", color: "var(--accent)" }} />
            Highlighting Path: <strong>{selectedFlow.id}</strong> ({selectedFlow.sourceName} → {selectedFlow.destinationName})
          </span>
        ) : (
          <span>Click link to inspect telemetry & trigger congestion simulation</span>
        )}
      </div>
    </div>
  );
}
