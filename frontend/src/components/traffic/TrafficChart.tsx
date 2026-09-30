import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrafficHistoryPoint } from "../../types/traffic";

interface TrafficChartProps {
  data: TrafficHistoryPoint[];
}

export default function TrafficChart({ data }: TrafficChartProps) {
  return (
    <div className="traffic-chart-container">
      <div className="traffic-chart-header">
        <div>
          <span className="panel-eyebrow">TELEMETRY TREND</span>
          <h4 className="traffic-chart-title">Demand vs Delivered Throughput</h4>
        </div>
        <div className="traffic-chart-legend">
          <span className="chart-legend-badge">
            <span className="legend-line" style={{ background: "var(--accent)" }} /> Demand
          </span>
          <span className="chart-legend-badge">
            <span className="legend-line" style={{ background: "var(--healthy)" }} /> Delivered
          </span>
        </div>
      </div>

      <div style={{ width: "100%", height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#686761"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#292929" }}
            />
            <YAxis
              stroke="#686761"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
              tickFormatter={(v) => `${v}G`}
            />
            <Tooltip
              contentStyle={{
                background: "#101010",
                border: "1px solid #292929",
                borderRadius: 2,
                color: "#F2F0EA",
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
            <Line
              type="monotone"
              dataKey="demandGbps"
              name="Demand Gbps"
              stroke="#E9A52B"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="deliveredGbps"
              name="Delivered Gbps"
              stroke="#8FAF8F"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
