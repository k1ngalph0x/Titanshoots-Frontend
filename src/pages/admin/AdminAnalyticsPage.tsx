import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { api } from "../../api/client";
import { fetchAnalytics, type Analytics } from "../../api/admin";
import Card from "../../components/Card";
import { useNavigate } from "react-router-dom";

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

const rupees = (p: number) => `₹${Math.round(p / 100).toLocaleString("en-IN")}`;

const LABEL: React.CSSProperties = { color: "var(--ink-muted)", fontSize: 12 };
const NUM: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontVariantNumeric: "tabular-nums",
};

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function localISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* Backend only returns days with activity — scaffold the full range
   so gaps read as zero instead of collapsing the series. */
function buildRange(daily: Analytics["daily"] | undefined, days: number) {
  const byDay = new Map(
    (daily ?? []).map((d) => [startOfDay(new Date(d.day)).getTime(), d]),
  );
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - i);
    const hit = byDay.get(d.getTime());
    out.push({
      key: d.getTime(),
      day: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      full: d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
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
  sub,
  loading,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  loading: boolean;
  accent?: boolean;
}) {
  return (
    <Card className="px-5 py-4">
      <div style={{ ...LABEL, fontSize: 13 }}>{label}</div>
      {loading ? (
        <div className="mt-2.5">
          <Skeleton w="70%" h={26} />
        </div>
      ) : (
        <div
          className="mt-1.5 text-2xl font-semibold leading-none"
          style={{ ...NUM, color: accent ? "var(--accent)" : "var(--ink)" }}
        >
          {value}
        </div>
      )}
      {sub && (
        <div className="mt-2" style={LABEL}>
          {sub}
        </div>
      )}
    </Card>
  );
}

