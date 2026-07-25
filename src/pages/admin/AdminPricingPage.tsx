import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchAdminCatalog,
  createCategory,
  updateCategory,
  deleteCategory,
  createPlan,
  updatePlan,
  deletePlan,
  type AdminCategory,
  type AdminPlan,
} from "../../api/admin";
import Card from "../../components/Card";

const money = (paise: number) =>
  `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

const LABEL: React.CSSProperties = { color: "var(--ink-muted)", fontSize: 12 };
const NUM: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontVariantNumeric: "tabular-nums",
};

const COLS =
  "sm:grid-cols-[90px_minmax(0,150px)_minmax(0,130px)_minmax(0,1fr)_40px]";

const MAX_SHOTS = 200;
const MIN_PRICE = 50;

function inputStyle(invalid = false): React.CSSProperties {
  return {
    background: "var(--surface)",
    border: `1px solid ${invalid ? "var(--danger)" : "var(--line)"}`,
    borderRadius: 5,
    color: "var(--ink)",
    padding: "7px 10px",
    width: "100%",
    fontSize: 14,
    fontFamily: "var(--font-mono)",
  };
}

function apiErr(e: any, fallback: string) {
  const d = e?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d) && d[0]?.msg) return String(d[0].msg);
  return fallback;
}

/* ── Kebab menu with inline confirm ────────────────────────── */

type MenuItem = {
  label: string;
  danger?: boolean;
  run: () => Promise<void>;
  confirm?: { title: string; body: string; cta: string };
};

function KebabMenu({
  items,
  disabled,
}: {
  items: MenuItem[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<MenuItem | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setConfirming(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  async function fire(it: MenuItem) {
    setBusy(true);
    try {
      await it.run();
      close();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center transition-colors"
        style={{
          borderRadius: 5,
          color: "var(--ink-muted)",
          background: open ? "var(--surface-dim)" : "transparent",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="3" r="1.4" fill="currentColor" />
          <circle cx="8" cy="8" r="1.4" fill="currentColor" />
          <circle cx="8" cy="13" r="1.4" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 z-30 mt-1 w-60 overflow-hidden py-1"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 6,
            boxShadow: "0 8px 24px rgba(20,19,26,0.10)",
          }}
        >
          {confirming ? (
            <div className="px-3 py-2.5">
              <div className="text-sm font-medium">
                {confirming.confirm!.title}
              </div>
              <p className="mt-1 mb-3" style={LABEL}>
                {confirming.confirm!.body}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fire(confirming)}
                  className="flex-1 py-1.5 text-xs font-medium"
                  style={{
                    background: "var(--danger)",
                    color: "#fff",
                    borderRadius: 4,
                  }}
                >
                  {busy ? "Working…" : confirming.confirm!.cta}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="flex-1 py-1.5 text-xs"
                  style={{
                    border: "1px solid var(--line)",
                    color: "var(--ink-soft)",
                    borderRadius: 4,
                  }}
                >
                  Keep
                </button>
              </div>
            </div>
          ) : (
            items.map((it) => (
              <button
                key={it.label}
                type="button"
                onClick={() => (it.confirm ? setConfirming(it) : fire(it))}
                className="block w-full px-3 py-2 text-left text-sm"
                style={{
                  color: it.danger ? "var(--danger)" : "var(--ink-soft)",
                }}
              >
                {it.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Plan row ──────────────────────────────────────────────── */

function PlanRow({
  plan,
  onChanged,
  onError,
}: {
  plan: AdminPlan;
  onChanged: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const toRupees = (p: number) => String(Math.round(p / 100));

  const [price, setPrice] = useState(() => toRupees(plan.price_paise));
  const [disc, setDisc] = useState(() => String(plan.discount_percent));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [synced, setSynced] = useState({
    p: plan.price_paise,
    d: plan.discount_percent,
  });

  if (synced.p !== plan.price_paise || synced.d !== plan.discount_percent) {
    setSynced({ p: plan.price_paise, d: plan.discount_percent });
    setPrice(toRupees(plan.price_paise));
    setDisc(String(plan.discount_percent));
    setErr(null);
  }

  const priceN = Number(price);
  const discN = Number(disc);
  const priceValid =
    price !== "" && Number.isInteger(priceN) && priceN >= MIN_PRICE;
  const discValid =
    disc !== "" && Number.isInteger(discN) && discN >= 0 && discN <= 100;
  const dirty =
    priceN !== Math.round(plan.price_paise / 100) ||
    discN !== plan.discount_percent;
  const canSave = dirty && priceValid && discValid && !busy;

  /* Saved state uses the server's own figure; dirty state previews locally. */
  const previewPaise =
    priceValid && discValid
      ? Math.round((priceN * (100 - discN)) / 100) * 100
      : null;
  const shownPaise = dirty ? previewPaise : plan.discounted_price_paise;

  function revert() {
    setPrice(toRupees(plan.price_paise));
    setDisc(String(plan.discount_percent));
    setErr(null);
  }

  async function save() {
    if (!canSave) return;
    setBusy(true);
    setErr(null);
    try {
      await updatePlan(plan.id, {
        price_rupees: priceN,
        discount_percent: discN,
      });
      onChanged(`${plan.shot_count}-shot pack updated`);
    } catch (e) {
      setErr(apiErr(e, "Couldn't save this pack."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`grid grid-cols-2 items-center gap-3 px-4 py-3 sm:gap-4 ${COLS}`}
      style={{
        borderTop: "1px solid var(--line)",
        background: dirty ? "var(--accent-wash)" : "transparent",
      }}
    >
      {/* Shots */}
      <div className="col-span-2 sm:col-span-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold" style={NUM}>
            {plan.shot_count}
          </span>
          <span style={LABEL}>shots</span>
          {!plan.is_active && (
            <span
              className="px-1.5 py-[1px]"
              style={{
                ...LABEL,
                background: "var(--surface-dim)",
                borderRadius: 3,
              }}
            >
              inactive
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="mb-1 block sm:hidden" style={LABEL}>
          Price (₹)
        </label>
        <input
          type="number"
          inputMode="numeric"
          value={price}
          min={MIN_PRICE}
          disabled={busy}
          aria-label={`Price for ${plan.shot_count}-shot pack, in rupees`}
          onChange={(e) => setPrice(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") revert();
          }}
          style={inputStyle(price !== "" && !priceValid)}
        />
      </div>

      {/* Discount */}
      <div>
        <label className="mb-1 block sm:hidden" style={LABEL}>
          Discount (%)
        </label>
        <input
          type="number"
          inputMode="numeric"
          value={disc}
          min={0}
          max={100}
          disabled={busy}
          aria-label={`Discount percent for ${plan.shot_count}-shot pack`}
          onChange={(e) => setDisc(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") revert();
          }}
          style={inputStyle(disc !== "" && !discValid)}
        />
      </div>

      {/* Customer pays / actions */}
      <div className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-2 sm:col-span-1">
        <div className="min-w-[104px]">
          <div style={LABEL}>{dirty ? "Will be" : "Customer pays"}</div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold" style={NUM}>
              {shownPaise != null ? money(shownPaise) : "—"}
            </span>
            {discN > 0 && priceValid && (
              <span className="line-through" style={{ ...LABEL, ...NUM }}>
                ₹{priceN}
              </span>
            )}
          </div>
        </div>

        {dirty && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="text-xs font-medium"
              style={{
                borderRadius: 4,
                padding: "6px 14px",
                background: canSave ? "var(--accent)" : "var(--surface-dim)",
                color: canSave ? "#fff" : "var(--ink-muted)",
                cursor: canSave ? "pointer" : "not-allowed",
              }}
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={revert}
              disabled={busy}
              className="text-xs"
              style={{ color: "var(--ink-muted)", padding: "6px 4px" }}
            >
              Revert
            </button>
          </div>
        )}

        {(err ||
          (price !== "" && !priceValid) ||
          (disc !== "" && !discValid)) && (
          <div style={{ ...LABEL, color: "var(--danger)" }}>
            {err ??
              (!priceValid
                ? `Price must be a whole number, ₹${MIN_PRICE} or more`
                : "Discount must be a whole number, 0–100")}
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="col-span-2 flex justify-end sm:col-span-1">
        <KebabMenu
          disabled={busy}
          items={[
            {
              label: "Delete shot pack",
              danger: true,
              confirm: {
                title: `Delete the ${plan.shot_count}-shot pack?`,
                body: "It will no longer be bookable. Existing bookings are unaffected.",
                cta: "Delete pack",
              },
              run: async () => {
                try {
                  await deletePlan(plan.id);
                  onChanged(`${plan.shot_count}-shot pack deleted`);
                } catch (e) {
                  onError(apiErr(e, "Couldn't delete that pack."));
                }
              },
            },
          ]}
        />
      </div>
    </div>
  );
}

/* ── Add plan ──────────────────────────────────────────────── */

function AddPlanRow({
  categoryName,
  onAdd,
}: {
  categoryName: string;
  onAdd: (shots: number, price: number, disc: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [shots, setShots] = useState("");
  const [price, setPrice] = useState("");
  const [disc, setDisc] = useState("0");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) firstRef.current?.focus();
  }, [open]);

  const shotsN = Number(shots);
  const priceN = Number(price);
  const discN = Number(disc);
  const shotsValid =
    shots !== "" &&
    Number.isInteger(shotsN) &&
    shotsN >= 1 &&
    shotsN <= MAX_SHOTS;
  const priceValid =
    price !== "" && Number.isInteger(priceN) && priceN >= MIN_PRICE;
  const discValid =
    disc !== "" && Number.isInteger(discN) && discN >= 0 && discN <= 100;
  const valid = shotsValid && priceValid && discValid && !busy;

  const blocker = !shotsValid
    ? `Shots must be a whole number, 1–${MAX_SHOTS}`
    : !priceValid
      ? `Price must be a whole number, ₹${MIN_PRICE} or more`
      : !discValid
        ? "Discount must be a whole number, 0–100"
        : null;

  function reset() {
    setShots("");
    setPrice("");
    setDisc("0");
    setErr(null);
  }

  if (!open) {
    return (
      <div style={{ borderTop: "1px solid var(--line)" }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full px-4 py-3 text-left text-sm font-medium"
          style={{ color: "var(--accent)" }}
        >
          + Add shot pack
        </button>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 items-start gap-3 px-4 py-3 sm:gap-4 ${COLS}`}
      style={{
        borderTop: "1px solid var(--line)",
        background: "var(--surface-dim)",
      }}
    >
      <div className="col-span-2 sm:col-span-1">
        <label className="mb-1 block" style={LABEL}>
          Shots
        </label>
        <input
          ref={firstRef}
          type="number"
          inputMode="numeric"
          value={shots}
          min={1}
          max={MAX_SHOTS}
          onChange={(e) => setShots(e.target.value)}
          style={inputStyle(shots !== "" && !shotsValid)}
        />
      </div>
      <div>
        <label className="mb-1 block" style={LABEL}>
          Price (₹)
        </label>
        <input
          type="number"
          inputMode="numeric"
          value={price}
          min={MIN_PRICE}
          onChange={(e) => setPrice(e.target.value)}
          style={inputStyle(price !== "" && !priceValid)}
        />
      </div>
      <div>
        <label className="mb-1 block" style={LABEL}>
          Discount (%)
        </label>
        <input
          type="number"
          inputMode="numeric"
          value={disc}
          min={0}
          max={100}
          onChange={(e) => setDisc(e.target.value)}
          style={inputStyle(disc !== "" && !discValid)}
        />
      </div>

      <div className="col-span-2 sm:col-span-1 sm:pt-[22px]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!valid}
            onClick={async () => {
              setBusy(true);
              setErr(null);
              try {
                await onAdd(shotsN, priceN, discN);
                reset();
                setOpen(false);
              } catch (e) {
                setErr(apiErr(e, "Couldn't add that pack."));
              } finally {
                setBusy(false);
              }
            }}
            className="text-xs font-medium"
            style={{
              borderRadius: 4,
              padding: "7px 16px",
              background: valid ? "var(--accent)" : "var(--surface)",
              color: valid ? "#fff" : "var(--ink-muted)",
              border: valid ? "none" : "1px solid var(--line)",
              cursor: valid ? "pointer" : "not-allowed",
            }}
          >
            {busy ? "Adding…" : `Add to ${categoryName}`}
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              setOpen(false);
            }}
            className="text-xs"
            style={{ color: "var(--ink-muted)", padding: "7px 4px" }}
          >
            Cancel
          </button>
        </div>
        {(err || blocker) && (
          <div
            className="mt-1.5"
            style={{
              ...LABEL,
              color: err ? "var(--danger)" : "var(--ink-muted)",
            }}
          >
            {err ?? blocker}
          </div>
        )}
      </div>

      <div className="hidden sm:block" />
    </div>
  );
}

