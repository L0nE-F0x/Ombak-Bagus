import { useState, type FormEvent, type ReactNode } from "react";
import { format, parseISO, isValid } from "date-fns";
import { BALI_SPOTS, getSpotById } from "../data/spots";
import { useAppStore } from "../store/useAppStore";
import type { SurfSession } from "../types";
import { formatWave } from "../services/units";

export function Sessions() {
 const sessions = useAppStore((s) => s.sessions);
 const addSession = useAppStore((s) => s.addSession);
 const deleteSession = useAppStore((s) => s.deleteSession);
 const selectSpot = useAppStore((s) => s.selectSpot);
 const units = useAppStore((s) => s.units);
 const [savedFlash, setSavedFlash] = useState(false);

 const [form, setForm] = useState({
 spotId: "uluwatu",
 date: format(new Date(), "yyyy-MM-dd"),
 startTime: "07:00",
 durationMinutes: 90,
 rating: 4,
 crowd: "moderate" as NonNullable<SurfSession["crowd"]>,
 board: "",
 notes: "",
 waveHeightEstimate: 1.2,
 });

 function submit(e: FormEvent) {
 e.preventDefault();
 addSession({
 spotId: form.spotId,
 date: form.date,
 startTime: form.startTime,
 durationMinutes: form.durationMinutes,
 rating: form.rating,
 crowd: form.crowd,
 board: form.board || undefined,
 notes: form.notes,
 waveHeightEstimate: form.waveHeightEstimate,
 });
 setForm((f) => ({ ...f, notes: "", board: "" }));
 setSavedFlash(true);
 window.setTimeout(() => setSavedFlash(false), 1800);
 }

 return (
 <div className="space-y-6">
 <header>
 <h1 className="page-title">
 Session log
 </h1>
 <p className="page-sub">
 Track where you surfed and how it actually was
 </p>
 </header>

 <form
 onSubmit={submit}
 className="glass rounded-2xl p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
 >
 <Field label="Spot">
 <select
 value={form.spotId}
 onChange={(e) => setForm({ ...form, spotId: e.target.value })}
 className="select"
 >
 {BALI_SPOTS.map((s) => (
 <option key={s.id} value={s.id}>
 {s.name}
 </option>
 ))}
 </select>
 </Field>
 <Field label="Date">
 <input
 type="date"
 value={form.date}
 onChange={(e) => setForm({ ...form, date: e.target.value })}
 className="input"
 required
 />
 </Field>
 <Field label="Start time">
 <input
 type="time"
 value={form.startTime}
 onChange={(e) => setForm({ ...form, startTime: e.target.value })}
 className="input"
 />
 </Field>
 <Field label="Duration (min)">
 <input
 type="number"
 min={15}
 step={15}
 value={form.durationMinutes}
 onChange={(e) =>
 setForm({ ...form, durationMinutes: Number(e.target.value) })
 }
 className="input"
 />
 </Field>
 <Field label={`Personal rating | ${form.rating}/5`}>
 <input
 type="range"
 min={1}
 max={5}
 value={form.rating}
 onChange={(e) =>
 setForm({ ...form, rating: Number(e.target.value) })
 }
 />
 <span className="text-sand-400 text-sm tracking-wide">
 {"★".repeat(form.rating)}
 <span className="text-ocean-700">{"★".repeat(5 - form.rating)}</span>
 </span>
 </Field>
 <Field label="Crowd">
 <select
 value={form.crowd}
 onChange={(e) =>
 setForm({
 ...form,
 crowd: e.target.value as NonNullable<SurfSession["crowd"]>,
 })
 }
 className="select"
 >
 <option value="empty">Empty</option>
 <option value="light">Light</option>
 <option value="moderate">Moderate</option>
 <option value="packed">Packed</option>
 </select>
 </Field>
 <Field label="Board">
 <input
 type="text"
 value={form.board}
 onChange={(e) => setForm({ ...form, board: e.target.value })}
 placeholder="e.g. 6'2 thruster"
 className="input"
 />
 </Field>
 <Field label="Est. wave height (m)">
 <input
 type="number"
 step={0.1}
 min={0}
 value={form.waveHeightEstimate}
 onChange={(e) =>
 setForm({
 ...form,
 waveHeightEstimate: Number(e.target.value),
 })
 }
 className="input"
 />
 </Field>
 <Field label="Notes" className="sm:col-span-2 lg:col-span-3">
 <textarea
 value={form.notes}
 onChange={(e) => setForm({ ...form, notes: e.target.value })}
 className="textarea"
 placeholder="Conditions, vibe, takeaways..."
 />
 </Field>
 <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3">
 <button type="submit" className="btn btn-primary">
 Log session
 </button>
 {savedFlash && (
 <span className="text-sm text-good font-medium">Saved</span>
 )}
 </div>
 </form>

 <div className="space-y-3">
 {sessions.length === 0 && (
 <p className="text-ocean-400 text-sm glass rounded-2xl p-6">
 No sessions logged yet. After a paddle, drop a quick note so you
 remember what worked.
 </p>
 )}
 {sessions.map((s) => {
 const spot = getSpotById(s.spotId);
 const d = parseISO(s.date);
 const dateLabel = isValid(d)
 ? format(d, "EEE d MMM yyyy")
 : s.date;
 return (
 <article
 key={s.id}
 className="glass rounded-2xl p-4 flex flex-wrap items-start justify-between gap-3"
 >
 <div className="min-w-0">
 <button
 type="button"
 onClick={() => selectSpot(s.spotId)}
 className="font-semibold text-foam hover:text-ocean-300"
 >
 {spot?.name ?? s.spotId}
 </button>
 <p className="text-sm text-ocean-400 mt-0.5">
 {dateLabel}
 {s.startTime ? ` | ${s.startTime}` : ""}
 {s.durationMinutes ? ` | ${s.durationMinutes} min` : ""}
 {s.crowd ? ` | ${s.crowd}` : ""}
 </p>
 <p className="text-sand-400 text-sm mt-1">
 {"★".repeat(s.rating)}
 <span className="text-ocean-700">
 {"★".repeat(5 - s.rating)}
 </span>
 {s.waveHeightEstimate != null
 ? ` | ~${formatWave(s.waveHeightEstimate, units.wave)}`
 : ""}
 {s.board ? ` | ${s.board}` : ""}
 </p>
 {s.notes && (
 <p className="text-sm text-ocean-300 mt-2 max-w-xl whitespace-pre-wrap">
 {s.notes}
 </p>
 )}
 </div>
 <button
 type="button"
 onClick={() => {
 if (window.confirm("Delete this session?")) {
 deleteSession(s.id);
 }
 }}
 className="btn btn-danger"
 >
 Delete
 </button>
 </article>
 );
 })}
 </div>
 </div>
 );
}

function Field({
 label,
 children,
 className = "",
}: {
 label: string;
 children: ReactNode;
 className?: string;
}) {
 return (
 <label className={`field ${className}`}>
 <span className="field-label">{label}</span>
 {children}
 </label>
 );
}
