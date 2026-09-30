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

function MonitoringChart({ data }: MonitoringChartProps) {
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#292929" />
          <XAxis dataKey="time" stroke="#686761" fontSize={11} tickLine={false} />
          <YAxis stroke="#686761" fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "#101010",
              border: "1px solid #292929",
              borderRadius: 2,
              color: "#F2F0EA",
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
          <Line
            type="monotone"
            dataKey="cpu"
            name="CPU %"
            stroke="#E9A52B"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="memory"
            name="Memory %"
            stroke="#8FAF8F"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="latency"
            name="Latency ms"
            stroke="#A6A39C"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MonitoringChart;