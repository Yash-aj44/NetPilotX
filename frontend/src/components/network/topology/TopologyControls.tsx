import { motion } from "framer-motion";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Layers } from "lucide-react";

interface TopologyControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onResetView: () => void;
  expandedEdgeId: string | null;
  onCollapseDrilldown: () => void;
}

export default function TopologyControls({
  onZoomIn,
  onZoomOut,
  onFitView,
  onResetView,
  expandedEdgeId,
  onCollapseDrilldown,
}: TopologyControlsProps) {
  return (
    <div className="topology-viewport-controls">
      <div className="controls-group">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onZoomIn}
          className="ctrl-btn"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onZoomOut}
          className="ctrl-btn"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onFitView}
          className="ctrl-btn"
          title="Fit View"
        >
          <Maximize2 size={16} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onResetView}
          className="ctrl-btn"
          title="Reset Zoom"
        >
          <RotateCcw size={16} />
        </motion.button>
      </div>

      {expandedEdgeId && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          type="button"
          onClick={onCollapseDrilldown}
          className="drilldown-active-pill"
        >
          <Layers size={14} className="text-cyan-400" />
          <span>Viewing {expandedEdgeId.toUpperCase()} Endpoints</span>
          <span className="close-x">×</span>
        </motion.button>
      )}
    </div>
  );
}
