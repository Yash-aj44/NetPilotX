export default function TrafficLegend() {
  return (
    <div className="traffic-legend-bar">
      <span className="traffic-legend-title">LINK UTILIZATION:</span>
      <span className="legend-item">
        <i className="legend-dot" style={{ background: "var(--healthy)" }} />
        &lt; 40% Normal
      </span>
      <span className="legend-item">
        <i className="legend-dot" style={{ background: "#7D8899" }} />
        40–70% Moderate
      </span>
      <span className="legend-item">
        <i className="legend-dot" style={{ background: "var(--degraded)" }} />
        70–90% High
      </span>
      <span className="legend-item">
        <i className="legend-dot pulse" style={{ background: "var(--critical)" }} />
        &gt; 90% Congested
      </span>
      <span className="legend-item">
        <i className="legend-dot" style={{ background: "#C85C52", border: "1px dashed #fff" }} />
        Down
      </span>
      <span className="legend-item">
        <i className="legend-dot" style={{ background: "var(--accent)", boxShadow: "0 0 6px var(--accent)" }} />
        Active Flow Path
      </span>
    </div>
  );
}
