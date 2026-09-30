import { useEffect, useRef, useState, type RefObject } from "react";

interface VariableProximityProps {
  label: string;
  className?: string;
  radius?: number;
  containerRef?: RefObject<HTMLElement | null>;
}

export default function VariableProximity({
  label,
  className = "",
  radius = 140,
}: VariableProximityProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
    }
    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, []);

  const letters = label.split("");

  return (
    <div ref={containerRef} className={`inline-flex flex-wrap ${className}`}>
      {letters.map((char, index) => {
        if (char === " ") {
          return <span key={index}>&nbsp;</span>;
        }

        let weight = 500;
        let letterSpacing = 2;

        if (containerRef.current) {
          const charEl = containerRef.current.children[index] as HTMLElement;
          if (charEl) {
            const charRect = charEl.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();
            const charX = charRect.left - containerRect.left + charRect.width / 2;
            const charY = charRect.top - containerRect.top + charRect.height / 2;

            const dist = Math.hypot(mousePos.x - charX, mousePos.y - charY);
            if (dist < radius) {
              const factor = 1 - dist / radius;
              weight = Math.round(500 + factor * 400); // 500 -> 900
              letterSpacing = 2 + factor * 4;
            }
          }
        }

        return (
          <span
            key={index}
            style={{
              fontWeight: weight,
              letterSpacing: `${letterSpacing}px`,
              transition: "font-weight 0.15s ease, letter-spacing 0.15s ease",
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
}
