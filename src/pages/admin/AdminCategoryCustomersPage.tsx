import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { fetchBookingsByCategory, type BookingItem } from "../../api/admin";
import Card from "../../components/Card";

const money = (p: number) => `₹${Math.round(p / 100).toLocaleString("en-IN")}`;

export default function AdminCategoryCustomersPage() {
  const { categoryId } = useParams();
  const [params] = useSearchParams();
  const name = params.get("name") ?? "Category";
  const [rows, setRows] = useState<BookingItem[] | null>(null);

  useEffect(() => {
    if (categoryId) fetchBookingsByCategory(Number(categoryId)).then(setRows);
  }, [categoryId]);

  return (
    <div>
      <Link
        to="/admin/analytics"
        className="text-sm"
        style={{ color: "var(--accent)" }}
      >
        ← Back to analytics
      </Link>
      <h1 className="text-3xl font-bold tracking-tight mt-3 mb-6">
        {name} <span style={{ color: "var(--ink-muted)" }}>customers</span>
      </h1>

      {!rows && (
        <div className="text-sm" style={{ color: "var(--ink-muted)" }}>
          Loading…
        </div>
      )}
      {rows && rows.length === 0 && (
        <Card className="p-8">
          <p style={{ color: "var(--ink-soft)" }}>
            No bookings for this category.
          </p>
        </Card>
      )}

      {rows && rows.length > 0 && (
        <Card title={`${rows.length} bookings`} className="divide-y">
          {rows.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between px-5 py-3"
              style={{
                borderColor: "var(--line)",
                opacity: b.state === "cancelled" ? 0.5 : 1,
              }}
            >
              <div>
                <div className="font-semibold">
                  {b.customer_name}
                  <span
                    className="text-xs ml-2"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    age {b.customer_age}
                  </span>
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {b.customer_phone} · {b.shot_count} shots · {b.num_people}p
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold" style={{ color: "var(--accent)" }}>
                  {money(b.amount_paise)}
                </div>
                <div className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  {new Date(b.scheduled_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  })}{" "}
                  · {b.state}
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
