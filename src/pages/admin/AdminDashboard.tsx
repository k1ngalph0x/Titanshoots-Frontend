// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { motion } from "framer-motion";
// import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
// import { fetchAnalytics, type Analytics } from "../../api/admin";
// import TechFrame from "../../components/TechFrame";

// const money = (p: number) => `₹${Math.round(p / 100).toLocaleString("en-IN")}`;

// export default function AdminDashboard() {
//   const [data, setData] = useState<Analytics | null>(null);
//   const [today, setToday] = useState<Analytics | null>(null);

//   useEffect(() => {
//     fetchAnalytics(7).then(setData); // week for the mini chart
//     fetchAnalytics(1).then(setToday); // today for headline
//   }, []);

//   const cashCount = data?.by_method.cash?.count ?? 0;
//   const upiCount = data?.by_method.upi?.count ?? 0;

//   const chartData =
//     data?.daily.map((d) => ({
//       day: new Date(d.day).toLocaleDateString("en-IN", { weekday: "short" }),
//       revenue: d.revenue_paise / 100,
//     })) ?? [];

//   const stats = [
//     {
//       label: "Today's revenue",
//       value: today ? money(today.revenue_paise) : "—",
//     },
//     { label: "Bookings (7d)", value: data ? data.games : "—" },
//     { label: "Players (7d)", value: data ? data.players : "—" },
//     {
//       label: "Cash / UPI (7d)",
//       value: data ? `${cashCount} / ${upiCount}` : "—",
//     },
//   ];

//   return (
//     <div>
//       <div className="tech-label mb-2" style={{ color: "var(--accent)" }}>
//         ※ Overview
//       </div>
//       <h1 className="text-4xl font-bold tracking-tight mb-8">DASHBOARD</h1>

//       <div className="grid gap-4 sm:grid-cols-4 mb-6">
//         {stats.map((s, i) => (
//           <motion.div
//             key={s.label}
//             initial={{ opacity: 0, y: 12 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: i * 0.06 }}
//           >
//             <TechFrame className="p-5">
//               <div
//                 className="tech-label mb-2"
//                 style={{ color: "var(--ink-muted)" }}
//               >
//                 {s.label}
//               </div>
//               <div
//                 className="text-3xl font-bold tabular-nums"
//                 style={{ color: "var(--accent)" }}
//               >
//                 {s.value}
//               </div>
//             </TechFrame>
//           </motion.div>
//         ))}
//       </div>

//       <TechFrame className="p-5 mb-6">
//         <div className="flex items-center justify-between mb-4">
//           <div className="tech-label" style={{ color: "var(--ink-muted)" }}>
//             This week
//           </div>
//           <Link
//             to="/admin/analytics"
//             className="tech-label"
//             style={{ color: "var(--accent)" }}
//           >
//             Full analytics →
//           </Link>
//         </div>
//         {chartData.length === 0 ? (
//           <div
//             className="tech-label py-8 text-center"
//             style={{ color: "var(--ink-muted)" }}
//           >
//             No confirmed bookings yet
//           </div>
//         ) : (
//           <ResponsiveContainer width="100%" height={180}>
//             <AreaChart data={chartData}>
//               <defs>
//                 <linearGradient id="dash-rev" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="0%" stopColor="#f0164a" stopOpacity={0.35} />
//                   <stop offset="100%" stopColor="#f0164a" stopOpacity={0} />
//                 </linearGradient>
//               </defs>
//               <XAxis
//                 dataKey="day"
//                 tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
//               />
//               <Tooltip
//                 contentStyle={{
//                   background: "var(--surface)",
//                   border: "1px solid var(--line-strong)",
//                   fontFamily: "var(--font-mono)",
//                   fontSize: 12,
//                 }}
//                 formatter={(v) => [
//                   `₹${Number(v).toLocaleString("en-IN")}`,
//                   "Revenue",
//                 ]}
//               />
//               <Area
//                 type="monotone"
//                 dataKey="revenue"
//                 stroke="#f0164a"
//                 strokeWidth={2}
//                 fill="url(#dash-rev)"
//               />
//             </AreaChart>
//           </ResponsiveContainer>
//         )}
//       </TechFrame>

//       <div className="grid gap-4 sm:grid-cols-3">
//         {[
//           { to: "/admin/analytics", label: "View analytics" },
//           { to: "/admin/bookings", label: "Manage bookings" },
//           { to: "/admin/pricing", label: "Edit pricing" },
//         ].map((a) => (
//           <Link key={a.to} to={a.to}>
//             <TechFrame className="p-5">
//               <div className="flex items-center justify-between">
//                 <span className="font-medium">{a.label}</span>
//                 <span style={{ color: "var(--accent)" }}>↗</span>
//               </div>
//             </TechFrame>
//           </Link>
//         ))}
//       </div>
//     </div>
//   );
// }
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { fetchAnalytics, type Analytics } from "../../api/admin";
import Card from "../../components/Card";

