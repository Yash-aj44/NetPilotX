import * as d3 from "d3";
import type { RenderLink, RenderNode } from "./topologyLayout";

export interface TopologyRenderCallbacks {
  onNodeClick: (node: RenderNode) => void;
  onNodeDoubleClick: (node: RenderNode) => void;
}

export function renderD3Topology(
  svgElement: SVGSVGElement,
  nodes: RenderNode[],
  links: RenderLink[],
  selectedNodeId: string | null,
  expandedEdgeId: string | null,
  callbacks: TopologyRenderCallbacks
) {
  const svg = d3.select(svgElement);

  // Root container for zoom/pan transformations
  let container = svg.select<SVGGElement>("g.topology-root-container");
  if (container.empty()) {
    container = svg.append("g").attr("class", "topology-root-container");
    container.append("g").attr("class", "links-layer");
    container.append("g").attr("class", "packet-particles-group");
    container.append("g").attr("class", "nodes-layer");
  }

  const linksLayer = container.select<SVGGElement>("g.links-layer");
  const nodesLayer = container.select<SVGGElement>("g.nodes-layer");

  // -----------------------------------------------------------------
  // 1. LINKS RENDERING (D3 Data Join)
  // -----------------------------------------------------------------
  const linkPathGenerator = (d: RenderLink) => {
    if (d.id.includes("ep-")) {
      return `M ${d.sourceX} ${d.sourceY} L ${d.targetX} ${d.targetY}`;
    }
    return `M ${d.sourceX} ${d.sourceY} Q ${(d.sourceX + d.targetX) / 2} ${(d.sourceY + d.targetY) / 2 - 12} ${d.targetX} ${d.targetY}`;
  };

  const linkSelection = linksLayer
    .selectAll<SVGPathElement, RenderLink>("path.topology-link")
    .data(links, (d) => d.id);

  linkSelection.exit().remove();

  const linkEnter = linkSelection
    .enter()
    .append("path")
    .attr("class", "topology-link")
    .attr("id", (d) => `link-${d.id}`);

  linkSelection
    .merge(linkEnter)
    .attr("id", (d) => `link-path-${d.id}`)
    .attr("d", linkPathGenerator)
    .attr("stroke", (d) => (d.status === "down" ? "#FF3B3B" : "#00C8FF"))
    .attr("stroke-width", (d) => (d.id.includes("ep-") ? 1.5 : 2.5))
    .attr("stroke-opacity", (d) => (d.status === "down" ? 0.85 : 0.4))
    .attr("stroke-dasharray", (d) => (d.status === "down" ? "6,6" : "none"));

  // -----------------------------------------------------------------
  // 2. TECHNICAL CUSTOM SVG NODE PRIMITIVES (D3 Data Join)
  // -----------------------------------------------------------------
  const nodeSelection = nodesLayer
    .selectAll<SVGGElement, RenderNode>("g.topology-node-group")
    .data(nodes, (d) => d.id);

  nodeSelection.exit().remove();

  const nodeEnter = nodeSelection
    .enter()
    .append("g")
    .attr("class", "topology-node-group")
    .attr("id", (d) => `node-group-${d.id}`)
    .style("cursor", "pointer");

  nodeEnter.each(function (d) {
    const group = d3.select(this);

    // Subtle Selection Outline Ring
    group
      .append("rect")
      .attr("class", "node-glow-ring")
      .attr("x", d.isEndpoint ? -16 : d.type === "core" ? -36 : -28)
      .attr("y", d.isEndpoint ? -16 : d.type === "core" ? -28 : -22)
      .attr("width", d.isEndpoint ? 32 : d.type === "core" ? 72 : 56)
      .attr("height", d.isEndpoint ? 32 : d.type === "core" ? 56 : 44)
      .attr("rx", d.isEndpoint ? 6 : 4)
      .attr("fill", "none")
      .attr("stroke", d.status === "down" ? "#FF3B3B" : "#00C8FF")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0);

    // Chassis Box
    if (d.isEndpoint) {
      group
        .append("rect")
        .attr("class", "node-base")
        .attr("x", -14)
        .attr("y", -14)
        .attr("width", 28)
        .attr("height", 28)
        .attr("rx", 4)
        .attr("fill", "#081722")
        .attr("stroke", d.status === "down" ? "#FF3B3B" : "#173344")
        .attr("stroke-width", 1.5);
    } else if (d.type === "core") {
      // Core Chassis Module (Large Architectural Box with top bar)
      group
        .append("rect")
        .attr("class", "node-base")
        .attr("x", -32)
        .attr("y", -24)
        .attr("width", 64)
        .attr("height", 48)
        .attr("rx", 4)
        .attr("fill", "#081722")
        .attr("stroke", d.status === "down" ? "#FF3B3B" : "#173344")
        .attr("stroke-width", 2);

      // Top Accent Line
      group
        .append("line")
        .attr("x1", -32)
        .attr("y1", -16)
        .attr("x2", 32)
        .attr("y2", -16)
        .attr("stroke", d.status === "down" ? "#FF3B3B" : "#00C8FF")
        .attr("stroke-width", 1.5);
    } else {
      // Distribution & Edge Chassis Modules
      group
        .append("rect")
        .attr("class", "node-base")
        .attr("x", -25)
        .attr("y", -18)
        .attr("width", 50)
        .attr("height", 36)
        .attr("rx", 4)
        .attr("fill", "#081722")
        .attr("stroke", d.status === "down" ? "#FF3B3B" : "#173344")
        .attr("stroke-width", 1.5);
    }

    // Technical Code Symbol Label
    group
      .append("text")
      .attr("class", "node-symbol")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("y", d.type === "core" ? 4 : 0)
      .attr("font-size", d.isEndpoint ? "9px" : "11px")
      .attr("font-family", "monospace")
      .attr("font-weight", "700")
      .attr("fill", "#F4F8FB")
      .text(
        d.isEndpoint
          ? d.endpointType?.substring(0, 3).toUpperCase() || "SYS"
          : d.type === "core"
          ? "CORE"
          : d.type === "distribution"
          ? "DIST"
          : "EDGE"
      );

    // Node Name Tag Label below node
    group
      .append("text")
      .attr("class", "node-label")
      .attr("y", d.isEndpoint ? 24 : d.type === "core" ? 38 : 32)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .attr("font-family", "monospace")
      .attr("fill", "#8DA2B5")
      .text(d.name);

    // Status Indicator Dot
    group
      .append("circle")
      .attr("class", "node-status-dot")
      .attr("cx", d.isEndpoint ? 8 : d.type === "core" ? 20 : 16)
      .attr("cy", d.isEndpoint ? -8 : d.type === "core" ? -14 : -10)
      .attr("r", 3)
      .attr("fill", d.status === "down" ? "#FF3B3B" : "#00E676");
  });

  const mergedNodes = nodeSelection.merge(nodeEnter);

  mergedNodes
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
    .on("click", (event, d) => {
      event.stopPropagation();
      callbacks.onNodeClick(d);
    })
    .on("dblclick", (event, d) => {
      event.stopPropagation();
      callbacks.onNodeDoubleClick(d);
    });

  // Highlight Selected & Expanded State
  mergedNodes.each(function (d) {
    const group = d3.select(this);
    const isSelected = d.id === selectedNodeId;
    const isExpanded = d.id === expandedEdgeId;

    group
      .select(".node-base")
      .attr("stroke", d.status === "down" ? "#FF3B3B" : isSelected || isExpanded ? "#00C8FF" : "#173344")
      .attr("stroke-width", isSelected || isExpanded ? 2.5 : 1.5);

    group
      .select(".node-glow-ring")
      .attr("opacity", isSelected || isExpanded ? 0.7 : 0)
      .attr("stroke", d.status === "down" ? "#FF3B3B" : "#00C8FF");

    group
      .select(".node-label")
      .attr("fill", isSelected ? "#F4F8FB" : "#8DA2B5");
  });
}
