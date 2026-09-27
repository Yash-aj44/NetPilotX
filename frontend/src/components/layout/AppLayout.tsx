import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";
import CopilotPanel from "../copilot/CopilotPanel";

export default function AppLayout() {
  const location = useLocation();
  const [copilotOpen, setCopilotOpen] = useState(false);

  const pageEasing = "easeOut";

  return (
    <div className="app-shell">
      <Sidebar
        onOpenCopilot={() => setCopilotOpen(true)}
        copilotOpen={copilotOpen}
      />

      <div className="app-main">
        <Header onToggleCopilot={() => setCopilotOpen((prev) => !prev)} />

        <main className="page-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.32, ease: pageEasing }}
              className="page-transition-wrapper"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CopilotPanel
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />
    </div>
  );
}