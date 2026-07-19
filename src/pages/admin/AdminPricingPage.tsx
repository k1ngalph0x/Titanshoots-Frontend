import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import TechFrame from "../../components/TechFrame";

const money = (paise: number) =>
  `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

export default function AdminPricingPage() {
  const [catalog, setCatalog] = useState<AdminCategory[] | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  async function reload() {
    setCatalog(await fetchAdminCatalog());
  }
  useEffect(() => {
    reload();
  }, []);
  function notify(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  }

  function CategoryHeader({
    cat,
    onRename,
    onDelete,
  }: {
    cat: AdminCategory;
    onRename: (name: string) => Promise<void>;
    onDelete: () => Promise<void>;
  }) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(cat.name);
    const [busy, setBusy] = useState(false);

    async function save() {
      const trimmed = name.trim();
      if (!trimmed || trimmed === cat.name) {
        setEditing(false);
        setName(cat.name);
        return;
      }
      setBusy(true);
      try {
        await onRename(trimmed);
        setEditing(false);
      } catch {
        setName(cat.name);
      } finally {
        setBusy(false);
      }
    }

    return (
      <div className="flex items-center gap-3 mb-4">
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") {
                setEditing(false);
                setName(cat.name);
              }
            }}
            onBlur={save}
            className="text-xl font-bold uppercase tracking-wide"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--accent)",
              color: "var(--ink)",
              padding: "0.2rem 0.5rem",
              fontFamily: "var(--font-display)",
            }}
          />
        ) : (
          <>
            <h2 className="text-xl font-bold uppercase tracking-wide">
              {cat.name}
            </h2>
            <button
              onClick={() => {
                setName(cat.name);
                setEditing(true);
              }}
              className="tech-label px-2 py-1 clip-corner"
              style={{
                border: "1px solid var(--line)",
                color: "var(--ink-soft)",
              }}
              title="Rename category"
            >
              ✎ Edit
            </button>
          </>
        )}

        <span className="h-px flex-1" style={{ background: "var(--line)" }} />

        {busy && (
          <span className="tech-label" style={{ color: "var(--ink-muted)" }}>
            …
          </span>
        )}
        <button
          onClick={onDelete}
          className="tech-label px-3 py-1.5 clip-corner"
          style={{ border: "1px solid var(--danger)", color: "var(--danger)" }}
        >
          Delete category
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="tech-label mb-2" style={{ color: "var(--accent)" }}>
        ※ Catalog
      </div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold tracking-tight">PRICING</h1>
        {flash && (
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="tech-label"
            style={{ color: "var(--success)" }}
          >
            ◆ {flash}
          </motion.span>
        )}
      </div>

      {!catalog && (
        <div className="tech-label blink" style={{ color: "var(--ink-muted)" }}>
          ◆ Loading…
        </div>
      )}

      <AnimatePresence>
        {catalog?.map((cat) => (
          <motion.section
            key={cat.id}
            exit={{ opacity: 0, height: 0 }}
            className="mb-10"
          >
            {/* <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold uppercase tracking-wide">
                {cat.name}
              </h2>
              <span
                className="h-px flex-1"
                style={{ background: "var(--line)" }}
              />

              <button
                onClick={async () => {
                  if (!confirm(`Delete "${cat.name}" and all its plans?`))
                    return;
                  await deleteCategory(cat.id);
                  notify(`Deleted ${cat.name}`);
                  reload();
                }}
                className="tech-label px-3 py-1.5 clip-corner"
                style={{
                  border: "1px solid var(--danger)",
                  color: "var(--danger)",
                }}
              >
                Delete category
              </button>
            </div> */}

            <CategoryHeader
              cat={cat}
              onRename={async (name) => {
                await updateCategory(cat.id, name);
                notify(`Renamed to ${name}`);
                reload();
              }}
              onDelete={async () => {
                if (!confirm(`Delete "${cat.name}" and all its plans?`)) return;
                await deleteCategory(cat.id);
                notify(`Deleted ${cat.name}`);
                reload();
              }}
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cat.plans.map((plan) => (
                <PlanEditor
                  key={plan.id}
                  plan={plan}
                  onSaved={(msg) => {
                    notify(msg);
                    reload();
                  }}
                />
              ))}
              <AddPlanCard
                //categoryId={cat.id}
                onAdd={async (shots, price, disc) => {
                  await createPlan(cat.id, shots, price, disc);
                  notify(`Added ${cat.name} ${shots}-shot`);
                  reload();
                }}
              />
            </div>
          </motion.section>
        ))}
      </AnimatePresence>

      <AddCategoryCard
        onAdd={async (name) => {
          await createCategory(name);
          notify(`Added ${name}`);
          reload();
        }}
      />
    </div>
  );
}

function PlanEditor({
  plan,
  onSaved,
}: {
  plan: AdminPlan;
  onSaved: (msg: string) => void;
}) {
  const [price, setPrice] = useState(
    String(Math.round(plan.price_paise / 100)),
  );
  const [disc, setDisc] = useState(String(plan.discount_percent));
  const [busy, setBusy] = useState(false);

  const dirty =
    Number(price) !== Math.round(plan.price_paise / 100) ||
    Number(disc) !== plan.discount_percent;
  const validPrice = Number.isInteger(Number(price)) && Number(price) >= 50;
  const validDisc =
    Number.isInteger(Number(disc)) && Number(disc) >= 0 && Number(disc) <= 100;

  const input = {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    color: "var(--ink)",
    padding: "0.5rem 0.6rem",
    width: "100%",
    fontFamily: "var(--font-display)",
  };

  async function save() {
    if (!validPrice || !validDisc) return;
    setBusy(true);
    try {
      await updatePlan(plan.id, {
        price_rupees: Number(price),
        discount_percent: Number(disc),
      });
      onSaved(`Updated ${plan.shot_count}-shot`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <TechFrame className="p-4">
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-3xl font-bold">{plan.shot_count}</span>
        <span className="tech-label" style={{ color: "var(--ink-muted)" }}>
          shots
        </span>
      </div>

      <label
        className="tech-label block mb-1"
        style={{ color: "var(--ink-muted)" }}
      >
        Price (Rs)
      </label>
      <input
        style={input}
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <label
        className="tech-label block mt-3 mb-1"
        style={{ color: "var(--ink-muted)" }}
      >
        Discount %
      </label>
      <input
        style={input}
        type="number"
        value={disc}
        onChange={(e) => setDisc(e.target.value)}
      />

      {Number(disc) > 0 && validPrice && (
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-bold" style={{ color: "var(--accent)" }}>
            {money(
              Math.round((Number(price) * (100 - Number(disc))) / 100) * 100,
            )}
          </span>
          <span
            className="text-sm line-through"
            style={{ color: "var(--ink-muted)" }}
          >
            ₹{Number(price)}
          </span>
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={save}
          disabled={!dirty || busy || !validPrice || !validDisc}
          className="flex-1 py-2 clip-corner tech-label"
          style={{
            background: dirty ? "var(--accent)" : "var(--surface-dim)",
            color: dirty ? "#fff" : "var(--ink-muted)",
            cursor: dirty ? "pointer" : "not-allowed",
          }}
        >
          {busy ? "…" : "Save"}
        </button>
        <button
          onClick={async () => {
            if (confirm(`Delete ${plan.shot_count}-shot plan?`)) {
              await deletePlan(plan.id);
              onSaved("Deleted plan");
            }
          }}
          className="px-3 py-2 clip-corner tech-label"
          style={{ border: "1px solid var(--danger)", color: "var(--danger)" }}
        >
          ✕
        </button>
      </div>
    </TechFrame>
  );
}

function AddPlanCard({
  onAdd,
}: {
  //categoryId: number;
  onAdd: (shots: number, price: number, disc: number) => Promise<void>;
}) {
  const [shots, setShots] = useState("");
  const [price, setPrice] = useState("");
  const [disc, setDisc] = useState("0");
  const [busy, setBusy] = useState(false);
  const valid =
    Number(shots) >= 1 &&
    Number(price) >= 50 &&
    Number(disc) >= 0 &&
    Number(disc) <= 100;
  const input = {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    color: "var(--ink)",
    padding: "0.5rem 0.6rem",
    width: "100%",
    fontFamily: "var(--font-display)",
  };

  return (
    <div className="clip-corner p-px" style={{ background: "var(--line)" }}>
      <div
        className="clip-corner p-4"
        style={{ background: "var(--surface-dim)" }}
      >
        <div className="tech-label mb-3" style={{ color: "var(--ink-muted)" }}>
          + New shot pack
        </div>
        <div className="space-y-2">
          <input
            style={input}
            type="number"
            placeholder="Shots"
            value={shots}
            onChange={(e) => setShots(e.target.value)}
          />
          <input
            style={input}
            type="number"
            placeholder="Price (Rs)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <input
            style={input}
            type="number"
            placeholder="Discount %"
            value={disc}
            onChange={(e) => setDisc(e.target.value)}
          />
          <button
            disabled={!valid || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onAdd(Number(shots), Number(price), Number(disc));
                setShots("");
                setPrice("");
                setDisc("0");
              } finally {
                setBusy(false);
              }
            }}
            className="w-full py-2 clip-corner tech-label"
            style={{
              background: valid ? "var(--accent)" : "var(--surface)",
              color: valid ? "#fff" : "var(--ink-muted)",
              cursor: valid ? "pointer" : "not-allowed",
              border: "1px solid var(--line)",
            }}
          >
            {busy ? "…" : "Add pack"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddCategoryCard({
  onAdd,
}: {
  onAdd: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <TechFrame className="p-5 mt-6">
      <div className="tech-label mb-3" style={{ color: "var(--ink-muted)" }}>
        + New gun category
      </div>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rifle"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            color: "var(--ink)",
            padding: "0.6rem 0.8rem",
            width: "100%",
            fontFamily: "var(--font-display)",
          }}
        />
        <button
          disabled={!name.trim() || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onAdd(name.trim());
              setName("");
            } finally {
              setBusy(false);
            }
          }}
          className="px-4 clip-corner tech-label shrink-0"
          style={{
            background: name.trim() ? "var(--accent)" : "var(--surface-dim)",
            color: name.trim() ? "#fff" : "var(--ink-muted)",
            cursor: name.trim() ? "pointer" : "not-allowed",
          }}
        >
          {busy ? "…" : "Add"}
        </button>
      </div>
    </TechFrame>
  );
}
