import { useEffect, useRef } from "react";

export default function AuthBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    let offset = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep atmospheric background gradient
      const bgGradient = ctx.createRadialGradient(
        width * 0.7,
        height * 0.3,
        50,
        width * 0.5,
        height * 0.5,
        width * 0.8
      );
      bgGradient.addColorStop(0, "#081722");
      bgGradient.addColorStop(0.5, "#06111A");
      bgGradient.addColorStop(1, "#03070D");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Quiet technical grid lines
      ctx.strokeStyle = "rgba(23, 51, 68, 0.35)";
      ctx.lineWidth = 1;
      const gridSize = 64;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      offset = (offset + 0.15) % gridSize;
      for (let y = offset; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Subtle cyan accent horizon glow line
      ctx.strokeStyle = "rgba(0, 200, 255, 0.08)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.4);
      ctx.lineTo(width, height * 0.4);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
