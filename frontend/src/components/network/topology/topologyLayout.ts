import type { NetworkEdge, NetworkNode } from "../../../types/network";

export interface TopologyPosition {
  x: number;
  y: number;
}

export interface RenderNode extends NetworkNode {
  x: number;
  y: number;
  isEndpoint?: boolean;
  endpointType?: "Workstation" | "Server" | "Printer" | "IoT";
}

export interface RenderLink extends NetworkEdge {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

export function computeDeterministicLayout(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  expandedEdgeId: string | null,
  containerWidth: number = 1000
): { layoutNodes: RenderNode[]; layoutLinks: RenderLink[] } {
  const nodeMap = new Map<string, RenderNode>();

  // Fixed Canvas Bounds
  const width = Math.max(containerWidth, 920);
  const centerX = width / 2;

  // Level Y coordinates (Optimized for 100% viewport visibility)
  const yCore = 55;
  const yDist = 170;
  const yEdge = 285;
  const yEndpoint = 395;

  // 1. CORE NODE
  const coreNode = nodes.find((n) => n.type === "core") || nodes[0];
  if (coreNode) {
    nodeMap.set(coreNode.id, {
      ...coreNode,
      x: centerX,
      y: yCore,
    });
  }

  // 2. DISTRIBUTION NODES (DIST-01, DIST-02, DIST-03)
  const distNodes = nodes.filter((n) => n.type === "distribution");
  const distSpacing = Math.min(260, width / 3.4);
  const distStartX = centerX - ((distNodes.length - 1) * distSpacing) / 2;

  distNodes.forEach((node, idx) => {
    nodeMap.set(node.id, {
      ...node,
      x: distStartX + idx * distSpacing,
      y: yDist,
    });
  });

  // 3. EDGE NODES (EDGE-01 .. EDGE-09 grouped under parents)
  const edgeNodes = nodes.filter((n) => n.type === "edge");

  distNodes.forEach((dist) => {
    const children = edgeNodes.filter((e) => e.parentId === dist.id);
    const parentPos = nodeMap.get(dist.id);
    const parentX = parentPos ? parentPos.x : centerX;

    const childSpacing = 74;
    const childStartX = parentX - ((children.length - 1) * childSpacing) / 2;

    children.forEach((edgeNode, idx) => {
      nodeMap.set(edgeNode.id, {
        ...edgeNode,
        x: childStartX + idx * childSpacing,
        y: yEdge,
      });
    });
  });

  // 4. LEVEL 2: ENDPOINT DRILL-DOWN (If an Edge node is expanded)
  const endpointNodes: RenderNode[] = [];
  const endpointEdges: RenderLink[] = [];

  if (expandedEdgeId) {
    const targetEdgeNode = nodeMap.get(expandedEdgeId);
    if (targetEdgeNode) {
      const count = targetEdgeNode.connectedSystems || 20;
      const cols = Math.min(count, 10);
      const itemSpacingX = 52;
      const itemSpacingY = 40;
      const gridStartX = targetEdgeNode.x - ((cols - 1) * itemSpacingX) / 2;
      for (let i = 0; i < count; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const epId = `ep-${expandedEdgeId}-${i + 1}`;

        let epType: "Workstation" | "Server" | "Printer" | "IoT" = "Workstation";
        if (i % 8 === 1) epType = "Server";
        else if (i % 8 === 4) epType = "Printer";
        else if (i % 8 === 7) epType = "IoT";

        const epX = gridStartX + c * itemSpacingX;
        const epY = yEndpoint + r * itemSpacingY;

        const isDown = targetEdgeNode.status === "down";

        const epNode: RenderNode = {
          id: epId,
          name: `SYS-${String(i + 1).padStart(2, "0")}`,
          type: "workstation",
          status: isDown ? "down" : "up",
          connectedSystems: 0,
          parentId: targetEdgeNode.id,
          x: epX,
          y: epY,
          isEndpoint: true,
          endpointType: epType,
        };

        endpointNodes.push(epNode);

        endpointEdges.push({
          id: `link-${expandedEdgeId}-${epId}`,
          source: expandedEdgeId,
          target: epId,
          status: isDown ? "down" : "up",
          sourceX: targetEdgeNode.x,
          sourceY: targetEdgeNode.y,
          targetX: epX,
          targetY: epY,
        });
      }
    }
  }

  const layoutNodes: RenderNode[] = [
    ...Array.from(nodeMap.values()),
    ...endpointNodes,
  ];

  // Map Primary Edges coordinates
  const layoutLinks: RenderLink[] = [
    ...edges
      .map((edge) => {
        const s = nodeMap.get(edge.source);
        const t = nodeMap.get(edge.target);
        if (!s || !t) return null;
        return {
          ...edge,
          sourceX: s.x,
          sourceY: s.y,
          targetX: t.x,
          targetY: t.y,
        };
      })
      .filter((link): link is RenderLink => link !== null),
    ...endpointEdges,
  ];

  return { layoutNodes, layoutLinks };
}
