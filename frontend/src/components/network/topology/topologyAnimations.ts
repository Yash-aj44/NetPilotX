import gsap from "gsap";
import type { RenderLink } from "./topologyLayout";

export function animateNodeStateChange(nodeId: string, status: string) {
  const element = document.getElementById(`node-group-${nodeId}`);
  if (!element) return;

  if (status === "down") {
    gsap.timeline()
      .to(element, { opacity: 0.5, duration: 0.15, repeat: 3, yoyo: true })
      .to(element, { opacity: 1, duration: 0.15 });

    const glowCircle = element.querySelector(".node-glow-ring");
    if (glowCircle) {
      gsap.to(glowCircle, {
        stroke: "#FF3B3B",
        strokeWidth: 4,
        opacity: 0.9,
        duration: 0.3,
      });
      gsap.to(glowCircle, {
        opacity: 0.3,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }
  } else if (status === "up") {
    const glowCircle = element.querySelector(".node-glow-ring");
    if (glowCircle) {
      gsap.killTweensOf(glowCircle);
      gsap.timeline()
        .to(glowCircle, { stroke: "#00E676", strokeWidth: 5, opacity: 1, duration: 0.3 })
        .to(glowCircle, { strokeWidth: 2, opacity: 0.4, duration: 0.4 });
    }
  }
}

export function animateCascadingFailure(failedNodeId: string, affectedLinkIds: string[]) {
  const tl = gsap.timeline();
  tl.add(() => animateNodeStateChange(failedNodeId, "down"));

  affectedLinkIds.forEach((linkId) => {
    tl.to(
      `#link-path-${linkId}`,
      {
        stroke: "#FF3B3B",
        strokeDasharray: "6,6",
        duration: 0.25,
        ease: "power2.inOut",
      },
      `+=0.06`
    );
  });
}

export function animateRecoveryCascade(recoveredNodeId: string, restoredLinkIds: string[]) {
  const tl = gsap.timeline();

  restoredLinkIds.forEach((linkId) => {
    tl.to(
      `#link-path-${linkId}`,
      {
        stroke: "#00C8FF",
        strokeDasharray: "none",
        duration: 0.3,
      },
      `+=0.05`
    );
  });

  tl.add(() => animateNodeStateChange(recoveredNodeId, "up"));
}

export function animateTopologyConstruction(
  svgContainer: SVGSVGElement | null,
  onComplete?: () => void
) {
  if (!svgContainer) return;

  const coreNode = svgContainer.querySelector("#node-group-CORE-01");
  const distNodes = svgContainer.querySelectorAll('[id^="node-group-DIST-"]');
  const edgeNodes = svgContainer.querySelectorAll('[id^="node-group-EDGE-"]');
  const primaryLinks = svgContainer.querySelectorAll("path.topology-link");

  const tl = gsap.timeline({
    onComplete: () => {
      if (onComplete) onComplete();
    },
  });

  // 1. Set Initial Opacities
  if (coreNode) gsap.set(coreNode, { opacity: 0 });
  if (distNodes.length) gsap.set(distNodes, { opacity: 0 });
  if (edgeNodes.length) gsap.set(edgeNodes, { opacity: 0 });
  if (primaryLinks.length) gsap.set(primaryLinks, { opacity: 0 });

  // 2. CORE-01 reveals
  if (coreNode) {
    tl.to(coreNode, {
      opacity: 1,
      duration: 0.4,
      ease: "power2.out",
    });
  }

  // 3. Distribution switches reveal
  if (distNodes.length) {
    tl.to(
      distNodes,
      {
        opacity: 1,
        duration: 0.35,
        stagger: 0.08,
        ease: "power2.out",
      },
      "-=0.15"
    );
  }

  // 4. Primary Links draw
  if (primaryLinks.length) {
    tl.to(
      primaryLinks,
      {
        opacity: 0.6,
        duration: 0.35,
        stagger: 0.04,
        ease: "power2.out",
      },
      "-=0.1"
    );
  }

  // 5. Edge switches reveal
  if (edgeNodes.length) {
    tl.to(
      edgeNodes,
      {
        opacity: 1,
        duration: 0.3,
        stagger: 0.05,
        ease: "power2.out",
      },
      "-=0.15"
    );
  }
}

export function createPacketFlowParticles(
  svgContainer: SVGSVGElement | null,
  links: RenderLink[]
): () => void {
  if (!svgContainer) return () => {};

  const activeLinks = links.filter((l) => l.status === "up");
  const particleGroup = svgContainer.querySelector(".packet-particles-group");
  if (!particleGroup) return () => {};

  // Clean old particles
  particleGroup.innerHTML = "";

  const tweens: gsap.core.Tween[] = [];

  activeLinks.forEach((link) => {
    const pathEl = svgContainer.querySelector(`#link-path-${link.id}`) as SVGPathElement | null;
    if (!pathEl) return;

    try {
      const pathLength = pathEl.getTotalLength();
      if (pathLength === 0) return;

      // Create 2 packet particles per link
      for (let i = 0; i < 2; i++) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("r", "3");
        circle.setAttribute("fill", "#00C8FF");
        circle.setAttribute("filter", "drop-shadow(0 0 4px #00C8FF)");
        particleGroup.appendChild(circle);

        const obj = { progress: i * 0.5 };
        const tween = gsap.to(obj, {
          progress: "+=1",
          duration: 2.2 + Math.random() * 0.8,
          repeat: -1,
          ease: "none",
          onUpdate: () => {
            const normProg = obj.progress % 1;
            const pt = pathEl.getPointAtLength(normProg * pathLength);
            circle.setAttribute("cx", String(pt.x));
            circle.setAttribute("cy", String(pt.y));
            const fade = Math.sin(normProg * Math.PI);
            circle.setAttribute("opacity", String(fade * 0.85));
          },
        });
        tweens.push(tween);
      }
    } catch (e) {
      // Path element error fallback
    }
  });

  return () => {
    tweens.forEach((t) => t.kill());
    if (particleGroup) particleGroup.innerHTML = "";
  };
}
