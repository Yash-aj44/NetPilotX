import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface CountUpProps {
  value?: number;
  to?: number;
  from?: number;
  suffix?: string;
  duration?: number;
  separator?: string;
  className?: string;
  delay?: number;
  direction?: "up" | "down";
}

export default function CountUp({
  value,
  to,
  from = 0,
  suffix = "",
  duration = 0.9,
  separator = "",
  className = "",
}: CountUpProps) {
  const targetValue = to ?? value ?? 0;
  const [displayValue, setDisplayValue] = useState(from);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startVal = displayValue;
    const endVal = targetValue;

    if (startVal === endVal) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      // Premium cubic ease-out
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + easeProgress * (endVal - startVal));
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [targetValue, duration]);

  const formattedStr = separator
    ? displayValue.toLocaleString()
    : displayValue.toString();

  return (
    <motion.span
      className={`tabular-nums ${className}`}
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {formattedStr}
      {suffix}
    </motion.span>
  );
}
