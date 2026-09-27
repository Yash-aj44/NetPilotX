import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MonitoringChartProps {
  data: {
    time: string;
    cpu: number;
    memory: number;
    latency: number;
  }[];
}

function MonitoringChart({
  data,
}: MonitoringChartProps) {
  return (
    <div
      style={{
        width: "100%",
        height: 320,
      }}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="time" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="cpu"
            name="CPU %"
            strokeWidth={2}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="memory"
            name="Memory %"
            strokeWidth={2}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="latency"
            name="Latency ms"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MonitoringChart;