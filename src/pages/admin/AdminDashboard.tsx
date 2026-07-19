import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { fetchAnalytics, type Analytics } from "../../api/admin";
import TechFrame from "../../components/TechFrame";

const money = (p: number) => `₹${Math.round(p / 100).toLocaleString("en-IN")}`;

export default function AdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [today, setToday] = useState<Analytics | null>(null);

  useEffect(() => {
    fetchAnalytics(7).then(setData); // week for the mini chart
    fetchAnalytics(1).then(setToday); // today for headline
  }, []);

  const cashCount = data?.by_method.cash?.count ?? 0;
  const upiCount = data?.by_method.upi?.count ?? 0;

  const chartData =
    data?.daily.map((d) => ({
      day: new Date(d.day).toLocaleDateString("en-IN", { weekday: "short" }),
      revenue: d.revenue_paise / 100,
    })) ?? [];

  const stats = [
    {
      label: "Today's revenue",
      value: today ? money(today.revenue_paise) : "—",
    },
    { label: "Bookings (7d)", value: data ? data.games : "—" },
    { label: "Players (7d)", value: data ? data.players : "—" },
    {
      label: "Cash / UPI (7d)",
      value: data ? `${cashCount} / ${upiCount}` : "—",
    },
  ];

  return (
    <div>
      <div className="tech-label mb-2" style={{ color: "var(--accent)" }}>
        ※ Overview
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-8">DASHBOARD</h1>

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
        <div className="flex items-center justify-between mb-4">
          <div className="tech-label" style={{ color: "var(--ink-muted)" }}>
            This week
          </div>
          <Link
            to="/admin/analytics"
            className="tech-label"
            style={{ color: "var(--accent)" }}
          >
            Full analytics →
          </Link>
        </div>
        {chartData.length === 0 ? (
          <div
            className="tech-label py-8 text-center"
            style={{ color: "var(--ink-muted)" }}
          >
            No confirmed bookings yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="dash-rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f0164a" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f0164a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--line-strong)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
                formatter={(v) => [
                  `₹${Number(v).toLocaleString("en-IN")}`,
                  "Revenue",
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#f0164a"
                strokeWidth={2}
                fill="url(#dash-rev)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </TechFrame>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { to: "/admin/analytics", label: "View analytics" },
          { to: "/admin/bookings", label: "Manage bookings" },
          { to: "/admin/pricing", label: "Edit pricing" },
        ].map((a) => (
          <Link key={a.to} to={a.to}>
            <TechFrame className="p-5">
              <div className="flex items-center justify-between">
                <span className="font-medium">{a.label}</span>
                <span style={{ color: "var(--accent)" }}>↗</span>
              </div>
            </TechFrame>
          </Link>
        ))}
      </div>
    </div>
  );
}