function ChartTip({ active, payload, metric }: any) {
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
      <div style={LABEL}>{p.full}</div>
      <div className="mt-1 text-base font-semibold" style={NUM}>
        {metric === "revenue"
          ? `₹${p.revenue.toLocaleString("en-IN")}`
          : p.games}
      </div>
      <div style={LABEL}>
        {metric === "revenue"
          ? `${p.games} booking${p.games === 1 ? "" : "s"}`
          : `₹${p.revenue.toLocaleString("en-IN")}`}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [metric, setMetric] = useState<"revenue" | "games">("revenue");
  const navigate = useNavigate();
  const reqRef = useRef(0);

  const load = useCallback(async (d: number) => {
    const seq = ++reqRef.current;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetchAnalytics(d);
      if (seq !== reqRef.current) return;
      setData(res);
    } catch {
      if (seq !== reqRef.current) return;
      setErr("Couldn't load analytics.");
    } finally {
      if (seq === reqRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  const series = useMemo(() => buildRange(data?.daily, days), [data, days]);

  const activeDays = useMemo(
    () => series.filter((s) => s.games > 0).length,
    [series],
  );
  const bestDay = useMemo(
    () => series.reduce((a, b) => (b.revenue > a.revenue ? b : a), series[0]),
    [series],
  );

  const cash = data?.by_method.cash?.count ?? 0;
  const upi = data?.by_method.upi?.count ?? 0;
  const cashRev = data?.by_method.cash?.revenue_paise ?? 0;
  const upiRev = data?.by_method.upi?.revenue_paise ?? 0;
  const methodTotal = cash + upi;

  const cats = useMemo(
    () =>
      [...(data?.by_category ?? [])].sort(
        (a, b) => b.revenue_paise - a.revenue_paise,
      ),
    [data],
  );
  const catTotal = cats.reduce((s, c) => s + c.revenue_paise, 0);

  const avgBooking = data && data.games ? data.revenue_paise / data.games : 0;
  const tickEvery = Math.max(0, Math.floor(series.length / 8));

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <div className="mt-1" style={{ ...LABEL, fontSize: 13 }}>
            {loading && !data
              ? "Loading…"
              : `${series[0]?.day} – ${series[series.length - 1]?.day} · confirmed bookings only`}
          </div>
        </div>
        <div className="flex gap-1.5">
          {RANGES.map((r) => {
            const on = days === r.days;
            return (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className="text-sm transition-colors"
                style={{
                  padding: "6px 14px",
                  borderRadius: 5,
                  border: `1px solid ${on ? "var(--ink)" : "var(--line)"}`,
                  background: on ? "var(--ink)" : "var(--surface)",
                  color: on ? "var(--paper)" : "var(--ink-soft)",
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {err && (
        <div
          className="mb-5 flex items-center justify-between gap-4 px-4 py-3"
          style={{
            background: "var(--surface)",
            borderRadius: 4,
            border: "1px solid var(--line)",
            borderLeft: "3px solid var(--danger)",
          }}
        >
          <span className="text-sm">{err}</span>
          <button
            onClick={() => load(days)}
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
          label="Revenue"
          value={rupees(data?.revenue_paise ?? 0)}
          accent
          loading={loading && !data}
          sub={`${activeDays} of ${days} days with bookings`}
        />
        <Stat
          label="Bookings"
          value={String(data?.games ?? 0)}
          loading={loading && !data}
          sub={data ? `Avg ${rupees(avgBooking)} each` : undefined}
        />
        <Stat
          label="Players"
          value={String(data?.players ?? 0)}
          loading={loading && !data}
          sub={
            data && data.games
              ? `${(data.players / data.games).toFixed(1)} per booking`
              : undefined
          }
        />
        <Stat
          label="Best day"
          value={
            bestDay && bestDay.revenue > 0 ? rupees(bestDay.revenue * 100) : "—"
          }
          loading={loading && !data}
          sub={bestDay && bestDay.revenue > 0 ? bestDay.full : "No revenue yet"}
        />
      </div>

      {/* Trend */}
      <Card
        title={
          metric === "revenue" ? "Revenue over time" : "Bookings over time"
        }
        action={
          <div
            className="flex overflow-hidden"
            style={{ border: "1px solid var(--line)", borderRadius: 5 }}
          >
            {(["revenue", "games"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className="px-3 py-1 text-xs font-medium capitalize transition-colors"
                style={{
                  background: metric === m ? "var(--ink)" : "transparent",
                  color: metric === m ? "var(--paper)" : "var(--ink-soft)",
                }}
              >
                {m === "games" ? "Bookings" : "Revenue"}
              </button>
            ))}
          </div>
        }
        className="px-2 pb-4 pt-5"
      >
        <div style={{ height: 280 }}>
          {loading && !data ? (
            <div className="flex h-full items-end gap-2 px-4">
              {Array.from({ length: 14 }).map((_, i) => (
                <span
                  key={i}
                  className="flex-1 animate-pulse"
                  style={{
                    height: `${30 + ((i * 37) % 60)}%`,
                    background: "var(--surface-dim)",
                    borderRadius: 2,
                  }}
                />
              ))}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={series}
                margin={{ top: 5, right: 16, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="an-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f0164a" stopOpacity={0.22} />
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
                  interval={tickEvery}
                  minTickGap={16}
                  tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
                />
                <YAxis
                  width={metric === "revenue" ? 62 : 40}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
                  tickFormatter={(v) =>
                    metric === "revenue"
                      ? `₹${Number(v).toLocaleString("en-IN")}`
                      : String(v)
                  }
                />
                <Tooltip
                  content={<ChartTip metric={metric} />}
                  cursor={{
                    stroke: "var(--line-strong)",
                    strokeWidth: 1,
                    strokeDasharray: "3 3",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke="#f0164a"
                  strokeWidth={2}
                  fill="url(#an-rev)"
                  dot={
                    series.length <= 14
                      ? { r: 3, fill: "#f0164a", strokeWidth: 0 }
                      : false
                  }
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

      {/* Breakdown + payment */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="By gun class" className="px-5 py-4">
            {cats.length === 0 ? (
              <div className="py-4" style={{ ...LABEL, fontSize: 13 }}>
                No confirmed bookings in this range.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ color: "var(--ink-muted)", fontSize: 12 }}>
                    <th className="pb-2.5 text-left font-normal">Class</th>
                    <th className="pb-2.5 text-right font-normal">Bookings</th>
                    <th className="pb-2.5 text-right font-normal">Players</th>
                    <th className="pb-2.5 text-right font-normal">Revenue</th>
                    <th className="pb-2.5 text-right font-normal">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {/* {cats.map((c) => {
                    const share = catTotal
                      ? (c.revenue_paise / catTotal) * 100
                      : 0;
                    return (
                      <tr
                        key={c.category}
                        style={{ borderTop: "1px solid var(--line)" }}
                      >
                        <td className="py-3 pr-4" style={{ minWidth: 140 }}>
                          <div className="font-medium">{c.category}</div>
                          <div
                            className="mt-1.5 h-1 w-full max-w-[200px]"
                            style={{
                              background: "var(--surface-dim)",
                              borderRadius: 2,
                            }}
                          >
                            <div
                              className="h-full"
                              style={{
                                width: `${share}%`,
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
                          {rupees(c.revenue_paise)}
                        </td>
                        <td
                          className="py-3 text-right align-top"
                          style={{ ...NUM, color: "var(--ink-muted)" }}
                        >
                          {share.toFixed(0)}%
                        </td>
                      </tr>
                    );
                  })} */}
                  {cats.map((c) => {
                    const share = catTotal
                      ? (c.revenue_paise / catTotal) * 100
                      : 0;
                    return (
                      <tr
                        key={c.category}
                        onClick={() =>
                          navigate(
                            `/admin/category/${c.category_id}?name=${encodeURIComponent(c.category)}`,
                          )
                        }
                        className="cursor-pointer transition-colors"
                        style={{ borderTop: "1px solid var(--line)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "var(--surface-dim)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td className="py-3 pr-4" style={{ minWidth: 140 }}>
                          <div className="font-medium">{c.category}</div>
                          <div
                            className="mt-1.5 h-1 w-full max-w-[200px]"
                            style={{
                              background: "var(--surface-dim)",
                              borderRadius: 2,
                            }}
                          >
                            <div
                              className="h-full"
                              style={{
                                width: `${share}%`,
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
                          {rupees(c.revenue_paise)}
                        </td>
                        <td
                          className="py-3 text-right align-top"
                          style={{ ...NUM, color: "var(--ink-muted)" }}
                        >
                          {share.toFixed(0)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <Card title="Payment method" className="px-5 py-5">
          {methodTotal === 0 ? (
            <div style={{ ...LABEL, fontSize: 13 }}>
              No payments in this range.
            </div>
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
              <div className="mt-5 space-y-4">
                {[
                  { k: "Cash", n: cash, rev: cashRev, c: "var(--ink)" },
                  { k: "UPI", n: upi, rev: upiRev, c: "var(--accent)" },
                ].map((m) => (
                  <div key={m.k}>
                    <div className="flex items-center justify-between">
                      <span
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
                      </span>
                      <span className="text-sm font-semibold" style={NUM}>
                        {rupees(m.rev)}
                      </span>
                    </div>
                    <div className="mt-0.5 pl-[19px]" style={LABEL}>
                      {m.n} booking{m.n === 1 ? "" : "s"} ·{" "}
                      {Math.round((m.n / methodTotal) * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <ReportDownload />
    </div>
  );
}

function ReportDownload() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [on, setOn] = useState(() => localISO(new Date()));

  function download() {
    const base = api.defaults.baseURL ?? "";
    window.open(
      `${base}/admin/reports/pdf?period=${period}&on=${on}`,
      "_blank",
    );
  }

  const covering = useMemo(() => {
    const d = new Date(`${on}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    if (period === "year") return String(d.getFullYear());
    if (period === "month")
      return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    const start = new Date(d);
    start.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const f = (x: Date) =>
      x.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    return `${f(start)} – ${f(end)}`;
  }, [period, on]);

  return (
    <div className="mt-5">
      <Card title="Download report" className="px-5 py-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <div
              className="mb-1.5 font-medium"
              style={{ ...LABEL, fontSize: 13 }}
            >
              Period
            </div>
            <div
              className="flex overflow-hidden"
              style={{ border: "1px solid var(--line)", borderRadius: 5 }}
            >
              {(["week", "month", "year"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="px-4 py-2 text-sm font-medium capitalize transition-colors"
                  style={{
                    background: period === p ? "var(--ink)" : "transparent",
                    color: period === p ? "var(--paper)" : "var(--ink-soft)",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="rep-date"
              className="mb-1.5 block font-medium"
              style={{ ...LABEL, fontSize: 13 }}
            >
              Any date in that {period}
            </label>
            <input
              id="rep-date"
              type="date"
              value={on}
              onChange={(e) => setOn(e.target.value)}
              className="text-sm"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 5,
                color: "var(--ink)",
                padding: "8px 11px",
                fontFamily: "var(--font-display)",
              }}
            />
          </div>

          <button
            onClick={download}
            className="text-sm font-medium"
            style={{
              background: "var(--accent)",
              color: "#fff",
              borderRadius: 5,
              padding: "9px 20px",
            }}
          >
            Download PDF
          </button>
        </div>

        {covering && (
          <p className="mt-3" style={{ ...LABEL, fontSize: 13 }}>
            Report will cover{" "}
            <span style={{ color: "var(--ink)" }}>{covering}</span>. Opens in a
            new tab.
          </p>
        )}
      </Card>
    </div>
  );
}
