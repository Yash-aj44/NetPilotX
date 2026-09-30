import { motion } from "framer-motion";
import type { ReactNode, ElementType } from "react";

interface TextRevealProps {
  children?: ReactNode;
  text?: string;
  className?: string;
  delay?: number;
  direction?: "up" | "down";
  as?: ElementType;
}

export default function TextReveal({
  children,
  text,
  className = "",
  delay = 0,
  direction = "up",
  as: Component = "span",
}: TextRevealProps) {
  const yOffset = direction === "up" ? 24 : -24;
  const content = text ?? children;

  return (
    <div style={{ overflow: "hidden", display: "inline-block" }}>
      <motion.div
        initial={{ y: yOffset, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 0.6,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <Component className={className}>{content}</Component>
      </motion.div>
    </div>
  );
}
