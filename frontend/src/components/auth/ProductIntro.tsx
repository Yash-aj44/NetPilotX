import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductIntroProps {
  onComplete: () => void;
}

export default function ProductIntro({ onComplete }: ProductIntroProps) {
  const [step, setStep] = useState<"blank" | "title" | "subtitle" | "transitioning">("blank");

  useEffect(() => {
    // Timeline sequence
    const t1 = setTimeout(() => setStep("title"), 200);
    const t2 = setTimeout(() => setStep("subtitle"), 700);
    const t3 = setTimeout(() => setStep("transitioning"), 1400);
    const t4 = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  const cubicEase = [0.22, 1, 0.36, 1] as const;

  return (
    <AnimatePresence>
      <motion.div
        className="product-intro-screen"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: cubicEase }}
      >
        <div className="intro-center-content">
          {step !== "blank" && (
            <motion.h1
              className="intro-brand-title"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={
                step === "transitioning"
                  ? { opacity: 0.9, y: -140, scale: 0.75 }
                  : { opacity: 1, y: 0, scale: 1 }
              }
              transition={{ duration: 0.6, ease: cubicEase }}
            >
              NETPILOT X
            </motion.h1>
          )}

          {(step === "subtitle" || step === "transitioning") && (
            <motion.p
              className="intro-brand-subtitle"
              initial={{ opacity: 0, y: 10 }}
              animate={
                step === "transitioning"
                  ? { opacity: 0, y: -120 }
                  : { opacity: 1, y: 0 }
              }
              transition={{ duration: 0.4, ease: cubicEase }}
            >
              AUTONOMOUS AI NETWORK ENGINEER
            </motion.p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