/* ── Category ──────────────────────────────────────────────── */

function CategorySection({
  cat,
  onChanged,
  onError,
}: {
  cat: AdminCategory;
  onChanged: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [syncedName, setSyncedName] = useState(cat.name);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (syncedName !== cat.name) {
    setSyncedName(cat.name);
    setName(cat.name);
  }
  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === cat.name) {
      setEditing(false);
      setName(cat.name);
      return;
    }
    setBusy(true);
    try {
      await updateCategory(cat.id, trimmed);
      onChanged(`Renamed to ${trimmed}`);
      setEditing(false);
    } catch (e) {
      onError(apiErr(e, "Couldn't rename this class."));
      setName(cat.name);
    } finally {
      setBusy(false);
    }
  }

  const header = editing ? (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        value={name}
        disabled={busy}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") saveName();
          if (e.key === "Escape") {
            setEditing(false);
            setName(cat.name);
          }
        }}
        className="text-sm font-semibold"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--accent)",
          borderRadius: 5,
          color: "var(--ink)",
          padding: "5px 9px",
          width: 200,
        }}
      />
      <button
        type="button"
        onClick={saveName}
        disabled={busy}
        className="text-xs font-medium"
        style={{
          background: "var(--accent)",
          color: "#fff",
          borderRadius: 4,
          padding: "6px 12px",
        }}
      >
        {busy ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setName(cat.name);
        }}
        className="text-xs"
        style={{ color: "var(--ink-muted)", padding: "6px 4px" }}
      >
        Cancel
      </button>
    </div>
  ) : (
    <div className="flex items-baseline gap-2.5">
      <h2 className="text-sm font-semibold">{cat.name}</h2>
      <span style={LABEL}>
        {cat.plans.length} {cat.plans.length === 1 ? "pack" : "packs"}
      </span>
      {!cat.is_active && (
        <span
          className="px-1.5 py-[1px]"
          style={{
            ...LABEL,
            background: "var(--surface-dim)",
            borderRadius: 3,
          }}
        >
          inactive
        </span>
      )}
    </div>
  );

  return (
    <div className="mb-5">
      <div
        className="flex flex-col"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 6,
        }}
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-3.5"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          {header}
          {!editing && (
            <KebabMenu
              items={[
                {
                  label: "Rename class",
                  run: async () => {
                    setEditing(true);
                  },
                },
                {
                  label: "Delete class",
                  danger: true,
                  confirm: {
                    title: `Delete "${cat.name}"?`,
                    body: `This removes the class and all ${cat.plans.length} of its shot packs.`,
                    cta: "Delete class",
                  },
                  run: async () => {
                    try {
                      await deleteCategory(cat.id);
                      onChanged(`Deleted ${cat.name}`);
                    } catch (e) {
                      onError(apiErr(e, "Couldn't delete this class."));
                    }
                  },
                },
              ]}
            />
          )}
        </div>

        {cat.plans.length > 0 && (
          <div
            className={`hidden px-4 py-2 sm:grid sm:gap-4 ${COLS}`}
            style={{ ...LABEL, background: "var(--surface-dim)" }}
          >
            <div>Pack</div>
            <div>Price (₹)</div>
            <div>Discount (%)</div>
            <div>Customer pays</div>
            <div />
          </div>
        )}

        {cat.plans.length === 0 ? (
          <div
            className="px-4 py-6 text-center"
            style={{ borderTop: "1px solid var(--line)" }}
          >
            <div className="text-sm font-medium">No shot packs yet</div>
            <p className="mt-1" style={LABEL}>
              Add at least one pack so this class can be booked.
            </p>
          </div>
        ) : (
          cat.plans.map((p) => (
            <PlanRow
              key={p.id}
              plan={p}
              onChanged={onChanged}
              onError={onError}
            />
          ))
        )}

        <AddPlanRow
          categoryName={cat.name}
          onAdd={async (shots, price, disc) => {
            await createPlan(cat.id, shots, price, disc);
            onChanged(`Added ${shots}-shot pack to ${cat.name}`);
          }}
        />
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */

