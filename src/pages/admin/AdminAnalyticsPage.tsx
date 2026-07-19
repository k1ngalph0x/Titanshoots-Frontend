import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { fetchAnalytics, type Analytics } from "../../api/admin";
import TechFrame from "../../components/TechFrame";

const RANGES = [
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
  { days: 90, label: "90D" },
];
const rupees = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;
const CAT_COLORS = ["#f0164a", "#12855a", "#b45309", "#6d28d9"];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics(days).then(setData);
  }, [days]);

  const chartData =
    data?.daily.map((d) => ({
      day: new Date(d.day).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
      revenue: d.revenue_paise / 100,
      games: d.games,
    })) ?? [];

  const catData =
    data?.by_category.map((c) => ({
      name: c.category,
      revenue: c.revenue_paise / 100,
      games: c.games,
    })) ?? [];

  const stats = data
    ? [
        { label: "Revenue", value: rupees(data.revenue_paise) },
        { label: "Games played", value: data.games },
        { label: "Total players", value: data.players },
        {
          label: "Cash / UPI",
          value: `${data.by_method.cash?.count ?? 0} / ${data.by_method.upi?.count ?? 0}`,
        },
      ]
    : [];

  return (
    <div>
      <div className="tech-label mb-2" style={{ color: "var(--accent)" }}>
        ※ Intel
      </div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold tracking-tight">ANALYTICS</h1>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className="px-4 py-2 tech-label clip-corner"
              style={{
                background: days === r.days ? "var(--accent)" : "transparent",
                color: days === r.days ? "#fff" : "var(--ink-soft)",
                border: `1px solid ${days === r.days ? "var(--accent)" : "var(--line)"}`,
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {!data && (
        <div className="tech-label blink" style={{ color: "var(--ink-muted)" }}>
          ◆ Crunching…
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-4 mb-6">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <TechFrame className="p-5">
                  <div
                    className="tech-label mb-2"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {s.label}
                  </div>
                  <div
                    className="text-3xl font-bold tabular-nums"
                    style={{ color: "var(--accent)" }}
                  >
                    {s.value}
                  </div>
                </TechFrame>
              </motion.div>
            ))}
          </div>

          <TechFrame className="p-5 mb-6">
            <div
              className="tech-label mb-4"
              style={{ color: "var(--ink-muted)" }}
            >
              Revenue trend
            </div>
            {chartData.length === 0 ? (
              <div
                className="tech-label py-12 text-center"
                style={{ color: "var(--ink-muted)" }}
              >
                No confirmed bookings in this range yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f0164a" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#f0164a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "var(--ink-muted)" }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--line-strong)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [
                      `₹${v.toLocaleString("en-IN")}`,
                      "Revenue",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f0164a"
                    strokeWidth={2}
                    fill="url(#rev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </TechFrame>

          <div className="grid gap-6 lg:grid-cols-2">
            <TechFrame className="p-5">
              <div
                className="tech-label mb-4"
                style={{ color: "var(--ink-muted)" }}
              >
                Revenue by gun class
              </div>
              {catData.length === 0 ? (
                <div
                  className="tech-label py-12 text-center"
                  style={{ color: "var(--ink-muted)" }}
                >
                  No data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={catData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--line)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "var(--ink-muted)" }} />
                    <Tooltip
                      cursor={{ fill: "var(--accent-wash)" }}
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--line-strong)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [
                        `₹${v.toLocaleString("en-IN")}`,
                        "Revenue",
                      ]}
                    />
                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                      {catData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CAT_COLORS[i % CAT_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </TechFrame>

            <TechFrame className="p-5">
              <div
                className="tech-label mb-4"
                style={{ color: "var(--ink-muted)" }}
              >
                Breakdown
              </div>
              <div className="space-y-3">
                {data.by_category.map((c, i) => (
                  <div
                    key={c.category}
                    className="flex items-center justify-between pb-3"
                    style={{ borderBottom: "1px solid var(--line)" }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 clip-corner"
                        style={{
                          background: CAT_COLORS[i % CAT_COLORS.length],
                        }}
                      />
                      <span className="font-medium">{c.category}</span>
                    </div>
                    <div className="text-right">
                      <div
                        className="font-bold"
                        style={{ color: "var(--accent)" }}
                      >
                        {rupees(c.revenue_paise)}
                      </div>
                      <div
                        className="tech-label"
                        style={{ color: "var(--ink-muted)" }}
                      >
                        {c.games} games · {c.players} players
                      </div>
                    </div>
                  </div>
                ))}
                {data.by_category.length === 0 && (
                  <div
                    className="tech-label"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    No confirmed bookings yet
                  </div>
                )}
              </div>
            </TechFrame>
          </div>
        </>
      )}
    </div>
  );
}
