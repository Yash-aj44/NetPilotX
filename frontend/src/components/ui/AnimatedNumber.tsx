import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}

export default function AnimatedNumber({
  value,
  suffix = "",
  duration = 0.5,
  className = "",
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;

    if (startValue === endValue) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      const current = Math.round(startValue + progress * (endValue - startValue));
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [value, duration]);

  return (
    <motion.span
      key={value}
      initial={{ opacity: 0.8, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`tabular-nums ${className}`}
    >
      {displayValue}
      {suffix}
    </motion.span>
  );
}