export default function AdminPricingPage() {
  const [catalog, setCatalog] = useState<AdminCategory[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [flash, setFlash] = useState<{
    msg: string;
    kind: "ok" | "err";
  } | null>(null);

  const [newCat, setNewCat] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  const timerRef = useRef<number | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const notify = useCallback((msg: string, kind: "ok" | "err" = "ok") => {
    setFlash({ msg, kind });
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(
      () => {
        if (mounted.current) setFlash(null);
      },
      kind === "err" ? 6000 : 3000,
    );
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadErr(null);
    try {
      const data = await fetchAdminCatalog();
      if (mounted.current) setCatalog(data);
    } catch (e) {
      if (mounted.current) setLoadErr(apiErr(e, "Couldn't load the catalog."));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const onChanged = useCallback(
    (msg: string) => {
      notify(msg, "ok");
      reload();
    },
    [notify, reload],
  );
  const onError = useCallback((msg: string) => notify(msg, "err"), [notify]);

  const totalPlans = catalog?.reduce((s, c) => s + c.plans.length, 0) ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pricing</h1>
          <div className="mt-1" style={{ ...LABEL, fontSize: 13 }}>
            {loading && !catalog
              ? "Loading…"
              : `${catalog?.length ?? 0} gun ${catalog?.length === 1 ? "class" : "classes"} · ${totalPlans} shot ${totalPlans === 1 ? "pack" : "packs"}`}
          </div>
        </div>
        {flash && (
          <span
            className="px-3 py-1.5 text-sm"
            style={{
              borderRadius: 5,
              color: flash.kind === "err" ? "var(--danger)" : "var(--success)",
              background:
                flash.kind === "err"
                  ? "var(--accent-wash)"
                  : "rgba(18,133,90,0.09)",
            }}
          >
            {flash.msg}
          </span>
        )}
      </div>

      <p
        className="mb-5 max-w-2xl text-sm"
        style={{ color: "var(--ink-soft)" }}
      >
        Changes apply to new bookings only. Existing bookings keep the price
        they were made at.
      </p>

      {loadErr && (
        <div
          className="mb-5 flex items-center justify-between gap-4 px-4 py-3"
          style={{
            background: "var(--surface)",
            borderRadius: 4,
            border: "1px solid var(--line)",
            borderLeft: "3px solid var(--danger)",
          }}
        >
          <span className="text-sm">{loadErr}</span>
          <button
            onClick={reload}
            className="text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            Retry
          </button>
        </div>
      )}

      {loading && !catalog ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="px-4 py-5"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 6,
              }}
            >
              <span
                className="block animate-pulse"
                style={{
                  height: 14,
                  width: "30%",
                  borderRadius: 3,
                  background: "var(--surface-dim)",
                }}
              />
              <span
                className="mt-4 block animate-pulse"
                style={{
                  height: 12,
                  width: "70%",
                  borderRadius: 3,
                  background: "var(--surface-dim)",
                }}
              />
            </div>
          ))}
        </div>
      ) : catalog && catalog.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <div className="font-medium">No gun classes yet</div>
          <p
            className="mx-auto mt-1.5 max-w-sm"
            style={{ ...LABEL, fontSize: 13 }}
          >
            Add a class like "Rifle" or "Pistol", then give it shot packs
            customers can book.
          </p>
        </Card>
      ) : (
        catalog?.map((cat) => (
          <CategorySection
            key={cat.id}
            cat={cat}
            onChanged={onChanged}
            onError={onError}
          />
        ))
      )}

      {/* Add category */}
      <Card title="Add a gun class" className="px-5 py-5">
        <div className="flex flex-wrap gap-2">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newCat.trim() && !addingCat) {
                (async () => {
                  setAddingCat(true);
                  try {
                    await createCategory(newCat.trim());
                    notify(`Added ${newCat.trim()}`);
                    setNewCat("");
                    reload();
                  } catch (err) {
                    notify(apiErr(err, "Couldn't add that class."), "err");
                  } finally {
                    setAddingCat(false);
                  }
                })();
              }
            }}
            placeholder="e.g. Rifle"
            className="text-sm"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 5,
              color: "var(--ink)",
              padding: "8px 12px",
              flex: "1 1 220px",
              maxWidth: 320,
            }}
          />
          <button
            disabled={!newCat.trim() || addingCat}
            onClick={async () => {
              setAddingCat(true);
              try {
                await createCategory(newCat.trim());
                notify(`Added ${newCat.trim()}`);
                setNewCat("");
                reload();
              } catch (err) {
                notify(apiErr(err, "Couldn't add that class."), "err");
              } finally {
                setAddingCat(false);
              }
            }}
            className="text-sm font-medium"
            style={{
              borderRadius: 5,
              padding: "8px 18px",
              background: newCat.trim()
                ? "var(--accent)"
                : "var(--surface-dim)",
              color: newCat.trim() ? "#fff" : "var(--ink-muted)",
              cursor: newCat.trim() ? "pointer" : "not-allowed",
            }}
          >
            {addingCat ? "Adding…" : "Add class"}
          </button>
        </div>
      </Card>
    </div>
  );
}