const money = (p: number) => `₹${Math.round(p / 100).toLocaleString("en-IN")}`;

const LABEL: React.CSSProperties = { color: "var(--ink-muted)", fontSize: 13 };
const NUM: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontVariantNumeric: "tabular-nums",
};

/* Backend returns only days that have bookings. Scaffold the full week
   so the chart always has a continuous series. */
function buildWeek(daily: Analytics["daily"] | undefined) {
  const byDay = new Map(
    (daily ?? []).map((d) => [new Date(d.day).toDateString(), d]),
  );
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const hit = byDay.get(d.toDateString());
    out.push({
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      full: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      revenue: hit ? hit.revenue_paise / 100 : 0,
      games: hit?.games ?? 0,
    });
  }
  return out;
}

function Skeleton({ w = "60%", h = 14 }: { w?: number | string; h?: number }) {
  return (
    <span
      className="block animate-pulse"
      style={{
        width: w,
        height: h,
        borderRadius: 3,
        background: "var(--surface-dim)",
      }}
    />
  );
}

function Stat({
  label,
  value,
  loading,
  accent = false,
  sub,
}: {
  label: string;
  value: string;
  loading: boolean;
  accent?: boolean;
  sub?: string;
}) {
  return (
    <Card className="px-5 py-4">
      <div style={LABEL}>{label}</div>
      {loading ? (
        <div className="mt-2.5">
          <Skeleton w="70%" h={28} />
        </div>
      ) : (
        <div
          className="mt-1.5 text-3xl font-semibold leading-none"
          style={{ ...NUM, color: accent ? "var(--accent)" : "var(--ink)" }}
        >
          {value}
        </div>
      )}
      {sub && (
        <div className="mt-2" style={{ ...LABEL, fontSize: 12 }}>
          {sub}
        </div>
      )}
    </Card>
  );
}

function ChartTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div
      className="px-3 py-2"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 4,
      }}
    >
      <div style={{ ...LABEL, fontSize: 12 }}>{p.full}</div>
      <div className="mt-1 text-base font-semibold" style={NUM}>
        ₹{p.revenue.toLocaleString("en-IN")}
      </div>
      <div style={{ ...LABEL, fontSize: 12 }}>
        {p.games} booking{p.games === 1 ? "" : "s"}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [today, setToday] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [week, day] = await Promise.all([
        fetchAnalytics(7),
        fetchAnalytics(1),
      ]);
      setData(week);
      setToday(day);
      setUpdatedAt(new Date());
    } catch {
      setErr("Couldn't load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const week = useMemo(() => buildWeek(data?.daily), [data]);

  const cash = data?.by_method.cash?.count ?? 0;
  const upi = data?.by_method.upi?.count ?? 0;
  const methodTotal = cash + upi;

  const classes = useMemo(
    () =>
      [...(data?.by_category ?? [])].sort(
        (a, b) => b.revenue_paise - a.revenue_paise,
      ),
    [data],
  );
  const classMax = classes[0]?.revenue_paise ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <div className="mt-1" style={LABEL}>
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {updatedAt && (
            <span style={{ ...LABEL, fontSize: 12 }}>
              Updated{" "}
              {updatedAt.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="text-sm transition-colors"
            style={{
              border: "1px solid var(--line)",
              borderRadius: 5,
              padding: "7px 14px",
              background: "var(--surface)",
              color: loading ? "var(--ink-muted)" : "var(--ink-soft)",
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {err && (
        <div
          className="mb-5 flex items-center justify-between gap-4 px-4 py-3"
          style={{
            border: "1px solid var(--line)",
            borderLeft: "3px solid var(--danger)",
            borderRadius: 4,
            background: "var(--surface)",
          }}
        >
          <span className="text-sm">{err}</span>
          <button
            onClick={load}
            className="text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Revenue today"
          value={money(today?.revenue_paise ?? 0)}
          loading={loading && !today}
          accent
          sub={`${today?.games ?? 0} booking${today?.games === 1 ? "" : "s"}`}
        />
        <Stat
          label="Players today"
          value={String(today?.players ?? 0)}
          loading={loading && !today}
        />
        <Stat
          label="Revenue · 7 days"
          value={money(data?.revenue_paise ?? 0)}
          loading={loading && !data}
          sub={`${data?.games ?? 0} booking${data?.games === 1 ? "" : "s"}`}
        />
        <Stat
          label="Players · 7 days"
          value={String(data?.players ?? 0)}
          loading={loading && !data}
        />
      </div>

      {/* Chart + payment mix */}
      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card
            title="Revenue, last 7 days"
            action={
              <Link
                to="/admin/analytics"
                className="text-sm font-medium"
                style={{ color: "var(--accent)" }}
              >
                Full analytics →
              </Link>
            }
            className="px-2 pb-4 pt-5"
          >
            <div style={{ height: 250 }}>
              {loading && !data ? (
                <div className="flex h-full items-end gap-3 px-4">
                  {[45, 70, 35, 85, 55, 75, 50].map((h, i) => (
                    <span
                      key={i}
                      className="flex-1 animate-pulse"
                      style={{
                        height: `${h}%`,
                        background: "var(--surface-dim)",
                        borderRadius: 2,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={week}
                    margin={{ top: 5, right: 16, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="dash-rev" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#f0164a"
                          stopOpacity={0.22}
                        />
                        <stop
                          offset="100%"
                          stopColor="#f0164a"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--line)"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                      tick={{ fontSize: 12, fill: "var(--ink-muted)" }}
                    />
                    <YAxis
                      width={58}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: "var(--ink-muted)" }}
                      tickFormatter={(v) =>
                        `₹${Number(v).toLocaleString("en-IN")}`
                      }
                    />
                    <Tooltip
                      content={<ChartTip />}
                      cursor={{
                        stroke: "var(--line-strong)",
                        strokeWidth: 1,
                        strokeDasharray: "3 3",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f0164a"
                      strokeWidth={2}
                      fill="url(#dash-rev)"
                      dot={{ r: 3, fill: "#f0164a", strokeWidth: 0 }}
                      activeDot={{
                        r: 5,
                        fill: "#f0164a",
                        stroke: "var(--surface)",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        <Card title="Payment mix · 7 days" className="px-5 py-5">
          {methodTotal === 0 ? (
            <div style={LABEL}>No payments recorded.</div>
          ) : (
            <>
              <div
                className="flex h-2 w-full overflow-hidden"
                style={{ background: "var(--surface-dim)", borderRadius: 2 }}
              >
                <div
                  style={{
                    width: `${(cash / methodTotal) * 100}%`,
                    background: "var(--ink)",
                  }}
                />
                <div
                  style={{
                    width: `${(upi / methodTotal) * 100}%`,
                    background: "var(--accent)",
                  }}
                />
              </div>
              <dl className="mt-5 space-y-3.5">
                {[
                  { k: "Cash", n: cash, c: "var(--ink)" },
                  { k: "UPI", n: upi, c: "var(--accent)" },
                ].map((m) => (
                  <div key={m.k} className="flex items-center justify-between">
                    <dt
                      className="flex items-center gap-2.5 text-sm"
                      style={{ color: "var(--ink-soft)" }}
                    >
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 2,
                          background: m.c,
                        }}
                      />
                      {m.k}
                    </dt>
                    <dd className="text-sm font-semibold" style={NUM}>
                      {m.n}
                      <span className="ml-2" style={{ ...LABEL, fontSize: 12 }}>
                        {Math.round((m.n / methodTotal) * 100)}%
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </Card>
      </div>

      {/* By class */}
      <Card title="By gun class · 7 days" className="px-5 py-4">
        {classes.length === 0 ? (
          <div className="py-2" style={LABEL}>
            No bookings in this period.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "var(--ink-muted)" }}>
                <th
                  className="pb-2.5 text-left font-normal"
                  style={{ fontSize: 13 }}
                >
                  Class
                </th>
                <th
                  className="pb-2.5 text-right font-normal"
                  style={{ fontSize: 13 }}
                >
                  Bookings
                </th>
                <th
                  className="pb-2.5 text-right font-normal"
                  style={{ fontSize: 13 }}
                >
                  Players
                </th>
                <th
                  className="pb-2.5 text-right font-normal"
                  style={{ fontSize: 13 }}
                >
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr
                  key={c.category}
                  style={{ borderTop: "1px solid var(--line)" }}
                >
                  <td className="py-3">
                    <div className="font-medium">{c.category}</div>
                    <div
                      className="mt-1.5 h-1 w-full max-w-[180px]"
                      style={{
                        background: "var(--surface-dim)",
                        borderRadius: 2,
                      }}
                    >
                      <div
                        className="h-full"
                        style={{
                          width: classMax
                            ? `${(c.revenue_paise / classMax) * 100}%`
                            : "0%",
                          background: "var(--accent)",
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </td>
                  <td className="py-3 text-right align-top" style={NUM}>
                    {c.games}
                  </td>
                  <td className="py-3 text-right align-top" style={NUM}>
                    {c.players}
                  </td>
                  <td
                    className="py-3 text-right align-top font-semibold"
                    style={NUM}
                  >
                    {money(c.revenue_paise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
